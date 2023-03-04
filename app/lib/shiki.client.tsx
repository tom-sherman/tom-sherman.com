import { memo, useEffect, useState, useSyncExternalStore } from "react";
import type { Highlighter } from "shiki";
import { getHighlighter, setCDN } from "shiki";
import { SHIKI_PATH } from "~/constants";
import { createCache } from "suspense";

export type { Highlighter } from "shiki";

setCDN(`${SHIKI_PATH}/`);
const highlighterPromise = getHighlighter({
  langs: [],
  themes: [],
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

function useColorMode(inferredServerValue?: "light" | "dark") {
  return useSyncExternalStore(
    (callback) => {
      const listener = () => {
        callback();
      };
      window.addEventListener("color-mode-change", listener);
      return () => {
        window.removeEventListener("color-mode-change", listener);
      };
    },
    () => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    },
    () => inferredServerValue ?? "light"
  );
}
