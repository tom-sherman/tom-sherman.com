import type {
  LinksFunction,
  LoaderArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { D1BlogData, createD1Kysely } from "~/blog-data.server";
import { Chip } from "~/components/chip";
import { getHighlighter, setCDN } from "shiki";
import { useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "~/lib/use-isomorphic-layout-effect";
import readingTime from "reading-time";
import { parse as parseMarkdown } from "~/markdown.server";
import type { ComponentsConfig } from "~/lib/markdown-renderer";
import { MarkdownRenderer } from "~/lib/markdown-renderer";

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
      document: parseMarkdown(post.content),
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
  const imgUrl = new URL(
    "https://og-image-worker.tomsherman.workers.dev/img/og-blog"
  );
  imgUrl.searchParams.set("title", data.post.title);
  return {
    title: data.post.title,
    "og:title": data.post.title,
    "og:description": data.post.description,
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
      <div ref={contentRef}>
        <MarkdownRenderer
          document={post.document}
          components={componentsConfig}
        />
      </div>
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

const componentsConfig: ComponentsConfig = {
  paragraph: ({ children }) => <p>{children}</p>,
  heading: ({ children, node }) => {
    switch (node.depth) {
      case 1:
        return <h1>{children}</h1>;
      case 2:
        return <h2>{children}</h2>;
      case 3:
        return <h3>{children}</h3>;
      case 4:
        return <h4>{children}</h4>;
      case 5:
        return <h5>{children}</h5>;
      case 6:
        return <h6>{children}</h6>;
      default:
        return <h1>{children}</h1>;
    }
  },
  thematicBreak: () => <hr />,
  blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  list: ({ children }) => <ul>{children}</ul>,
  table: ({ children }) => <table>{children}</table>,
  listItem: ({ children }) => <li>{children}</li>,
  code: ({ node }) => (
    <pre>
      <code className={node.lang ? `language-${node.lang}` : undefined}>
        {node.value}
      </code>
    </pre>
  ),
  tableRow: ({ children }) => <tr>{children}</tr>,
  tableCell: ({ children }) => <td>{children}</td>,
  text: ({ node }) => <>{node.value}</>,
  emphasis: ({ children }) => <em>{children}</em>,
  strong: ({ children }) => <strong>{children}</strong>,
  delete: ({ children }) => <del>{children}</del>,
  inlineCode: ({ node }) => <code>{node.value}</code>,
  image: ({ node }) => <img src={node.url} alt={node.alt ?? undefined} />,
  link: ({ node, children }) => <a href={node.url}>{children}</a>,
};
