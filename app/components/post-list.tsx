import { Link } from "@remix-run/react";
import { marked } from "marked";

interface Post {
  slug: string;
  title: string;
  createdAt: Date;
}

interface PostListProps {
  posts: Post[];
}

export function PostList({ posts }: PostListProps) {
  return (
    <ul>
      {posts.map((post) => {
        const formattedDate = new Intl.DateTimeFormat("fr-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(post.createdAt);

        return (
          <li key={post.slug}>
            <code>{formattedDate}</code>{" "}
            <Link to={`/blog/${post.slug}`}>
              <PostTitle title={post.title} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function PostTitle({
  title,
  as: asElement,
}: {
  title: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const Element = asElement ?? "span";

  return (
    <Element
      dangerouslySetInnerHTML={{
        __html: marked.parseInline(title),
      }}
    />
  );
}
