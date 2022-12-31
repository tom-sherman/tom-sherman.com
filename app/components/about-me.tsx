import { MASTODON_URL } from "~/constants";

export function Me() {
  return (
    <div className="about-me">
      <img
        style={{ borderRadius: "50%", width: "10rem", height: "10rem" }}
        src="/img/me.jpg"
        alt="Tom Sherman"
      />
      <div>
        <h1>Hey 👋 I'm Tom, a Software Engineer from the UK.</h1>
        <p>
          I'm currently a Software Engineer at OVO energy. I'm super into the
          web, functional programming, and strong type systems.
        </p>
        <p>
          You can most easily contact me on{" "}
          <a href={MASTODON_URL} rel="me">
            Mastodon
          </a>{" "}
          but I'm also on{" "}
          <a href="https://twitter.com/tomus_sherman">Twitter</a>,{" "}
          <a href="https://www.linkedin.com/in/tom-sherman-2a2aa0136/">
            LinkedIn
          </a>
          , and <a href="https://github.com/tom-sherman">GitHub</a>.
        </p>
      </div>
    </div>
  );
}
