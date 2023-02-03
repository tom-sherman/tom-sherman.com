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
  if (!responseHeaders.has("Content-Type")) {
    responseHeaders.set("Content-Type", "text/html; charset=utf-8");
  }

  const controller = new AbortController();
  const stream = await renderToReadableStream(
    <RemixServer context={remixContext} url={request.url} />,
    {
      signal: controller.signal,
      onError(error) {
        console.error(error);
      },
    }
  );

  if (isbot(request.headers.get("user-agent"))) {
    await stream.allReady;
  }

  return new Response(stream, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
