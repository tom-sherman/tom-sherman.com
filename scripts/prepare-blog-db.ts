import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { BlogPostsTable } from "~/blog-data.server";

const db = new Kysely<{
  BlogPosts: BlogPostsTable;
}>({
  dialect: new SqliteDialect({
    database: new Database(".wrangler/state/d1/DB.sqlite3"),
  }),
});

async function main() {
  const blog;
  const posts = await db.selectFrom("BlogPosts").selectAll().execute();
  console.log(posts.length);
}

main();
