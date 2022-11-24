import type {
  LinksFunction,
  LoaderArgs,
  SerializeFrom,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import {
  D1BlogData,
  createD1Kysely,
  renderPostToHtml,
} from "~/blog-data.server";
import { Chip } from "~/components/chip";
import { getHighlighter, setCDN } from "shiki";
import { useLayoutEffect, useRef } from "react";

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
      content: renderPostToHtml(post.content),
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
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const codeBlocks = contentRef.current?.querySelectorAll("pre code");
    if (!codeBlocks) return;

    const languages = new Set(
      Array.from(codeBlocks)
        .map((block) => {
          const lang = block.className.split("-")[1];
          return lang;
        })
        .filter((lang): lang is string => !!lang)
    );

    setCDN("https://unpkg.com/shiki@0.11.1/");
    getHighlighter({
      theme: "nord",
      langs: Array.from(languages) as any,
    }).then((highlighter) => {
      codeBlocks.forEach((code) => {
        const lang = code.className.split("-")[1];
        code.parentElement!.outerHTML = highlighter.codeToHtml(
          code.textContent || "",
          {
            lang,
          }
        );
      });
    });
  }, []);

  return (
    <>
      <div
        ref={contentRef}
        dangerouslySetInnerHTML={{
          __html: post.content,
        }}
      />
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
