import type {
  LinksFunction,
  LoaderArgs,
  MetaFunction,
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
import { useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "~/lib/use-isomorphic-layout-effect";
import readingTime from "reading-time";

const SHIKI_VERSION = "0.11.1";

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
      createdAt: post.createdAt,
      readingTimeText: readingTime(post.content).text,
      description: post.description,
    },
  });
}

export const meta: MetaFunction = ({
  data,
}: {
  data: SerializeFrom<typeof loader>;
}) => {
  return {
    title: data.post.title,
    "og:title": data.post.title,
    "og:description": data.post.description,
    "twitter:description": data.post.description,
    "og:type": "article",
    author: "Tom Sherman",
    "twitter:card": "summary",
  };
};

export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: `https://unpkg.com/shiki@${SHIKI_VERSION}/dist/onig.wasm`,
    as: "fetch",
    crossOrigin: "anonymous",
  },
];

export default function BlogPost() {
  const { post } = useLoaderData<typeof loader>();
  const contentRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    highlightBlocks(
      contentRef.current!,
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }, []);

  useEffect(() => {
    function changeListener(event: MediaQueryListEvent) {
      highlightBlocks(contentRef.current!, event.matches);
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");

    query.addEventListener("change", changeListener);

    return () => {
      query.removeEventListener("change", changeListener);
    };
  }, []);

  return (
    <>
      <small>
        {new Intl.DateTimeFormat("en-GB", {
          dateStyle: "long",
        }).format(new Date(post.createdAt))}{" "}
        - {post.readingTimeText}
      </small>
      <div
        ref={contentRef}
        dangerouslySetInnerHTML={{
          __html: post.content,
        }}
      />
      <hr />
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

function highlightBlocks(container: HTMLElement, prefersDarkMode: boolean) {
  const codeBlocks = container.querySelectorAll("pre code");

  const codeBlocksArray = Array.from(codeBlocks);

  const languages = new Set(
    codeBlocksArray
      .map((block) => {
        const lang = block.className.split("-")[1];
        return lang;
      })
      .filter((lang): lang is string => !!lang)
  );

  setCDN(`https://unpkg.com/shiki@${SHIKI_VERSION}/`);
  getHighlighter({
    theme: prefersDarkMode ? "github-dark" : "github-light",
    langs: Array.from(languages) as any,
  }).then((highlighter) => {
    codeBlocksArray.forEach((code) => {
      const lang = code.className.split("-")[1];
      const container = document.createElement("div");
      container.innerHTML = highlighter.codeToHtml(code.textContent || "", {
        lang,
      });

      const newCode = container.querySelector("code")!;
      newCode.className = code.className;

      code.replaceWith(newCode);
    });
  });
}
