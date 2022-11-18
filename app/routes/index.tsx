import type { LoaderArgs } from "@remix-run/cloudflare";
import { defer } from "@remix-run/cloudflare";
import { Link, useLoaderData, Await } from "@remix-run/react";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { createD1Kysely, D1BlogData } from "~/blog-data.server";
import { Copyright } from "~/components/copyright";
import { MASTODON_URL } from "~/constants";

export async function loader({ context }: LoaderArgs) {
  const blog = new D1BlogData(createD1Kysely((context as any).env.DB));

  return defer({
    recentBlogPosts: blog.listAllPosts().then((posts) =>
      posts
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 3)
        .map((post) => ({
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
      <main className="container">
        <Me />

        <h2>Recent blog posts</h2>

        <Link to="/blog">View all blog posts</Link>
        <div className="grid">
          <Suspense fallback={<article aria-busy />}>
            <Await
              resolve={recentBlogPosts}
              errorElement={<p>Oops! Failed to load blog posts</p>}
            >
              {(posts) => (
                <>
                  <Link to="/blog">View all blog posts</Link>
                  {posts.map((post) => (
                    <article key={post.url}>
                      <header>{post.createdAt}</header>
                      <Link to={post.url}>
                        <h4>{post.title}</h4>
                      </Link>
                    </article>
                  ))}
                </>
              )}
            </Await>
          </Suspense>
        </div>

        <h2>Projects</h2>

        <Project
          name="Yet Another Javascript Minifier"
          url="https://tom-sherman.github.io/yet-another-js-online-minifier/"
          description={
            <p>
              There's a thousand of these available online but this one handles
              massive files without hanging the browser and supports ES6.
            </p>
          }
        />
        <Project
          name="Orangutan"
          url="https://github.com/tom-sherman/orangutan"
          description={
            <p>
              Written in Typescript, Orangutan is a lazy range and list library
              for JavaScript. It's heavily inspired by Haskell's lists and range
              syntax.
            </p>
          }
        />
        <Project
          name="CoffeeBird"
          url="https://github.com/tom-sherman/coffeebird"
          description={
            <p>
              RBLang is <a href="https://rainbird.ai">Rainbird</a>'s XML based
              language which is used to define concepts, relationships, and
              rules to solve complex decision making problems. CoffeeBird
              replicates all of the features of RBLang without the visual noise
              of XML.
            </p>
          }
        />
      </main>
      <footer className="container">
        <Copyright />
      </footer>
    </>
  );
}

function Me() {
  return (
    <>
      <img
        style={{ borderRadius: "50%", width: "10rem" }}
        src="/me.jpg"
        alt="Tom Sherman"
      />
      <h1>Tom Sherman</h1>
      <ul>
        <li>
          <a href="https://twitter.com/tomus_sherman" rel="me">
            Twitter @tomus_sherman
          </a>
        </li>
        <li>
          <a href="https://github.com/tom-sherman" rel="me">
            Github @tom-sherman
          </a>
        </li>
        <li>
          <a href="https://www.linkedin.com/in/tom-sherman-2a2aa0136/" rel="me">
            LinkedIn - Tom Sherman
          </a>
        </li>
        <li>
          <a rel="me" href={MASTODON_URL}>
            Mastodon
          </a>
        </li>
      </ul>
    </>
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
