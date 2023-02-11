import type { DataFunctionArgs } from "@remix-run/cloudflare";
import { createD1Kysely, D1BlogData } from "~/lib/blog-data.server";
import { HOST } from "~/constants";

export async function loader({ context }: DataFunctionArgs) {
  const blog = new D1BlogData(createD1Kysely(context.env.DB));

  const posts = await blog.listAllPosts();

  const blogUrl = new URL("/blog", HOST).toString();

  const rss = `
    <rss xmlns:blogChannel="${blogUrl}" version="2.0">
      <channel>
        <title>Tom Sherman Blog</title>
        <link>${blogUrl}</link>
        <description>Tom Sherman's blog</description>
        <language>en-gb</language>
        <generator>Remix</generator>
        <ttl>40</ttl>
        ${posts
          .map((post) =>
            `
            <item>
              <title>${cdata(post.title)}</title>
              <description>${cdata(
                post.description ?? "A new post on Tom Sherman's blog."
              )}</description>
              <pubDate>${new Intl.DateTimeFormat("fr-CA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(new Date(post.createdAt))}</pubDate>
              <link>${blogUrl}/${post.slug}</link>
              <guid>${blogUrl}/${post.slug}</guid>
            </item>
          `.trim()
          )
          .join("\n")}
      </channel>
    </rss>
  `.trim();

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Length": String(new TextEncoder().encode(rss).length),
    },
  });
}

function cdata(s: string) {
  return `<![CDATA[${s}]]>`;
}
