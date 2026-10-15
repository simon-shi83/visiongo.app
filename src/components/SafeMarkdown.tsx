import type { ReactNode } from 'react';
import { SiteLink } from './SiteLink';

interface SafeMarkdownProps { content: string; className?: string; headingOffset?: number }
// Render text as React nodes; raw HTML and unsafe URL schemes are never executed.
export function SafeMarkdown({ content, className = '', headingOffset = 1 }: SafeMarkdownProps) {
  const inline = (text: string): ReactNode[] => {
    const result: ReactNode[] = [];
    const tokens = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/(?!\/)[^\s)]+|#[^\s)]+)\)/g;
    let start = 0;
    let match: RegExpExecArray | null;
    while ((match = tokens.exec(text))) {
      if (match.index > start) result.push(text.slice(start, match.index));
      const key = match.index;
      if (match[1]) result.push(<code key={key} className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-xs text-emerald-300">{match[1]}</code>);
      else if (match[2]) result.push(<strong key={key} className="font-semibold text-white">{match[2]}</strong>);
      else result.push(<SiteLink key={key} href={match[4]} className="text-emerald-400 underline underline-offset-2">{match[3]}</SiteLink>);
      start = tokens.lastIndex;
    }
    if (start < text.length) result.push(text.slice(start));
    return result;
  };
  const nodes: ReactNode[] = [];
  const lines = content.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (line.trim().startsWith('```')) {
      const key = index;
      const code: string[] = [];
      while (++index < lines.length && !lines[index].trim().startsWith('```')) code.push(lines[index]);
      nodes.push(<pre key={key} className="my-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300"><code>{code.join('\n')}</code></pre>);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      const Heading = `h${Math.min(6, heading[1].length + headingOffset)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      nodes.push(<Heading key={index} className="mb-3 mt-8 text-xl font-semibold text-white">{inline(heading[2])}</Heading>);
      continue;
    }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { nodes.push(<hr key={index} className="my-6 border-zinc-800" />); continue; }
    const bullet = /^\s*[-*]\s+/;
    const ordered = /^\s*\d+[.)]\s+/;
    const listPattern = bullet.test(line) ? bullet : ordered.test(line) ? ordered : null;
    if (listPattern) {
      const key = index;
      const items: ReactNode[] = [];
      const start = ordered.test(line) ? Number(line.trim().match(/^\d+/)?.[0]) : undefined;
      do { items.push(<li key={index} className="pl-1">{inline(lines[index].replace(listPattern, ''))}</li>); index++; } while (index < lines.length && listPattern.test(lines[index]));
      index--;
      nodes.push(start === undefined ? <ul key={key} className="my-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-zinc-300">{items}</ul> : <ol key={key} start={start} className="my-3 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-zinc-300">{items}</ol>);
      continue;
    }
    nodes.push(<p key={index} className="my-3 text-sm leading-relaxed text-zinc-300">{inline(line)}</p>);
  }
  return <div className={className}>{nodes}</div>;
}
