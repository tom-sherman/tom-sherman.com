import type { request as githubRequest } from "@octokit/request";
import type { SelectType } from "kysely";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { marked } from "marked";
import { z } from "zod";

const frontMatterTagsSchema = z.array(z.string());
const frontMatterStatusSchema = z.union([
  z.literal("unlisted"),
  z.literal("published"),
]);

const frontMatterSchema = z.object({
  title: z.string(),
  createdAt: z.string(),
  tags: frontMatterTagsSchema.default([]),
  slug: z.string(),
  status: frontMatterStatusSchema.default("published"),
  description: z
    .string()
    .optional()
    .transform((value) => value ?? null),
});

interface PostMeta extends z.TypeOf<typeof frontMatterSchema> {
  path: string;
}

interface BlogPost extends PostMeta {
  content: string;
  lastModifiedAt: string | null;
}

export interface BlogData {
  getPost: (slug: string) => Promise<BlogPost | null>;
  listAllPosts: () => Promise<PostMeta[]>;
}

type GitHubClient = ReturnType<
  typeof githubRequest.defaults<{
    headers: {
      authorization: string;
      accept: string;
    };
  }>
>;

export class GitHubBlogData implements BlogData {
  #gh: GitHubClient;

  constructor(gh: GitHubClient) {
    this.#gh = gh;
  }

  async getPost(slug: string) {
    return (
      (await this.#listAllPostsWithContents()).find(
        (post) => post.slug === slug
      ) ?? null
    );
  }

  async listAllPosts() {
    return (await this.#listAllPostsWithContents())
      .map(({ content, ...meta }) => meta)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async #getPostDataByPath(path: string) {
    const content = await this.#getRawFileContents(path);
    const fontMatter = parseFrontMatter(content);

    return {
      content: content.slice(fontMatter.contentStart),
      ...fontMatter.attributes,
    };
  }

  async getPostSlugByPath(path: string) {
    const postData = await this.#getPostDataByPath(path);
    return postData.slug;
  }

  async getPostByPath(path: string) {
    const postData = await this.#getPostDataByPath(path);

    const commits = await this.#gh(`GET /repos/{owner}/{repo}/commits`, {
      owner: "tom-sherman",
      repo: "blog",
      path,
    });

    return {
      path,
      ...postData,
      lastModifiedAt:
        commits.data.length < 2
          ? null
          : commits.data[0]?.commit.committer?.date ?? null,
    };
  }

  async #listAllPostsWithContents() {
    const result = await this.#gh(`GET /repos/{owner}/{repo}/contents/posts/`, {
      owner: "tom-sherman",
      repo: "blog",
    });

    const files = z
      .array(
        z.object({
          type: z.literal("file"),
          path: z.string(),
          sha: z.string(),
        })
      )
      .parse(result.data);

    return Promise.all(files.map(({ path }) => this.getPostByPath(path)));
  }

  async #getRawFileContents(path: string) {
    const contents = await this.#gh(
      `GET /repos/{owner}/{repo}/contents/{path}`,
      {
        owner: "tom-sherman",
        repo: "blog",
        path,
        headers: {
          accept: "application/vnd.github.v3.raw",
        },
      }
    );

    return parseContentsResponse(contents);
  }
}

type ContentsApiResponse = Awaited<
  ReturnType<typeof githubRequest<"GET /repos/{owner}/{repo}/contents/{path}">>
>;

function parseContentsResponse(res: ContentsApiResponse) {
  if (typeof res.data === "string") {
    return res.data as string;
  }

  throw new Error("Failed to get contents");
}

export interface BlogPostsTable {
  Slug: string;
  Title: string;
  Content: string;
  CreatedAt: string;
  LastModifiedAt: string | null;
  Status: string;
  Tags: string;
  Path: string;
  Description: string | null;
}

type BlogPostRow = {
  [K in keyof BlogPostsTable]: SelectType<BlogPostsTable[K]>;
};

interface Database {
  BlogPosts: BlogPostsTable;
}

