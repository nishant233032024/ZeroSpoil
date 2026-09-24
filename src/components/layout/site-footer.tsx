import { ExternalLink } from "lucide-react";

const name = process.env.NEXT_PUBLIC_DEVELOPER_NAME ?? "Nishant Ghuge";
const github =
  process.env.NEXT_PUBLIC_DEVELOPER_GITHUB ??
  "https://github.com/nishant233032024";
const linkedin =
  process.env.NEXT_PUBLIC_DEVELOPER_LINKEDIN ??
  "https://www.linkedin.com/in/nishantghuge";

export function SiteFooter() {
  return (
    <footer className="sticky bottom-0 z-40 border-t border-zinc-800 bg-[#09090B]/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 text-xs text-zinc-400">
        <p>
          Developed by{" "}
          <span className="text-zinc-200" data-testid="developer-name">
            {name}
          </span>
        </p>
        <nav className="flex items-center gap-4" aria-label="Developer profiles">
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
          >
            GitHub
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
          >
            LinkedIn
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </nav>
      </div>
    </footer>
  );
}
