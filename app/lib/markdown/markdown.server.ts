import { parse, transform } from "@markdoc/markdoc";

export function parseMarkdown(markdown: string) {
  const ast = parse(markdown);
  return transform(ast);
}
