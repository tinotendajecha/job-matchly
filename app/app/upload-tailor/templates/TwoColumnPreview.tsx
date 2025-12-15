import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  splitChanges,
  extractTopHeader,
  splitByH2Sections,
} from "../helpers/utils";

type TwoColumnPreviewProps = {
  value: string;
};

function splitContact(contactLine: string) {
  // Expect: "Location · Phone · Email"
  return (contactLine || "")
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
}

const RightMarkdown = ({ md }: { md: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: () => null,
      h2: () => null, // headings rendered in left rail, not duplicated
      p: (props) => (
        <p className="text-sm md:text-base leading-6 text-foreground/90 mb-3" {...props} />
      ),
      ul: (props) => <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />,
      li: (props) => (
        <li className="text-sm md:text-base leading-6 text-foreground/90" {...props} />
      ),
      strong: (props) => <strong className="font-semibold text-[#111827]" {...props} />,
      em: (props) => <em className="italic text-foreground/80" {...props} />,
      a: (props) => (
        <a
          className="text-[#1155cc] underline underline-offset-2 hover:no-underline"
          target="_blank"
          rel="noreferrer"
          {...props}
        />
      ),
      hr: (props) => <hr className="my-6 border-foreground/10" {...props} />,
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

export const TwoColumnPreview = ({ value }: TwoColumnPreviewProps) => {
  const { body } = splitChanges(value);
  const { nameLine, professionalTitleLine, contactLine, rest } = extractTopHeader(body);

  const sections = splitByH2Sections(rest);
  const contactParts = splitContact(contactLine);

  return (
    // Horizontal scroll on small screens to keep it “page-like”
    <div className="px-4 py-3 overflow-x-auto">
      {/* Fixed page width so mobile scrolls sideways instead of stacking */}
      <div className="min-w-[900px]">
        {/* Two column grid (like Google Docs page) */}
        <div className="grid grid-cols-[260px,1fr] gap-x-10">
          {/* TOP ROW */}
          <div className="pt-6">
            {!!nameLine && (
              <h1 className="text-4xl font-extrabold leading-[1.05] text-[#111827]">
                {nameLine}
              </h1>
            )}
            {!!professionalTitleLine && (
              <div className="mt-2 text-lg font-semibold text-[#f97316]">
                {professionalTitleLine}
              </div>
            )}
          </div>

          <div className="pt-6">
            {/* top divider line (right column) */}
            <div className="border-t-2 border-[#111827] mb-4" />

            {/* contact block aligned top-right */}
            <div className="text-sm leading-5 text-[#111827]">
              {/* optional small name on right like the Google template */}
              {!!nameLine && <div className="font-semibold">{nameLine}</div>}

              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {contactParts.map((p) => (
                  <div
                    key={p}
                    className={
                      /@/.test(p) || /\+?\d/.test(p)
                        ? "text-[#f97316]" // mimic orange emphasis on contact bits
                        : ""
                    }
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* bottom divider line under contact block */}
            <div className="border-t-2 border-[#111827] mt-4" />
          </div>

          {/* SECTION ROWS */}
          {sections.map((sec) => (
            <div key={sec.title} className="contents">
              {/* LEFT: section label aligned with its content */}
              <div className="pt-8">
                <div className="h-px w-10 bg-foreground/20 mb-2" />
                <div className="text-sm font-semibold text-foreground">{sec.title}</div>
              </div>

              {/* RIGHT: section content with thick top divider */}
              <div className="pt-8">
                <div className="border-t-2 border-[#111827] mb-4" />
                <RightMarkdown md={sec.content} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
