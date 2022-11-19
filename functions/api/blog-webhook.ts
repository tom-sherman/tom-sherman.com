import { z } from "zod";

export const onRequest: PagesFunction<{
  BLOG_WEBHOOK_SECRET: string;
}> = async ({ request, env }) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = request.headers.get("x-hub-signature-256");
  console.log("signature", signature);
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const encoder = new TextEncoder();
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }
  const body = await request.clone().text();

  const verified = await crypto.subtle.verify(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.BLOG_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["verify"]
    ),
    encoder.encode(signature.replace("sha256=", "")),
    encoder.encode(body)
  );

  if (!verified) {
    return new Response("Not authorised", { status: 403 });
  }

  const parseResult = pushEventSchema.safeParse(JSON.parse(body));
  if (!parseResult.success) {
    return new Response("Invalid payload", { status: 400 });
  }
  const event = parseResult.data;

  if (signature) console.log("Incoming webook");
  console.log(request.url);
  console.log(event);

  return new Response("OK", { status: 200 });
};

const pushEventSchema = z.object({
  ref: z.string(),
  commits: z.array(
    z.object({
      id: z.string(),
      added: z.array(z.string()),
      removed: z.array(z.string()),
      modified: z.array(z.string()),
    })
  ),
});
