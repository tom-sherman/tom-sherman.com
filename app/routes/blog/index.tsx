import type { LoaderArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { D1BlogData, createD1Kysely } from "~/lib/blog-data.server";
import { PostList } from "~/components/post-list";

export async function loader({ context }: LoaderArgs) {
  const blog = new D1BlogData(createD1Kysely((context as any).env.DB));

  return json({
    posts: await blog.listAllPosts(),
  });
}

export const meta: MetaFunction = () => ({
  description: "Tom Sherman's mostly incoherent ramblings.",
});

export default function BlogIndex() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <>
      <h1>Tom's Blog</h1>
      <p>A space for my mostly incoherent ramblings.</p>
      <p>
        Got a question?{" "}
        <a href="https://github.com/tom-sherman/blog/discussions/new?category=AMA">
          Create a discussion
        </a>{" "}
        or <a href="https://twitter.com/tomus_sherman">DM me</a>!
      </p>

      <PostList
        posts={posts.map((post) => ({
          ...post,
          createdAt: new Date(post.createdAt),
        }))}
      />
    </>
  );
}
