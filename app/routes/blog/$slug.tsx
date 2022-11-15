import type { LoaderArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { BlogData } from "~/blog-data.server";

export async function loader({ params, context }: LoaderArgs) {
  const blog = new BlogData(context as any);

  const slug = params.slug;

  if (!slug) {
    throw new Response("Not found", { status: 404 });
  }

  const post = await blog.getPost(slug);

  if (!post) {
    throw new Response("Not found", { status: 404 });
  }

  return json({
    post,
  });
}

export default function BlogPost() {
  const { post } = useLoaderData<typeof loader>();

  return <div dangerouslySetInnerHTML={{ __html: post.content }} />;
}
