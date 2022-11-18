import Database from "better-sqlite3";
import { Kysely, sql, SqliteDialect } from "kysely";
import type { BlogPostsTable } from "~/blog-data.server";
import { GitHubBlogData } from "~/blog-data.server";
import { request as githubRequest } from "@octokit/request";
import * as dotenv from "dotenv";
import * as path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), ".dev.vars"),
});

const db = new Kysely<{
  BlogPosts: BlogPostsTable;
}>({
  dialect: new SqliteDialect({
    database: new Database(".wrangler/state/d1/DB.sqlite3"),
  }),
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS BlogPosts (
      Slug TEXT NOT NULL PRIMARY KEY,
      Title TEXT NOT NULL,
      Content TEXT NOT NULL,
      CreatedAt TEXT NOT NULL,
      LastModifiedAt TEXT NOT NULL,
      Status TEXT NOT NULL,
      Tags TEXT NOT NULL
    );
  `.execute(db);

  const githubData = new GitHubBlogData(
    githubRequest.defaults({
      headers: {
        authorization: `token ${GITHUB_TOKEN}`,
        accept: "application/vnd.github.v3+json",
      },
    })
  );
  const allPostsFromGithub = await Promise.all(
    (
      await githubData.listAllPosts()
    ).map(async (post) => ({
      ...post,
      content: (await githubData.getPost(post.slug))!.content,
    }))
  );

  await db.transaction().execute(async (tx) => {
    await tx.deleteFrom("BlogPosts").execute();

    await tx
      .insertInto("BlogPosts")
      .values(
        allPostsFromGithub.map((post) => ({
          Slug: post.slug,
          Title: post.title,
          Content: post.content,
          CreatedAt: post.createdAt,
          LastModifiedAt: new Date().toISOString(),
          Status: post.status,
          Tags: JSON.stringify(post.tags),
        }))
      )
      .execute();
  });
}

main();
