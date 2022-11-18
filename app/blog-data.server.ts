import type { request as githubRequest } from "@octokit/request";
import type { ColumnType, Kysely, SelectType } from "kysely";
import { marked } from "marked";
import { z } from "zod";

const blogPostSchema = z.object({
  title: z.string(),
  createdAt: z.string(),
  tags: z.array(z.string()).default([]),
  content: z.string(),
  status: z
    .union([z.literal("unlisted"), z.literal("published")])
    .default("published"),
});

type BlogPost = z.TypeOf<typeof blogPostSchema>;

export interface BlogData {
  getPost: (slug: string) => Promise<BlogPost | null>;
  listAllPosts: () => Promise<BlogPost[]>;
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
    const { posts } = await this.#getManifest();
    const post = posts[slug];

    if (!post) {
      return null;
    }

    const content = await this.#getRawFileContents(`posts/${post.path}`);

    return {
      ...post,
      content: marked(content),
    };
  }

  async listAllPosts() {
    const { posts } = await this.#getManifest();

    return Object.entries(posts)
      .filter(([, post]) => post.status === "published")
      .map(([slug, post]) => ({ ...post, slug }));
  }

  async #getManifest() {
    const contents = await this.#getRawFileContents("manifest.json");

    return manifestSchema.parse(JSON.parse(contents));
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

const manifestSchema = z.object({
  posts: z.record(blogPostSchema.and(z.object({ path: z.string() }))),
});

type ContentsApiResponse = Awaited<
  ReturnType<typeof githubRequest<"GET /repos/{owner}/{repo}/contents/{path}">>
>;

function parseContentsResponse(res: ContentsApiResponse) {
  if (typeof res.data === "string") {
    return res.data;
  }

  throw new Error("Failed to get contents");
}

export interface BlogPostsTable {
  Slug: ColumnType<string>;
  Title: ColumnType<string>;
  Content: ColumnType<string>;
  CreatedAt: ColumnType<string>;
  LastModifiedAt: ColumnType<string>;
  Status: ColumnType<string>;
  Tags: ColumnType<string>;
}

type BlogPostRow = {
  [K in keyof BlogPostsTable]: SelectType<BlogPostsTable[K]>;
};

interface Database {
  BlogPosts: BlogPostsTable;
}

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
    const posts = await this.#db
      .selectFrom("BlogPosts")
      .selectAll()
      .where("Status", "=", "published")
      .execute();

    return posts.map(mapBlogPostRowToBlogPost);
  }

  async upsertPost(post: BlogPost & { slug: string }) {
    const values = {
      Slug: post.slug,
      Title: post.title,
      Content: post.content,
      CreatedAt: post.createdAt,
      LastModifiedAt: new Date().toISOString(),
      Status: post.status,
      Tags: JSON.stringify(post.tags),
    };

    await this.#db
      .insertInto("BlogPosts")
      .values(values)
      .onDuplicateKeyUpdate({ ...values, Slug: undefined })
      .execute();
  }
}

function mapBlogPostRowToBlogPost(selection: BlogPostRow) {
  return blogPostSchema.parse({
    title: selection.Title,
    createdAt: selection.CreatedAt,
    content: selection.Content,
    status: selection.Status,
    tags: JSON.parse(selection.Tags),
  });
}
