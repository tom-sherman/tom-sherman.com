import type { EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import { renderToReadableStream } from "react-dom/server";
import isbot from "isbot";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  let modules = Object.entries(remixContext.manifest.routes);
  let http2PushLinksHeaders = remixContext.staticHandlerContext.matches
    .flatMap((match) => {
      let routeMatch = modules.find((m) => m[0] === match.route.id);
      if (!routeMatch) return [];
      let routeImports = routeMatch[1]?.imports ?? [];
      return [routeMatch[1]?.module, ...routeImports];
    })
    .filter(Boolean)
    .concat([
      remixContext.manifest.url,
      remixContext.manifest.entry.module,
      ...remixContext.manifest.entry.imports,
    ]);

  responseHeaders.set(
    "Link",
    http2PushLinksHeaders
      .map((link) => `<${link}>; rel=preload; as=script; crossorigin=anonymous`)
      .concat(responseHeaders.get("Link") ?? "")
      .filter(Boolean)
      .join()
  );

  if (!responseHeaders.has("Content-Type")) {
    responseHeaders.set("Content-Type", "text/html; charset=utf-8");
  }

  const controller = new AbortController();
  let didError = false;
  const stream = await renderToReadableStream(
    <RemixServer context={remixContext} url={request.url} />,
    {
      signal: controller.signal,
      onError(error) {
        didError = true;
        console.error(error);
      },
    }
  );

  if (isbot(request.headers.get("user-agent"))) {
    await stream.allReady;
  }

  return new Response(stream, {
    status: didError ? 500 : responseStatusCode,
    headers: responseHeaders,
  });
}
