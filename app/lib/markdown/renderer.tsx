import type { RenderableTreeNodes, Scalar, Tag } from "@markdoc/markdoc";

import type { ComponentType, ReactNode } from "react";
import { createElement, memo } from "react";

function isTag(node: any): node is Tag {
  return node && node.$$mdtype === "Tag";
}

type Component = ComponentType<any>;

export default memo(function MarkdownRenderer({
  components = {},
  content,
}: {
  components?: Record<string, Component>;
  content: RenderableTreeNodes;
}) {
  function deepRender(value: any): any {
    if (value == null || typeof value !== "object") return value;

    if (Array.isArray(value)) return value.map((item) => deepRender(item));

    if (value.$$mdtype === "Tag") return render(value);

    if (typeof value !== "object") return value;

    const output: Record<string, Scalar> = {};
    for (const [k, v] of Object.entries(value)) output[k] = deepRender(v);
    return output;
  }

  function render(node: RenderableTreeNodes): ReactNode {
    if (Array.isArray(node)) return <>{node.map(render)}</>;

    if (node === null || typeof node !== "object" || !isTag(node))
      return node as any;

    const {
      name,
      attributes: { class: className, ...attrs } = {},
      children = [],
    } = node;

    if (className) attrs.className = className;

    return createElement(
      components[name] ?? name,
      Object.keys(attrs).length == 0 ? null : deepRender(attrs),
      ...children.map(render)
    );
  }

  return render(content) as any;
});
