import { Link } from "react-router-dom";
import type { Tool } from "@/lib/tools-data";
import { getDefaultSlug } from "@/lib/tools-data";
import { getToolIconStyle, TOOL_ICON_ACCENT_CLASSES } from "@/lib/tool-icons";
import { localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isToolFunctional } from "@/lib/tool-availability";
import { ToolSoonBadge } from "@/components/ToolSoonBadge";
import { Crown } from "lucide-react";

type ToolIconGridVariant = "web" | "launcher";

type ToolIconGridProps = {
  tools: Tool[];
  locale: Locale;
  toolNames: Record<string, string>;
  title: string;
  className?: string;
  /** "launcher" = native app feel: 2-column, larger icon wells and labels. */
  variant?: ToolIconGridVariant;
};

const CARD_WIDTH =
  "w-[calc(50%-0.375rem)] max-w-[9.5rem] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.5625rem)] lg:w-[calc(16.666%-0.625rem)]";

const LAUNCHER_CARD_WIDTH = "w-[calc(50%-0.5rem)] max-w-none sm:w-[calc(33.333%-0.667rem)]";

export function ToolIconGrid({
  tools,
  locale,
  toolNames,
  title,
  className,
  variant = "web",
}: ToolIconGridProps) {
  if (tools.length === 0) return null;

  const isLauncher = variant === "launcher";

  return (
    <section className={cn("space-y-5", className)}>
      <h2 className="text-center text-base font-bold text-foreground sm:text-lg">{title}</h2>
      <div className={cn("flex flex-wrap justify-center", isLauncher ? "gap-4" : "gap-3")}>
        {tools.map((tool) => {
          const { icon, accent } = getToolIconStyle(tool.id);
          const accentStyle = TOOL_ICON_ACCENT_CLASSES[accent];
          const functional = isToolFunctional(tool.id);
          const label = toolNames[tool.id] || tool.name;

          const card = (
            <>
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center ring-1 ring-black/[0.04] dark:ring-white/[0.08]",
                  isLauncher ? "h-[4.5rem] w-[4.5rem] rounded-2xl" : "h-12 w-12 rounded-lg",
                  accentStyle.well,
                  !functional && "opacity-80 saturate-75"
                )}
              >
                <img
                  src={icon}
                  alt=""
                  width={isLauncher ? 64 : 44}
                  height={isLauncher ? 64 : 44}
                  className={cn(
                    "object-contain drop-shadow-sm",
                    isLauncher ? "h-16 w-16" : "h-11 w-11"
                  )}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <span
                className={cn(
                  "line-clamp-2 text-center font-medium leading-snug text-card-foreground",
                  isLauncher ? "mt-3 text-sm sm:text-base" : "mt-2.5 text-xs sm:text-sm",
                  !functional && "text-muted-foreground"
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
            isLauncher ? LAUNCHER_CARD_WIDTH : CARD_WIDTH,
            "group relative flex flex-col items-center justify-start rounded-xl border bg-card",
            isLauncher ? "native-launcher-tile px-3 pb-4 pt-6" : "min-h-[7.75rem] px-2 pb-3 pt-5",
            "shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]",
            "bg-gradient-to-b from-card to-card/90",
            accentStyle.border,
            "transition-[border-color,box-shadow,transform] duration-200",
            functional
              ? cn(
                  "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
                  accentStyle.hoverBorder
                )
              : "cursor-not-allowed opacity-90"
          );

          if (functional) {
            return (
              <Link
                key={tool.id}
                to={localePath(`/${getDefaultSlug(tool)}`, locale)}
                className={cardClass}
              >
                {card}
              </Link>
            );
          }

          return (
            <div key={tool.id} className={cardClass} aria-disabled="true">
              {card}
            </div>
          );
        })}
      </div>
    </section>
  );
}
