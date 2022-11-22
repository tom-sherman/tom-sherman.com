import { z } from "zod";
import { verify } from "@octokit/webhooks-methods";
import { createD1Kysely, D1BlogData, GitHubBlogData } from "~/blog-data.server";
import { request as githubRequest } from "@octokit/request";

export const onRequest: PagesFunction<{
  BLOG_WEBHOOK_SECRET: string;
  DB: D1Database;
  GITHUB_TOKEN: string;
}> = async ({ request, env }) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = request.headers.get("x-hub-signature-256");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }
  const body = await request.clone().text();

  console.log(env.BLOG_WEBHOOK_SECRET);

  const verified = await verify(env.BLOG_WEBHOOK_SECRET, body, signature);

  if (!verified) {
    return new Response("Not authorised", { status: 403 });
  }

  const parseResult = pushEventSchema.safeParse(JSON.parse(body));
  if (!parseResult.success) {
    return new Response("Invalid payload", { status: 400 });
  }

  const changes = flattenChanges(parseResult.data);
  const db = new D1BlogData(createD1Kysely(env.DB));
  const github = new GitHubBlogData(
    githubRequest.defaults({
      headers: {
        authorization: `token ${env.GITHUB_TOKEN}`,
        accept: "application/vnd.github.v3+json",
      },
    })
  );

  console.log("Processing changes", changes);

  // The following is not parrelised in case a file exists in both filesToAddOrModify and filesToRemove
  // Running this serially ensures that the database always ends up in a consistent state given the same push event
  await db.deletePostsByPath(...changes.filesToRemove);
  const postsToUpsert = await Promise.all(
    changes.filesToAddOrModify.map((path) => github.getPostByPath(path))
  );
  await db.upsertPosts(...postsToUpsert);

  return new Response("OK", { status: 200 });
};

function flattenChanges(event: PushEvent) {
  const filesToAddOrModify = new Set<string>();
  const filesToRemove = new Set<string>();

  for (const commit of event.commits) {
    for (const file of commit.added.concat(commit.modified)) {
      filesToAddOrModify.add(file);
    }

    for (const file of commit.removed) {
      filesToRemove.add(file);
      filesToAddOrModify.delete(file);
    }
  }

  return {
    filesToAddOrModify: [...filesToAddOrModify],
    filesToRemove: [...filesToRemove],
  };
}

type PushEvent = z.infer<typeof pushEventSchema>;

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
