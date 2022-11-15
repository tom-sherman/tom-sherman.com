import { request as githubRequest } from "@octokit/request";
import { marked } from "marked";
import { z } from "zod";

const postCachePromise = caches.open("post_cache");

export class BlogData {
  #gh: ReturnType<
    typeof githubRequest.defaults<{
      headers: {
        authorization: string;
        accept: string;
      };
    }>
  >;

  constructor(context: ExecutionContext) {
    const githubFetchWithCache: typeof globalThis.fetch = async (
      request,
      init
    ) => {
      const cache = await postCachePromise;
      let response = await cache.match(request);

      if (!response) {
        response = await fetch(request, init);
        response = new Response(response.body, response);
        response.headers.set("Cache-Control", "s-maxage=60");
        // context.waitUntil(cache.put(request, response.clone()));
      }

      return response;
    };

    this.#gh = githubRequest.defaults({
      request: {
        fetch: githubFetchWithCache,
      },
      headers: {
        authorization: `token ${(context as any).env.GITHUB_TOKEN}`,
        accept: "application/vnd.github.v3+json",
      },
    });
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
  posts: z.record(
    z.object({
      title: z.string(),
      createdAt: z.string(),
      path: z.string(),
      tags: z.array(z.string()).default([]),
      status: z
        .union([z.literal("unlisted"), z.literal("published")])
        .default("published"),
    })
  ),
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
