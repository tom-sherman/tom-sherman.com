import Database from "better-sqlite3";
import { Kysely, sql, SqliteDialect } from "kysely";
import { GitHubBlogData, type BlogPostsTable } from "~/lib/blog-data.server";
import { request as githubRequest } from "@octokit/request";
import * as dotenv from "dotenv";
import * as path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), "../.dev.vars"),
});

const db = new Kysely<{
  BlogPosts: BlogPostsTable;
}>({
  dialect: new SqliteDialect({
    database: new Database(
      path.resolve(process.cwd(), "../.wrangler/state/d1/DB.sqlite3")
    ),
  }),
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;

// Make sure you initialise the local database with wrangler before running this script
async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS BlogPosts (
      Slug TEXT NOT NULL PRIMARY KEY,
      Title TEXT NOT NULL,
      Content TEXT NOT NULL,
      CreatedAt TEXT NOT NULL,
      LastModifiedAt TEXT,
      Status TEXT NOT NULL,
      Tags TEXT NOT NULL,
      Path TEXT NOT NULL
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
          Status: post.status,
          Tags: JSON.stringify(post.tags),
          Path: post.path,
          LastModifiedAt: post.lastModifiedAt,
        }))
      )
      .execute();
  });
}

main();
