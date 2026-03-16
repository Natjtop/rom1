import Link from "next/link";
import ReactMarkdown from "react-markdown";

const linkClass =
  "text-accent underline underline-offset-2 hover:text-accent/80";

function LegalLink({
  href,
  children,
}: {
  href?: string | null;
  children?: React.ReactNode;
}) {
  if (!href) return <>{children}</>;
  if (href.startsWith("mailto:"))
    return (
      <a href={href} className={linkClass}>
        {children}
      </a>
    );
  if (href.startsWith("/"))
    return (
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    );
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {children}
    </a>
  );
}

const legalComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-2 mt-0 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-3 mt-10 scroll-mt-20 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-2 mt-6 text-lg font-semibold text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4 text-[15px] leading-[1.75] text-muted-foreground">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-5 ml-5 list-disc space-y-1.5 pl-1 text-[15px] leading-[1.75] text-muted-foreground marker:text-foreground/70">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-5 ml-5 list-decimal space-y-1.5 pl-1 text-[15px] leading-[1.75] text-muted-foreground marker:text-foreground/70">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="pl-0.5">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  hr: () => (
    <hr className="my-8 border-0 border-t border-border" aria-hidden />
  ),
  a: ({
    href,
    children,
  }: {
    href?: string | null;
    children?: React.ReactNode;
  }) => <LegalLink href={href}>{children}</LegalLink>,
};

export function LegalMarkdown({ content }: { content: string }) {
  return (
    <article className="legal-doc">
      <ReactMarkdown components={legalComponents}>{content}</ReactMarkdown>
    </article>
  );
}
