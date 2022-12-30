import type { LoaderArgs } from "@remix-run/cloudflare";
import { defer } from "@remix-run/cloudflare";
import { Link, useLoaderData, Await } from "@remix-run/react";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { createD1Kysely, D1BlogData } from "~/blog-data.server";
import { Copyright } from "~/components/copyright";
import { PostTitle } from "~/components/post-list";
import { MASTODON_URL } from "~/constants";

export async function loader({ context }: LoaderArgs) {
  const blog = new D1BlogData(createD1Kysely((context as any).env.DB));

  return defer({
    recentBlogPosts: blog.list3RecentPosts().then((posts) =>
      posts.map((post) => ({
        title: post.title,
        url: `/blog/${post.slug}`,
        createdAt: new Intl.DateTimeFormat("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(post.createdAt)),
      }))
    ),
  });
}

export default function Index() {
  const { recentBlogPosts } = useLoaderData<typeof loader>();

  return (
    <>
      <Me />
      <main className="container">
        <h2>Recent blog posts</h2>

        <Suspense fallback={<BlogPostsSkeleton />}>
          <Await
            resolve={recentBlogPosts}
            errorElement={<p>Oops! Failed to load blog posts</p>}
          >
            {(posts) => (
              <>
                <Link to="/blog">View all blog posts</Link>
                <div className="grid">
                  {posts.map((post) => (
                    <article key={post.url}>
                      <header>{post.createdAt}</header>
                      <Link to={post.url}>
                        <PostTitle as="h4" title={post.title} />
                      </Link>
                    </article>
                  ))}
                </div>
              </>
            )}
          </Await>
        </Suspense>

        <h2>Projects</h2>

        <Project
          name="Serverless XState"
          url="https://github.com/tom-sherman/serverless-xstate"
          description={
            <p>
              An architecture and example implementation for building serverless
              applications using{" "}
              <a href="https://github.com/statelyai/xstate">XState</a>.
            </p>
          }
        />
        <Project
          name="immurl"
          url="https://github.com/tom-sherman/immurl"
          description={
            <p>
              🔗 A tiny ({"<"} 500B), 0-dependency, immutable URL library,
              backed by the native whatwg URL. 🎉 Now with immutable{" "}
              <code>Headers</code> support!
            </p>
          }
        />
        <Project
          name="response-multipart"
          url="https://github.com/tom-sherman/response-multipart"
          description={
            <>
              <p>
                Standards-inspired <code>multipart/*</code> parsing. It's like
                <code>response.text()</code> but for multipart bodies!
              </p>
              <ul>
                <li>
                  100% standards compliant and isomorphic. Use it in the
                  browser, Cloudflare Workers, Deno, and whatever new JS
                  environment was created last week
                </li>
                <li>
                  Support all multipart bodies: <code>multipart/form-data</code>
                  ,<code>multipart/mixed</code>, <code>multipart/digest</code>,
                  and
                  <code>multipart/parallel</code>
                </li>
                <li>Support nested multipart bodies</li>
              </ul>
            </>
          }
        />
      </main>
      <footer className="container">
        <Copyright />
      </footer>
    </>
  );
}

function BlogPostsSkeleton() {
  return (
    <>
      <div
        aria-busy
        className="grid"
        style={{
          // This magic number is a bit of a hack, it's the height of the "view all blog posts" link
          height: 28,
        }}
      />
      <div
        className="grid skeleton"
        style={{ cursor: "progress", userSelect: "none" }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <article key={i}>
            <header>███████████</header>
            <h4>████████████████</h4>
          </article>
        ))}
      </div>
    </>
  );
}

function Me() {
  return (
    <section className="about-me">
      <img
        style={{ borderRadius: "50%", width: "10rem", height: "10rem" }}
        src="/me.jpg"
        alt="Tom Sherman"
      />
      <h1>Tom Sherman</h1>
      <ul>
        <li>
          <a rel="me" href={MASTODON_URL} title="Mastodon">
            <img src="/mastodon.svg" alt="" />
          </a>
        </li>
        <li>
          <a href="https://twitter.com/tomus_sherman" rel="me" title="Twitter">
            <img src="/twitter.svg" alt="" />
          </a>
        </li>
        <li>
          <a href="https://github.com/tom-sherman" rel="me" title="GitHub">
            <img src="/github.svg" alt="" />
          </a>
        </li>
        <li>
          <a
            href="https://www.linkedin.com/in/tom-sherman-2a2aa0136/"
            title="LinkedIn"
            rel="me"
          >
            <img src="/linkedin.svg" alt="" />
          </a>
        </li>
      </ul>
    </section>
  );
}

interface ProjectProps {
  name: string;
  url: string;
  description: ReactNode;
}

function Project({ name, url, description }: ProjectProps) {
  return (
    <article className="project">
      <h3>
        <a href={url}>{name}</a>
      </h3>
      {description}
    </article>
  );
}
