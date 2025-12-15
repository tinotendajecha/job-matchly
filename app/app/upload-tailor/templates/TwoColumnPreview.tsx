import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitChanges, extractTopHeader, splitByH2Sections } from "../helpers/utils";

type TwoColumnPreviewProps = {
  value: string;
};

function splitContact(contactLine: string) {
  return (contactLine || "")
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Auto-bold “Label: value …” at the start of a line (even if the model didn’t add ** **).
 * Example: "Technical/Hard Skills: React, Next.js" -> "**Technical/Hard Skills:** React, Next.js"
 */
// function autoBoldLabels(md: string) {
//   const lines = (md || "").split(/\r?\n/);

//   return lines
//     .map((line) => {
//       const t = line.trim();

//       // Skip headings, bullets, code fences
//       if (t.startsWith("#") || t.startsWith("- ") || t.startsWith("```
//         return line;
//       }

//       // Bold "Label: value" at line start
//       const m = line.match(/^([A-Za-z][A-Za-z0-9\s/&()\-]{2,50}):\s*(.+)$/);
//       if (!m) return line;

//       const label = (m[1] || "").trim();
//       const rest = (m[2] || "").trim();
//       if (!label || !rest) return line;

//       // Already bolded
//       if (line.includes(`**${label}:**`) || line.includes(`**${label}**`)) return line;

//       return `**${label}:** ${rest}`;
//     })
//     .join("\n");
// }

const RightMarkdown = ({ md }: { md: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: () => null,
      h2: () => null, // headings live on the left rail

      p: (props) => (
        <p className="text-sm md:text-base leading-6 text-foreground/90 mb-3" {...props} />
      ),
      ul: (props) => <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />,
      li: (props) => (
        <li className="text-sm md:text-base leading-6 text-foreground/90" {...props} />
      ),

      // Make key terms more prominent
      strong: (props) => <strong className="font-extrabold text-foreground" {...props} />,

      em: (props) => <em className="italic text-foreground/80" {...props} />,

      a: (props) => (
        <a
          className="text-[#1155cc] underline underline-offset-2 hover:no-underline"
          target="_blank"
          rel="noreferrer"
          {...props}
        />
      ),

      // Don’t render extra HRs for this template
      hr: () => null,

      code: (props: any) =>
        props.inline ? (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono" {...props} />
        ) : (
          <pre className="rounded bg-muted p-3 overflow-x-auto mb-4">
            <code className="text-xs font-mono" {...props} />
          </pre>
        ),
    }}
  >
    {md}
  </ReactMarkdown>
);

function SideScrollHint({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
      <div
        className={[
          "pointer-events-auto mt-5 flex items-center gap-2",
          "rounded-full border bg-background/90 px-3 py-1.5 text-xs text-foreground",
          "shadow-sm backdrop-blur",
          // subtle pulse/glow after 2s (not disturbing)
          "animate-[hintGlow_6s_ease-in-out_infinite]",
        ].join(" ")}
      >
        <span className="font-medium">Scroll sideways</span>

        {/* tiny animated “swipe” dot */}
        <span className="relative ml-1 inline-block h-4 w-10 overflow-hidden">
          <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-foreground/70 animate-[swipe_1.2s_ease-in-out_infinite]" />
        </span>

        {/* CTA button */}
        <button
          onClick={onDismiss}
          className={[
            "ml-1 inline-flex items-center gap-1.5",
            "rounded-full px-2.5 py-1",
            "bg-foreground text-background",
            "text-xs font-semibold",
            "shadow-sm",
            "hover:opacity-90 active:opacity-80",
            "transition",
          ].join(" ")}
        >
          <span className="inline-block animate-[thumbBob_1.2s_ease-in-out_infinite]">
            👍
          </span>
          Got it
        </button>

        <style jsx>{`
          /* swipe dot */
          @keyframes swipe {
            0% {
              transform: translate(0, -50%);
              opacity: 0.2;
            }
            20% {
              opacity: 1;
            }
            80% {
              transform: translate(32px, -50%);
              opacity: 1;
            }
            100% {
              transform: translate(32px, -50%);
              opacity: 0.2;
            }
          }

          /* gentle “classy” glow pulse starts after 2s */
          @keyframes hintGlow {
            0%,
            32% {
              /* first ~2s of 6s cycle = calm */
              box-shadow: 0 0 0 rgba(0, 0, 0, 0);
              border-color: rgba(255, 255, 255, 0.12);
            }
            45% {
              box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.08),
                0 10px 28px rgba(249, 115, 22, 0.08);
              border-color: rgba(249, 115, 22, 0.25);
            }
            60% {
              box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.05),
                0 8px 22px rgba(249, 115, 22, 0.06);
              border-color: rgba(255, 255, 255, 0.12);
            }
            100% {
              box-shadow: 0 0 0 rgba(0, 0, 0, 0);
              border-color: rgba(255, 255, 255, 0.12);
            }
          }

          /* subtle thumb “bob” */
          @keyframes thumbBob {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-2px);
            }
          }
        `}</style>
      </div>
    </div>
  );
}


export const TwoColumnPreview = ({ value }: TwoColumnPreviewProps) => {
  const { body } = splitChanges(value);
  const { nameLine, professionalTitleLine, contactLine, rest } = extractTopHeader(body);

  const sections = useMemo(() => splitByH2Sections(rest), [rest]);
  const contactParts = useMemo(() => splitContact(contactLine), [contactLine]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const hasOverflow = el.scrollWidth > el.clientWidth + 8;

    if (hasOverflow) {
      // Center so the user can tell it overflows horizontally
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  }, [value]);

  return (
    <div className="relative px-4 py-3">
      <SideScrollHint visible={showHint} onDismiss={() => setShowHint(false)} />

      <div ref={scrollerRef} className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[260px,1fr] gap-x-10">
            {/* TOP LEFT */}
            <div className="pt-6">
              {!!nameLine && (
                <h1 className="text-5xl font-extrabold leading-[1.02] text-foreground">
                  {nameLine}
                </h1>
              )}
              {!!professionalTitleLine && (
                <div className="mt-3 text-2xl font-semibold text-[#f97316] leading-tight">
                  {professionalTitleLine}
                </div>
              )}
            </div>

            {/* TOP RIGHT */}
            <div className="pt-6">
              <div className="border-t-[3px] border-foreground/70 mb-4" />

              <div className="text-sm leading-5 text-foreground">
                {!!nameLine && <div className="font-semibold">{nameLine}</div>}

                <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {contactParts.map((p) => (
                    <div
                      key={p}
                      className={/@/.test(p) || /\+?\d/.test(p) ? "text-[#f97316]" : ""}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTIONS */}
            {sections.map((sec) => {
              const contentMd = sec.content;

              return (
                <div key={sec.title} className="contents">
                  {/* LEFT label */}
                  <div className="pt-10">
                    <div className="h-[2px] w-12 bg-foreground/70 mb-3" />
                    <div className="text-[16px] font-extrabold text-foreground">
                      {sec.title}
                    </div>
                  </div>

                  {/* RIGHT content */}
                  <div className="pt-10">
                    <div className="border-t-[2px] border-foreground/70 mb-4" />
                    <RightMarkdown md={contentMd} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
