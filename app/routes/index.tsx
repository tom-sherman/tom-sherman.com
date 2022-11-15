import type { ReactNode } from "react";
import { MASTODON_URL } from "~/constants";

export default function Index() {
  return (
    <main className="container">
      <Me />

      <h2>Projects</h2>

      <Project
        name="Yet Another Javascript Minifier"
        url="https://tom-sherman.github.io/yet-another-js-online-minifier/"
        description={
          <p>
            There's a thousand of these available online but this one handles
            massive files without hanging the browser and supports ES6.
          </p>
        }
      />
      <Project
        name="Orangutan"
        url="https://github.com/tom-sherman/orangutan"
        description={
          <p>
            Written in Typescript, Orangutan is a lazy range and list library
            for JavaScript. It's heavily inspired by Haskell's lists and range
            syntax.
          </p>
        }
      />
      <Project
        name="CoffeeBird"
        url="https://github.com/tom-sherman/coffeebird"
        description={
          <p>
            RBLang is <a href="https://rainbird.ai">Rainbird</a>'s XML based
            language which is used to define concepts, relationships, and rules
            to solve complex decision making problems. CoffeeBird replicates all
            of the features of RBLang without the visual noise of XML.
          </p>
        }
      />

      <footer>⚛️ Copyright Tom Sherman, {new Date().getFullYear()}.</footer>
    </main>
  );
}

function Me() {
  return (
    <>
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
          <a rel="me" href={MASTODON_URL}>
            Mastodon
          </a>
        </li>
      </ul>
    </>
  );
}

interface ProjectProps {
  name: string;
  url: string;
  description: ReactNode;
}

function Project({ name, url, description }: ProjectProps) {
  return (
    <article className="project">
      <h3>
        <a href={url}>{name}</a>
      </h3>
      <p>{description}</p>
    </article>
  );
}
