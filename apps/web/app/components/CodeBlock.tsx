/* eslint-disable @typescript-eslint/naming-convention */

import React, { useState } from 'react';

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
      <pre className="overflow-x-auto rounded-lg bg-[#18181a] text-white p-4 text-sm">
        <code className={`language-${language}`}>{value}</code>
      </pre>
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