import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// markdown helpers
export function splitChanges(md: string) {
  if (!md) return { body: '', changes: '' };
  const m = md.match(/^##\s*Changes\s+Summary\s*$/mi);
  if (!m) return { body: md, changes: '' };
  const [pre, ...rest] = md.split(/^##\s*Changes\s+Summary\s*$/mi);
  return { body: pre.trim(), changes: rest.join('\n').trim() };
}

export function flatten(children: any): string {
  if (Array.isArray(children)) return children.map(flatten).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (children && typeof children === 'object' && 'props' in children) {
    return flatten((children as any).props?.children);
  }
  return '';
}

export const MarkdownPreview = ({ value }: { value: string }) => (
  <div className="px-4 py-3">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (props) => (
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-1 text-[#0f2a43]" {...props} />
        ),
        h2: (props) => {
          const txt = flatten(props.children).trim().toLowerCase();
          const isExperience = txt === 'experience';
          return (
            <h2
              className={[
                'font-semibold border-b pb-1 mt-6 mb-3',
                isExperience
                  ? 'text-[20px] md:text-[22px] text-[#0e6ba8]'
                  : 'text-[19px] md:text-[20px] text-[#12467F]',
              ].join(' ')}
              {...props}
            />
          );
        },
        p: (props) => <p className="text-sm md:text-base leading-6 text-foreground/90" {...props} />,
        ul: (props) => <ul className="list-disc pl-5 space-y-1.5" {...props} />,
        li: (props) => <li className="text-sm md:text-base leading-6" {...props} />,
        a: (props) => (
          <a className="text-[#1155cc] underline underline-offset-2 hover:no-underline" target="_blank" rel="noreferrer" {...props} />
        ),
        hr: (props) => <hr className="my-6 border-muted" {...props} />,
        strong: (props) => <strong className="font-semibold text-[#0e6ba8]" {...props} />,
        em: (props) => <em className="italic" {...props} />,
        code: (props: any) =>
          props.inline ? (
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs" {...props} />
          ) : (
            <pre>
              <code className="block rounded bg-muted px-3 py-2 text-xs" {...props} />
            </pre>
          ),
      }}
    >
      {value}
    </ReactMarkdown>
  </div>
);
