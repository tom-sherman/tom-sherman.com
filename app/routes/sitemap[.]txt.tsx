import type { DataFunctionArgs } from "@remix-run/cloudflare";
import { createD1Kysely, D1BlogData } from "~/lib/blog-data.server";
import { HOST } from "~/constants";

export async function loader({ context }: DataFunctionArgs) {
  const blog = new D1BlogData(createD1Kysely(context.env.DB));

  const [posts, tags] = await Promise.all([
    blog.listAllPosts(),
    blog.listAllTags(),
  ]);

  const postUrls = posts.map((post) =>
    new URL(`/blog/${post.slug}`, HOST).toString()
  );

  const tagUrls = tags.map((tag) =>
    new URL(`/blog/tags/${tag}`, HOST).toString()
  );

  const allUrls = [
    new URL("/", HOST).toString(),
    new URL("/blog", HOST).toString(),
    ...postUrls,
    ...tagUrls,
  ];

  return new Response(allUrls.join("\n"), {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
