/* eslint-disable @typescript-eslint/naming-convention */

import React, { useState } from 'react';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      setCopied(false);
    }
  };

  return (
    <div className="relative group">
      <SyntaxHighlighter
        language={language || 'python'}
        style={atomOneDark}
        customStyle={{
          borderRadius: '0.75em',
          margin: 0,
          fontSize: '0.9em',
          padding: '1.2em 1.2em 1.2em 1.2em',
          background: '#18181a',
          lineHeight: 1.7,
          overflowX: 'auto',
        }}
        codeTagProps={{ style: { fontFamily: 'Fira Mono, Menlo, monospace' } }}
      >
        {value}
      </SyntaxHighlighter>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-gray-700 text-white opacity-70 hover:opacity-100 transition"
        style={{zIndex: 2}}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
};

export default CodeBlock;