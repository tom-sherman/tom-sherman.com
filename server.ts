import "@total-typescript/ts-reset";
import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "@remix-run/dev/server-build";

const handleRequest = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (context: Context) => ({
    env: context.env,
    waitUntil: context.waitUntil,
  }),
});

interface Env {
  GITHUB_TOKEN: string;
  DB: D1Database;
}

type Context = EventContext<Env, any, unknown>;

declare module "@remix-run/server-runtime" {
  interface AppLoadContext {
    env: Context["env"];
    waitUntil: Context["waitUntil"];
  }
}

export function onRequest(context: Context) {
  return handleRequest(context);
}
