import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Lightbulb } from "lucide-react";

export default function MarkdownReport({ content }) {
  if (!content) return null;

  return (
    <div className="markdown-report-container">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="report-heading-1 gradient-text">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="report-heading-2">
              <span className="report-heading-icon">🌱</span> {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="report-heading-3">
              <span className="report-heading-icon">✦</span> {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="report-paragraph">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="report-strong">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="report-list">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="report-list-item">
              <span className="report-bullet">•</span>
              <div>{children}</div>
            </li>
          ),
          table: ({ children }) => (
            <div className="report-table-wrapper">
              <table className="report-table">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="report-th">{children}</th>,
          td: ({ children }) => <td className="report-td">{children}</td>,
          blockquote: ({ children }) => (
            <blockquote className="report-blockquote">
              <Lightbulb size={18} color="#f59e0b" inline style={{ marginRight: "0.5rem" }} />
              {children}
            </blockquote>
          ),
          hr: () => <hr className="report-divider" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
