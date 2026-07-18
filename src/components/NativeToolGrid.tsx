import { ToolIconGrid } from "@/components/ToolIconGrid";
import type { Tool } from "@/lib/tools-data";
import type { Locale } from "@/lib/i18n";

type NativeToolGridProps = {
  tools: Tool[];
  locale: Locale;
  toolNames: Record<string, string>;
  title: string;
  className?: string;
};

/** Native app launcher grid — large icons, 2-column tiles. */
export function NativeToolGrid({ tools, locale, toolNames, title, className }: NativeToolGridProps) {
  return (
    <ToolIconGrid
      tools={tools}
      locale={locale}
      toolNames={toolNames}
      title={title}
      className={className}
      variant="launcher"
    />
  );
}
