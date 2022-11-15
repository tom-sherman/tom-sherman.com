import type { LinksFunction, MetaFunction } from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import picoCss from "@picocss/pico/css/pico.min.css";
import { MASTODON_URL } from "./constants";
import { StrictMode } from "react";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Tom Sherman",
  viewport: "width=device-width, initial-scale=1",
  "og:title": "Tom Sherman | Software Engineer",
  "og:description": "Tom Sherman is a Senior Software Engineer @ OVO",
  "og:image": "/me.jpg",
  "msapplication-TileColor": "#9b4dca",
  "theme-color": "#9b4dca",
  "twitter:card": "summary",
  "twitter:site": "@tomus_sherman",
  "twitter:title": "Tom Sherman",
  "twitter:description": "Twiddling bits, suspending views, managing state.",
  "twitter:image": "/me.jpg",
});

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: "/apple-touch-icon.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon-16x16.png",
  },
  {
    rel: "me",
    href: MASTODON_URL,
  },
];

export default function App() {
  return (
    <StrictMode>
      <html lang="en">
        <head>
          <Meta />
          <Links />
        </head>
        <body>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    </StrictMode>
  );
}
