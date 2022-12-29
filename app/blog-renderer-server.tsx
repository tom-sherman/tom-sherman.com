import { MarkdownRenderer, type ComponentsConfig } from "./markdown.server";

const componentsConfig: ComponentsConfig = {
  paragraph: ({ children }) => <p>{children}</p>,
  heading: ({ children, node }) => {
    switch (node.depth) {
      case 1:
        return <h1>{children}</h1>;
      case 2:
        return <h2>{children}</h2>;
      case 3:
        return <h3>{children}</h3>;
      case 4:
        return <h4>{children}</h4>;
      case 5:
        return <h5>{children}</h5>;
      case 6:
        return <h6>{children}</h6>;
      default:
        return <h1>{children}</h1>;
    }
  },
  thematicBreak: () => <hr />,
  blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  list: ({ children }) => <ul>{children}</ul>,
  table: ({ children }) => <table>{children}</table>,
  listItem: ({ children }) => <li>{children}</li>,
  code: ({ node }) => (
    <pre>
      <code>{node.value}</code>
    </pre>
  ),
  tableRow: ({ children }) => <tr>{children}</tr>,
  tableCell: ({ children }) => <td>{children}</td>,
  text: ({ node }) => <>{node.value}</>,
  emphasis: ({ children }) => <em>{children}</em>,
  strong: ({ children }) => <strong>{children}</strong>,
  delete: ({ children }) => <del>{children}</del>,
  inlineCode: ({ node }) => <code>{node.value}</code>,
  image: ({ node }) => <img src={node.url} alt={node.alt ?? undefined} />,
  link: ({ node, children }) => <a href={node.url}>{children}</a>,
};

export function BlogRenderer({ input }: { input: string }) {
  return <MarkdownRenderer input={input} components={componentsConfig} />;
}
