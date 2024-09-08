import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

interface IMarkdownProps {
  value: string;
}

export default function Markdown({ value }: IMarkdownProps) {
  return (
    <ReactMarkdown
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <CodeBlock
              language={match[1]}
              value={String(children).replace(/\n$/, '')}
              {...props}
            />
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {value}
    </ReactMarkdown>
  );
}