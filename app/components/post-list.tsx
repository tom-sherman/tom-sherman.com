import { Link } from "@remix-run/react";
import { marked } from "marked";

interface Post {
  slug: string;
  title: string;
}

interface PostListProps {
  posts: Post[];
}

export function PostList({ posts }: PostListProps) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.slug}>
          <Link to={`/blog/${post.slug}`}>
            <PostTitle title={post.title} />
          </Link>
        </li>
      ))}
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
