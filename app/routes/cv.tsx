import { GITHUB_URL, LINKEDIN_URL } from "~/constants";

export default function CV() {
  return (
    <main className="container">
      <h1>Tom Sherman's CV</h1>
      <p>
        This page is currently under construction, in the meantime you can find
        out about my work on <a href={GITHUB_URL}>GitHub</a> and{" "}
        <a href={LINKEDIN_URL}>LinkedIn</a>.
      </p>
    </main>
  );
}
