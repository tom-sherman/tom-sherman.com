import { memo, useSyncExternalStore } from "react";
import type { Highlighter } from "shiki";
import { getHighlighter, setCDN } from "shiki";
import { SHIKI_PATH } from "~/constants";
import { createCache } from "suspense";

export type { Highlighter } from "shiki";

setCDN(`${SHIKI_PATH}/`);

const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
const highlighterPromise = getHighlighter({
  langs: [],
  themes: [darkModePreference.matches ? "github-dark" : "github-light"],
});

const highlighterCache = createCache<
  [language: string, theme: string],
  Highlighter
>({
  load: async (language, theme) => {
    console.log("Loading highlighter", language, theme);
    const highlighter = await highlighterPromise;
    const loadedLanguages = highlighter.getLoadedLanguages();
    const loadedThemes = highlighter.getLoadedThemes();

    let promises = [];
    if (!loadedLanguages.includes(language)) {
      promises.push(highlighter.loadLanguage(language as any));
    }

    if (!loadedThemes.includes(theme)) {
      promises.push(highlighter.loadTheme(theme));
    }

    await Promise.all(promises);

    return highlighter;
  },
});

interface HighlightedCodeProps {
  children: string;
  language: string;
}

export const HighlightedCode = memo(function HighlightedCode({
  children: codeString,
  language,
}: HighlightedCodeProps) {
  const colorMode = useColorMode();
  const theme = colorMode === "dark" ? "github-dark" : "github-light";
  const highlighter = highlighterCache.fetchSuspense(language, theme);

  const container = document.createElement("div");
  container.innerHTML = highlighter.codeToHtml(codeString, {
    lang: language,
    theme: theme,
  });

  const codeElement = container.querySelector("code")!;

  return <code dangerouslySetInnerHTML={{ __html: codeElement.innerHTML }} />;
});

function useColorMode() {
  return useSyncExternalStore(
    (callback) => {
      const controller = new AbortController();

      darkModePreference.addEventListener("change", () => callback(), {
        signal: controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    () => {
      return darkModePreference.matches ? "dark" : "light";
    },
    // NOTE: Supply a better server value (maybe from headers) if this hook is ever used outside of a client module.
    () => "light"
  );
}
