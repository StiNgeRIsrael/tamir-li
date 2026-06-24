import { Link } from "react-router-dom";
import { Crown } from "lucide-react";
import { getDefaultSlug, type Tool } from "@/lib/tools-data";
import { getToolIconMeta } from "@/lib/tool-icons";
import { localePath, type Locale } from "@/lib/i18n";
import { isToolFunctional } from "@/lib/tool-availability";
import { ToolSoonBadge } from "@/components/ToolSoonBadge";
import { cn } from "@/lib/utils";

type ToolIconGridProps = {
  tools: Tool[];
  toolNames: Record<string, string>;
  locale: Locale;
  className?: string;
};

export function ToolIconGrid({ tools, toolNames, locale, className }: ToolIconGridProps) {
  if (tools.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className
      )}
    >
      {tools.map((tool) => {
        const { icon, cardClass } = getToolIconMeta(tool.id, tool.category);
        const name = toolNames[tool.id] || tool.name;
        const functional = isToolFunctional(tool.id);
        const href = localePath(`/${getDefaultSlug(tool)}`, locale);

        const cardInner = (
          <>
            <div className="flex h-11 w-11 items-center justify-center sm:h-12 sm:w-12">
              <img
                src={icon}
                alt=""
                width={44}
                height={44}
                className="h-9 w-9 object-contain sm:h-10 sm:w-10"
                loading="lazy"
                decoding="async"
              />
            </div>
            <span className="mt-2 line-clamp-2 text-center text-xs font-medium leading-snug text-foreground sm:text-[13px]">
              {name}
            </span>
            {!functional && (
              <span className="mt-1.5">
                <ToolSoonBadge />
              </span>
            )}
            {tool.premium && functional && (
              <Crown className="absolute top-2 end-2 h-3 w-3 text-premium" aria-hidden />
            )}
          </>
        );

        const cardClassName = cn(
          "relative flex min-h-[7.5rem] flex-col items-center justify-center rounded-xl border border-border/60 p-3 transition-all sm:min-h-[8rem] sm:p-4",
          cardClass,
          functional
            ? "hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            : "cursor-not-allowed opacity-55"
        );

        return functional ? (
          <Link key={tool.id} to={href} className={cardClassName}>
            {cardInner}
          </Link>
        ) : (
          <div key={tool.id} className={cardClassName} aria-disabled="true">
            {cardInner}
          </div>
        );
      })}
    </div>
  );
}
