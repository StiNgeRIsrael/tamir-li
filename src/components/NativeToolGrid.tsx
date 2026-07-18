import { ToolIconGrid } from "@/components/ToolIconGrid";
import type { Tool } from "@/lib/tools-data";
import type { Locale } from "@/lib/i18n";

type NativeToolGridProps = {
  tools: Tool[];
  locale: Locale;
  toolNames: Record<string, string>;
  title: string;
  className?: string;
  /** Hide the section title when the parent already renders one. */
  hideTitle?: boolean;
};

/** Native app launcher grid — compact 2-column tiles. */
export function NativeToolGrid({
  tools,
  locale,
  toolNames,
  title,
  className,
  hideTitle = false,
}: NativeToolGridProps) {
  return (
    <ToolIconGrid
      tools={tools}
      locale={locale}
      toolNames={toolNames}
      title={title}
      className={className}
      variant="launcher"
      hideTitle={hideTitle}
    />
  );
}
