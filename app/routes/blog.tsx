import type { MetaFunction } from "@remix-run/cloudflare";
import { Link, Outlet } from "@remix-run/react";
import { Me } from "~/components/about-me";
import { Copyright } from "~/components/copyright";

export const meta: MetaFunction = () => ({
  title: "Blog | Tom Sherman",
});

export default function Blog() {
  return (
    <>
      <nav className="container">
        <ul>
          <li>
            <strong>Tom's blog</strong>
          </li>
        </ul>
        <ul>
          <li>
            <Link to="/blog">All posts</Link>
          </li>
          <li>
            <Link to="/">
              <span role="img" aria-label="Home">
                🏠
              </span>
            </Link>
          </li>
        </ul>
      </nav>
      <main className="container">
        <Outlet />
      </main>
      <section className="container">
        <article>
          <Me />
        </article>
      </section>
      <footer className="container">
        <p>
          <Copyright />
        </p>
      </footer>
    </>
  );
}
