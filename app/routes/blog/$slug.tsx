import type { LoaderArgs, SerializeFrom } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { marked } from "marked";
import { D1BlogData, createD1Kysely } from "~/blog-data.server";
import { Chip } from "~/components/chip";

export async function loader({ params, context }: LoaderArgs) {
  const blog = new D1BlogData(createD1Kysely((context as any).env.DB));

  const slug = params.slug;

  if (!slug) {
    throw new Response("Not found", { status: 404 });
  }

  const post = await blog.getPost(slug);

  if (!post) {
    throw new Response("Not found", { status: 404 });
  }

  return json({
    post: {
      title: post.title,
      content: marked(post.content),
      tags: post.tags,
    },
  });
}

export const meta = ({ data }: { data: SerializeFrom<typeof loader> }) => {
  return {
    title: data.post.title,
    "og:title": data.post.title,
    "og:description": "A blog post by Tom Sherman",
    "og:image": "/me.jpg",
  };
};

export default function BlogPost() {
  const { post } = useLoaderData<typeof loader>();

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      <ul className="chip-list blog-tags">
        {post.tags.map((tag) => (
          <Link to={`/blog/tags/${tag}`} key={tag}>
            <Chip as="li">{tag}</Chip>
          </Link>
        ))}
      </ul>
    </>
  );
}
