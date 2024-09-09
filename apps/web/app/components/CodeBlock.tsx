/* eslint-disable @typescript-eslint/naming-convention */

import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedLight } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

interface CodeBlockProps {
  language?: string | null;
  value: string;
}

export default function CodeBlock({ language = null, value }: CodeBlockProps) {
  return (
    <SyntaxHighlighter language={language || undefined} style={solarizedLight}>
      {value}
    </SyntaxHighlighter>
  );
}