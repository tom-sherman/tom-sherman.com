import type { LoaderArgs, SerializeFrom } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { D1BlogData, createD1Kysely } from "~/lib/blog-data.server";
import { Chip } from "~/components/chip";
import { PostList } from "~/components/post-list";

export const loader = async ({ params, context }: LoaderArgs) => {
  const tag = params.tag;

  if (!tag) {
    throw new Response("Not found", { status: 404 });
  }

  const blog = new D1BlogData(createD1Kysely((context as any).env.DB));

  const posts = await blog.listPostsByTag(tag);

  return json({
    posts,
    tag,
  });
};

export const meta = ({ data }: { data: SerializeFrom<typeof loader> }) => {
  return {
    title: `Posts tagged ${data.tag}`,
  };
};

export default function BlogTag() {
  const { posts, tag } = useLoaderData<typeof loader>();

  return (
    <>
      <h1>
        Posts tagged with <Chip>{tag}</Chip>
      </h1>
      <PostList
        posts={posts.map((post) => ({
          ...post,
          createdAt: new Date(post.createdAt),
        }))}
      />
    </>
  );
}
