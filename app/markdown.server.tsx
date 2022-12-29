import type { PropsWithChildren, ReactElement } from "react";
import { fromMarkdown } from "mdast-util-from-markdown";
import type * as ast from "mdast";
import { visit } from "unist-util-visit";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";

export function parse(input: string) {
  const tree = fromMarkdown(input, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });

  visit(tree, "paragraph", (node) => {
    console.log(node);
  });

  return tree;
}

interface NodeRenderer<TNode> {
  (
    props: PropsWithChildren<{
      node: TNode;
      components: ComponentsConfig;
    }>
  ): ReactElement;
  displayName?: string;
}

export interface ComponentsConfig {
  paragraph?: NodeRenderer<ast.Paragraph>;
  heading?: NodeRenderer<ast.Heading>;
  thematicBreak?: NodeRenderer<ast.ThematicBreak>;
  blockquote?: NodeRenderer<ast.Blockquote>;
  list?: NodeRenderer<ast.List>;
  table?: NodeRenderer<ast.Table>;
  listItem?: NodeRenderer<ast.ListItem>;
  code?: NodeRenderer<ast.Code>;
  tableRow?: NodeRenderer<ast.TableRow>;
  tableCell?: NodeRenderer<ast.TableCell>;
  text?: NodeRenderer<ast.Text>;
  emphasis?: NodeRenderer<ast.Emphasis>;
  strong?: NodeRenderer<ast.Strong>;
  delete?: NodeRenderer<ast.Delete>;
  inlineCode?: NodeRenderer<ast.InlineCode>;
  image?: NodeRenderer<ast.Image>;
  link?: NodeRenderer<ast.Link>;
}

interface MarkdownRendererProps {
  input: string;
  components?: ComponentsConfig;
}

export function MarkdownRenderer({
  components = {},
  input,
}: MarkdownRendererProps) {
  const root = parse(input);

  return (
    <>
      {root.children.map((child) => (
        <Node
          key={`${child.type}-${child.position?.start.offset ?? ""}`}
          node={child}
          components={components}
        />
      ))}
    </>
  );
}

interface NodeProps {
  node: ast.Content;
  components: ComponentsConfig;
}

function Node({ node, components }: NodeProps) {
  const Component = components[node.type as keyof typeof components] as
    | NodeRenderer<ast.Content>
    | undefined;

  if (!Component) {
    throw new Error(`No component for node type ${node.type}`);
  }

  Component.displayName =
    "Markdown" + node.type[0]!.toUpperCase() + node.type.slice(1);

  return (
    <Component node={node} components={components}>
      {"children" in node &&
        node.children.map((child) => (
          <Node
            key={`${child.type}-${child.position?.start.offset ?? ""}`}
            node={child}
            components={components}
          />
        ))}
    </Component>
  );
}
