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
import type { Highlighter } from "shiki";
import { getHighlighter, setCDN } from "shiki";
import { useEffect, useState } from "react";
import readingTime from "reading-time";
import { parse as parseMarkdown } from "~/markdown.server";
import type { ComponentsConfig } from "~/lib/markdown-renderer";
import { MarkdownRenderer } from "~/lib/markdown-renderer";
import DataLoader from "dataloader";

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

  return (
    <>
      <small>
        {new Intl.DateTimeFormat("en-GB", {
          dateStyle: "long",
        }).format(new Date(post.createdAt))}{" "}
        - {post.readingTimeText}
      </small>
      <MarkdownRenderer
        document={post.document}
        components={componentsConfig}
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

async function highlight(code: string, lang: string, theme: string) {
  setCDN(`https://unpkg.com/shiki@${SHIKI_VERSION}/`);

  const highlighter = await highlighterLoader.load({ lang, theme });

  const html = highlighter.codeToHtml(code, { lang });

  const container = document.createElement("div");
  container.innerHTML = html;
  return container.querySelector("code")!.innerHTML;
}

const highlighterKeys = new Map<string, { lang: string; theme: string }>();
const highlighterLoader = new DataLoader<
  { lang: string; theme: string },
  Highlighter
>(
  async (keys) => {
    const highlighter = await getHighlighter({
      themes: keys.map((key) => key.theme),
      langs: keys.map((key) => key.lang) as any,
    });

    // We want to return a single highlighter, but data loader requires us to return a highlighter for each key.
    return keys.map(() => highlighter);
  },
  {
    cacheKeyFn(key) {
      const cacheKey = highlighterKeys.get(`${key.lang}-${key.theme}`);
      if (cacheKey) {
        return cacheKey;
      }

      highlighterKeys.set(`${key.lang}-${key.theme}`, key);
      return key;
    },
  }
);

function HighlightedCodeBlock({ code, lang }: { code: string; lang: string }) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setHighlightedHtml(null);

    highlight(
      code,
      lang,
      getTheme(window.matchMedia("(prefers-color-scheme: dark)"))
    ).then((html) => {
      if (!controller.signal.aborted) {
        setHighlightedHtml(html);
      }
    });

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
      "change",
      async (event) => {
        const html = await highlight(code, lang, getTheme(event));

        if (!controller.signal.aborted) {
          setHighlightedHtml(html);
        }
      },
      {
        signal: controller.signal,
      }
    );

    return () => controller.abort();
  }, [code, lang]);

  return (
    <pre>
      {highlightedHtml ? (
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      ) : (
        <code>{code}</code>
      )}
    </pre>
  );
}

function getTheme({ matches }: { matches: boolean }) {
  return matches ? "github-dark" : "github-light";
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
  code: ({ node }) =>
    node.lang ? (
      <HighlightedCodeBlock code={node.value} lang={node.lang} />
    ) : (
      <pre>
        <code>{node.value}</code>
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
