import type {
  LinksFunction,
  DataFunctionArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import {
  D1BlogData,
  createD1Kysely,
  GitHubBlogData,
} from "~/lib/blog-data.server";
import { Chip } from "~/components/chip";
import readingTime from "reading-time";
import { request as githubRequest } from "@octokit/request";
import { useClientNavigationLinks } from "~/lib/use-client-navigation-links";
import { parseMarkdown } from "~/lib/markdown/markdown.server";
import type { RenderableTreeNode } from "@markdoc/markdoc";
import { Suspense } from "react";
import RenderMarkdown from "~/lib/markdown/renderer";
import { HighlightedCode } from "~/lib/shiki.client";
import { SHIKI_PATH } from "~/constants";

export async function loader({ params, context }: DataFunctionArgs) {
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

  return json(
    {
      post: {
        title: post.title,
        content: parseMarkdown(post.content),
        tags: post.tags,
        createdAt: post.createdAt,
        readingTimeText: readingTime(post.content).text,
        description: post.description,
        lastModifiedAt: post.lastModifiedAt,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30",
      },
    }
  );
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

// TODO: Figure out how to skip this preload on clientside navigations (if we've already seen a blog post)
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
      <PostContent content={post.content} />
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

interface Preprops {
  children: string;
  "data-language"?: string;
  theme: string;
}

function Pre({ children, "data-language": language }: Preprops) {
  const fallback = <code>{children}</code>;
  return (
    <pre className={`language-${language}`}>
      {language ? (
        <Suspense fallback={fallback}>
          <HighlightedCode language={language}>{children}</HighlightedCode>
        </Suspense>
      ) : (
        fallback
      )}
    </pre>
  );
}

const components = {
  pre: Pre,
};

const PostContent = function PostContent({
  content,
}: {
  content: RenderableTreeNode;
}) {
  return <RenderMarkdown content={content} components={components} />;
};

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
