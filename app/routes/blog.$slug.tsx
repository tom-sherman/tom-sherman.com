import type {
  LinksFunction,
  LoaderArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import {
  D1BlogData,
  createD1Kysely,
  renderPostToHtml,
  GitHubBlogData,
} from "~/lib/blog-data.server";
import { Chip } from "~/components/chip";
import { getHighlighter, setCDN } from "shiki";
import { useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "~/lib/use-isomorphic-layout-effect";
import readingTime from "reading-time";
import { request as githubRequest } from "@octokit/request";
import { useClientNavigationLinks } from "~/lib/use-client-navigation-links";

const SHIKI_PATH = "/build/shiki";

export async function loader({ params, context }: LoaderArgs) {
  const blog = new D1BlogData(createD1Kysely(context.env.DB));

  const slug = params.slug;

  if (!slug) {
    throw new Response("Not found", { status: 404 });
  }

  const post = await blog.getPost(slug);

  if (!post) {
    const github = new GitHubBlogData(
      githubRequest.defaults({
        headers: {
          authorization: `token ${context.env.GITHUB_TOKEN}`,
          accept: "application/vnd.github.v3+json",
        },
      })
    );

    try {
      const resolvedSlug = await github.getPostSlugByPath(`posts/${slug}`);
      return redirect(`/blog/${resolvedSlug}`, { status: 301 });
    } catch (e) {
      if ((e as any)?.status !== 404) {
        throw e;
      }
      console.log(e);
    }
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
      lastModifiedAt: post.lastModifiedAt,
    },
  });
}

export const meta: MetaFunction = ({
  data,
}: {
  data: SerializeFrom<typeof loader>;
}) => {
  const imgUrl = new URL(
    "https://og-image-worker.tomsherman.workers.dev/img/og-blog"
  );
  imgUrl.searchParams.set("title", data.post.title);
  return {
    title: data.post.title,
    "og:title": data.post.title,
    "og:description": data.post.description,
    description: data.post.description,
    "twitter:description": data.post.description,
    "og:type": "article",
    author: "Tom Sherman",
    "twitter:card": "summary_large_image",
    "og:image": imgUrl.toString(),
    "twitter:image": imgUrl.toString(),
  };
};

export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: `${SHIKI_PATH}/dist/onig.wasm`,
    as: "fetch",
    crossOrigin: "anonymous",
  },
];

export default function BlogPost() {
  useClientNavigationLinks();
  const { post } = useLoaderData<typeof loader>();
  const contentRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    highlightBlocks(
      contentRef.current!,
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }, [post.content]);

  useEffect(() => {
    function changeListener(event: MediaQueryListEvent) {
      highlightBlocks(contentRef.current!, event.matches);
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");

    query.addEventListener("change", changeListener);

    return () => {
      query.removeEventListener("change", changeListener);
    };
  }, [post.content]);

  const lastModifiedAt = post.lastModifiedAt
    ? new Date(post.lastModifiedAt)
    : null;
  const createdAt = new Date(post.createdAt);

  return (
    <>
      <small>
        {new Intl.DateTimeFormat("en-GB", {
          dateStyle: "long",
        }).format(createdAt)}{" "}
        - {post.readingTimeText}
      </small>
      <div
        ref={contentRef}
        dangerouslySetInnerHTML={{
          __html: post.content,
        }}
      />
      <hr />
      {lastModifiedAt && !isSameDay(createdAt, lastModifiedAt) ? (
        <p>
          <small>
            <em>
              This article was last updated on{" "}
              {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "long",
              }).format(lastModifiedAt)}
            </em>
          </small>
        </p>
      ) : null}
      <ul className="chip-list">
        {post.tags.map((tag) => (
          <Link to={`/blog/tags/${tag}`} key={tag}>
            <Chip as="li">{tag}</Chip>
          </Link>
        ))}
      </ul>
    </>
  );
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
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

  setCDN(`${SHIKI_PATH}/`);
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