export const createD1Kysely = (d1: D1Database) =>
  new Kysely<Database>({
    dialect: new D1Dialect({
      database: d1,
    }),
  });

export class D1BlogData implements BlogData {
  #db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.#db = db;
  }

  async getPost(slug: string) {
    const post = await this.#db
      .selectFrom("BlogPosts")
      .selectAll()
      .where("Slug", "=", slug)
      .executeTakeFirst();

    if (!post) {
      return null;
    }

    return mapBlogPostRowToBlogPost(post);
  }

  async listAllPosts() {
    const posts = await this.#allPostsQuery().execute();

    return posts.map(mapBlogPostRowToBlogPost);
  }

  async list3RecentPosts() {
    const posts = await this.#allPostsQuery().limit(3).execute();

    return posts.map(mapBlogPostRowToBlogPost);
  }

  async listPostsByTag(tag: string) {
    const posts = await this.#allPostsQuery()
      .where("Tags", "like", `%"${tag}"%`)
      .execute();

    return posts.map(mapBlogPostRowToBlogPost);
  }

  #allPostsQuery() {
    return this.#db
      .selectFrom("BlogPosts")
      .selectAll()
      .where("Status", "=", "published")
      .orderBy("CreatedAt", "desc");
  }

  // TODO: This should be a stored procedure to prevent concurrency bugs that could happen between deleting and inserting
  async upsertPosts(...posts: BlogPost[]) {
    const values = posts.map((post) => ({
      Slug: post.slug,
      Title: post.title,
      Content: post.content,
      CreatedAt: post.createdAt,
      Status: post.status,
      Tags: JSON.stringify(post.tags),
      Path: post.path,
      Description: post.description,
      LastModifiedAt: post.lastModifiedAt,
    }));

    await this.#db
      .deleteFrom("BlogPosts")
      .where(
        "Path",
        "in",
        posts.map((p) => p.path)
      )
      .execute();

    await this.#db.insertInto("BlogPosts").values(values).execute();
  }

  async deletePostsByPath(...paths: string[]) {
    await this.#db.deleteFrom("BlogPosts").where("Path", "in", paths).execute();
  }

  async listAllTags() {
    const rows = await this.#db
      .selectFrom("BlogPosts")
      .select("Tags")
      .execute();

    const tags = new Set<string>();

    for (const row of rows) {
      const parsedTags = z.array(z.string()).parse(JSON.parse(row.Tags));
      for (const tag of parsedTags) {
        tags.add(tag);
      }
    }

    return [...tags].sort();
  }
}

function mapBlogPostRowToBlogPost(selection: BlogPostRow) {
  return {
    slug: selection.Slug,
    path: selection.Path,
    title: selection.Title,
    createdAt: selection.CreatedAt,
    content: selection.Content,
    status: frontMatterStatusSchema.parse(selection.Status),
    tags: frontMatterTagsSchema.parse(JSON.parse(selection.Tags)),
    description: selection.Description,
    lastModifiedAt: selection.LastModifiedAt,
  };
}

const frontMatterRe = /^---$(?<frontMatter>.*?)^---$/ms;
const frontMatterKeyValueRe = /^(?<key>[^:]+):(?<value>.*)$/m;
function parseFrontMatter(input: string) {
  const match = input.match(frontMatterRe);
  const frontMatterContent = match?.groups?.frontMatter?.trim();

  if (frontMatterContent == null) {
    throw new Error("Failed to parse front matter");
  }

  const contentStart = 2 * "---\n".length + frontMatterContent.length;

  const frontMatter = Object.fromEntries(
    frontMatterContent.split("\n").map((line, index) => {
      const match = line.match(frontMatterKeyValueRe);
      const key = match?.groups?.key;
      const value = match?.groups?.value;

      if (!key || !value) {
        throw new Error(
          `Failed to parse front matter at line ${index + 1}: "${line}"`
        );
      }

      return [key, JSON.parse(value)];
    })
  );

  return {
    contentStart,
    attributes: frontMatterSchema.parse(frontMatter),
  };
}

export function renderPostToHtml(content: string) {
  return marked(content);
}
