import { Outlet } from "@remix-run/react";
import { Copyright } from "~/components/copyright";

export default function Blog() {
  return (
    <>
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
