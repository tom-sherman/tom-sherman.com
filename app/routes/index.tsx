export default function Index() {
  return (
    <main className="container">
      <img
        style={{ borderRadius: "50%", width: "10rem" }}
        src="/me.jpg"
        alt="Tom Sherman"
      />
      <h1>Tom Sherman</h1>
      <ul>
        <li>
          <a href="https://twitter.com/tomus_sherman" rel="me">
            Twitter @tomus_sherman
          </a>
        </li>
        <li>
          <a href="https://github.com/tom-sherman" rel="me">
            Github @tom-sherman
          </a>
        </li>
        <li>
          <a href="https://www.linkedin.com/in/tom-sherman-2a2aa0136/" rel="me">
            LinkedIn - Tom Sherman
          </a>
        </li>
        <li>
          <a rel="me" href="https://fosstodon.org/@tomsherman">
            Mastodon
          </a>
        </li>
      </ul>
      <h2>Projects</h2>
      <article className="project">
        <h3>
          <a href="https://tom-sherman.github.io/yet-another-js-online-minifier/">
            Yet Another Javascript Minifier
          </a>
        </h3>
        <p>
          There's a thousand of these available online but this one handles
          massive files without hanging the browser and supports ES6.
        </p>
      </article>
      <article className="project">
        <h3>
          <a href="https://github.com/tom-sherman/orangutan">Orangutan</a>
        </h3>
        <p>
          Written in Typescript, Orangutan is a lazy range and list library for
          JavaScript. It's heavily inspired by Haskell's lists and range syntax.
        </p>
      </article>
      <article className="project">
        <h3>
          <a href="https://github.com/tom-sherman/coffeebird">CoffeeBird</a>
        </h3>
        <p>A DSL that compiles to RBLang.</p>
        <p>
          RBLang is <a href="https://rainbird.ai">Rainbird</a>'s XML based
          language which is used to define concepts, relationships, and rules to
          solve complex decision making problems. CoffeeBird replicates all of
          the features of RBLang without the visual noise of XML.
        </p>
      </article>
      <article className="project">
        <h3>
          <a href="https://github.com/tom-sherman/rainbird-engineer-tools">
            Rainbird Engineer Tools
          </a>
        </h3>
        <p>
          A <a href="https://code.visualstudio.com/">Visual Studio Code</a>{" "}
          extension that adds useful <a href="https://rainbird.ai">Rainbird</a>{" "}
          knowledge authoring shortcuts.
        </p>
      </article>
      <article className="project">
        <h3>
          <a href="https://github.com/tom-sherman/rainbird-api-js">
            rainbird-api-js
          </a>
        </h3>
        <p>Javascript promise-based wrapper around the Rainbird API.</p>
        <p>
          I'm currently working on porting this to Typescript. (Check the "next"
          branch)
        </p>
      </article>
      <article className="project">
        <h3>
          <a href="https://github.com/tom-sherman/set-operations-js">
            set-operations
          </a>
        </h3>
        <p>Performant Javascript set operations. Your Set's best friend.</p>
      </article>

      <footer>⚛️ Copyright Tom Sherman, {new Date().getFullYear()}.</footer>
    </main>
  );
}
