import type { DataFunctionArgs } from "@remix-run/cloudflare";

const usernameAliases = ["me", "tom", "tomsherman", "mastodon", "social"];
const resources = usernameAliases.map(
  (username) => `acct:${username}@tom-sherman.com`
);

export function loader({ request }: DataFunctionArgs) {
  const url = new URL(request.url);
  const resourceQuery = url.searchParams.get("resource");

  if (!resourceQuery) {
    return new Response("Missing resource query parameter", {
      status: 400,
    });
  }

  if (!resources.includes(resourceQuery)) {
    return new Response("Not found", {
      status: 404,
    });
  }

  return new Response(
    JSON.stringify({
      subject: "acct:tomsherman@fosstodon.org",
      aliases: [
        "https://fosstodon.org/@tomsherman",
        "https://fosstodon.org/users/tomsherman",
      ],
      links: [
        {
          rel: "http://webfinger.net/rel/profile-page",
          type: "text/html",
          href: "https://fosstodon.org/@tomsherman",
        },
        {
          rel: "self",
          type: "application/activity+json",
          href: "https://fosstodon.org/users/tomsherman",
        },
        {
          rel: "http://ostatus.org/schema/1.0/subscribe",
          template: "https://fosstodon.org/authorize_interaction?uri={uri}",
        },
      ],
    }),
    {
      headers: {
        "content-type": "application/jrd+json",
      },
    }
  );
}
