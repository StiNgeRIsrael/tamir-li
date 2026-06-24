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

export function ToolIconGrid({ tools, locale, toolNames, title, className }: ToolIconGridProps) {
  if (tools.length === 0) return null;

  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="text-center text-base font-bold text-foreground sm:text-lg">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {tools.map((tool) => {
          const { icon, bg, border } = getToolIconStyle(tool.id);
          const functional = isToolFunctional(tool.id);
          const label = toolNames[tool.id] || tool.name;

          const card = (
            <>
              <img
                src={icon}
                alt=""
                width={45}
                height={45}
                className="mx-auto h-11 w-11 object-contain transition-transform duration-150 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <span className="mt-3 line-clamp-2 text-center text-xs font-medium leading-snug text-foreground sm:text-sm">
                {label}
              </span>
              {!functional && (
                <span className="absolute top-2 end-2">
                  <ToolSoonBadge />
                </span>
              )}
              {tool.premium && (
                <Crown className="absolute top-2 start-2 h-3.5 w-3.5 text-premium" aria-hidden />
              )}
            </>
          );

          const cardClass = cn(
            "group relative flex min-h-[7.5rem] flex-col items-center justify-start rounded-[10px] border px-2 pb-3 pt-6 transition-all duration-150",
            functional
              ? "cursor-pointer hover:shadow-sm hover:-translate-y-0.5"
              : "cursor-not-allowed opacity-55"
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
