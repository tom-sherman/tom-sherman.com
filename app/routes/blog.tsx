import { Link, Outlet } from "@remix-run/react";
import { Copyright } from "~/components/copyright";

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
        </ul>
      </nav>
      <main className="container">
        <Outlet />
      </main>
      <footer className="container">
        <p>
          <Copyright />
        </p>
      </footer>
    </>
  );
}
