import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Safe, injection-free markdown renderer for release notes.
 * Converts markdown syntax into safe React elements without dangerouslySetInnerHTML.
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  const parseInline = (text: string): React.ReactNode => {
    // Process bold, inline code, and safe links
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Simple regex-based inline parser
    while (remaining.length > 0) {
      // Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono text-xs border border-zinc-700/60"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold: **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-white">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Safe link: [text](https://...)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={keyIdx++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Plain character
      const nextSpecial = remaining.search(/[`*[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial > 0) {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      } else {
        // Character didn't match a full token, consume 1 char
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      }
    }

    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code blocks ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="p-4 my-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-base font-bold text-white mt-5 mb-2 font-mono">
          {line.replace('### ', '')}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-lg font-bold text-white mt-6 mb-2 border-b border-zinc-800/80 pb-1">
          {line.replace('## ', '')}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-xl font-extrabold text-white mt-6 mb-3">
          {line.replace('# ', '')}
        </h2>
      );
      continue;
    }

    // Bullet list items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const cleanItem = line.trim().replace(/^[-*]\s+/, '');
      elements.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-sm text-zinc-300 my-1 leading-relaxed">
          <span className="text-emerald-400 mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span>{parseInline(cleanItem)}</span>
        </li>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${i}`} className="text-sm text-zinc-300 leading-relaxed my-1.5">
        {parseInline(line)}
      </p>
    );
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};
