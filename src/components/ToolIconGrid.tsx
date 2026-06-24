import { Link } from "react-router-dom";
import type { Tool } from "@/lib/tools-data";
import { getDefaultSlug } from "@/lib/tools-data";
import { getToolIconStyle } from "@/lib/tool-icons";
import { localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isToolFunctional } from "@/lib/tool-availability";
import { ToolSoonBadge } from "@/components/ToolSoonBadge";
import { Crown } from "lucide-react";

type ToolIconGridProps = {
  tools: Tool[];
  locale: Locale;
  toolNames: Record<string, string>;
  title: string;
  className?: string;
};

const CARD_WIDTH =
  "w-[calc(50%-0.375rem)] max-w-[9.5rem] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.5625rem)] lg:w-[calc(16.666%-0.625rem)]";

export function ToolIconGrid({ tools, locale, toolNames, title, className }: ToolIconGridProps) {
  if (tools.length === 0) return null;

  return (
    <section className={cn("space-y-5", className)}>
      <h2 className="text-center text-base font-bold text-foreground sm:text-lg">{title}</h2>
      <div className="flex flex-wrap justify-center gap-3">
        {tools.map((tool) => {
          const { icon, bg, border } = getToolIconStyle(tool.id);
          const functional = isToolFunctional(tool.id);
          const label = toolNames[tool.id] || tool.name;

          const card = (
            <>
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                  !functional && "opacity-80 saturate-75"
                )}
              >
                <img
                  src={icon}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <span
                className={cn(
                  "mt-2.5 line-clamp-2 text-center text-xs font-medium leading-snug sm:text-sm",
                  "text-slate-800 dark:text-slate-900"
                )}
              >
                {label}
              </span>
              {!functional && (
                <span className="absolute top-1.5 end-1.5 z-10">
                  <ToolSoonBadge />
                </span>
              )}
              {tool.premium && (
                <span
                  className="absolute top-1.5 start-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-premium/20 ring-1 ring-premium/35"
                  aria-hidden
                >
                  <Crown className="h-3 w-3 text-premium" strokeWidth={2.25} />
                </span>
              )}
            </>
          );

          const cardClass = cn(
            CARD_WIDTH,
            "group relative flex min-h-[7.75rem] flex-col items-center justify-start rounded-xl border px-2 pb-3 pt-5",
            "shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]",
            "transition-[border-color,box-shadow] duration-200",
            functional
              ? "cursor-pointer hover:!border-primary/40 hover:shadow-md"
              : "cursor-not-allowed"
          );

          if (functional) {
            return (
              <Link
                key={tool.id}
                to={localePath(`/${getDefaultSlug(tool)}`, locale)}
                className={cardClass}
                style={{ backgroundColor: bg, borderColor: border }}
              >
                {card}
              </Link>
            );
          }

          return (
            <div
              key={tool.id}
              className={cardClass}
              style={{ backgroundColor: bg, borderColor: border }}
              aria-disabled="true"
            >
              {card}
            </div>
          );
        })}
      </div>
    </section>
  );
}
