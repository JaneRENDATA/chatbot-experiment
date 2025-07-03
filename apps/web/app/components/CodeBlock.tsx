/* eslint-disable @typescript-eslint/naming-convention */

import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedLight } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

const customStyle = {
  lineHeight: 1.6,
  fontSize: '0.85em',
  padding: '0.7em 1.2em',
  borderRadius: '1em',
  margin: '0.7em 0',
  background: '#f6f8fa',
  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
  overflowX: 'auto' as const,
};

interface CodeBlockProps {
  language?: string | null;
  value: string;
}

export default function CodeBlock({ language = null, value }: CodeBlockProps) {
  return (
    <SyntaxHighlighter language={language || undefined} style={solarizedLight} customStyle={customStyle}>
      {value}
    </SyntaxHighlighter>
  );
}