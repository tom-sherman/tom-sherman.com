import type { LoaderArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { D1BlogData, createD1Kysely } from "~/blog-data.server";

export async function loader({ context }: LoaderArgs) {
  const blog = new D1BlogData(createD1Kysely((context as any).env.DB));

  return json({
    posts: await blog.listAllPosts(),
  });
}

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

      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
