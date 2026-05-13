import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

const sizeClass = {
  sm: "text-[1.05rem] sm:text-lg gap-0.5",
  md: "text-xl sm:text-2xl gap-1",
  lg: "text-2xl sm:text-3xl gap-1",
} as const;

interface BrandWordmarkProps {
  locale: Locale;
  className?: string;
  size?: keyof typeof sizeClass;
}

/**
 * לוגו מילולי בלבד — שני צבעים, בלי אייקון גנרי.
 * עברית: «תמיר» + «לי» | שפות אחרות: Tamir + .li (כמו הדומיין)
 */
export function BrandWordmark({ locale, className, size = "md" }: BrandWordmarkProps) {
  if (locale === "he") {
    return (
      <span
        className={cn(
          "inline-flex select-none items-baseline font-black tracking-tight",
          sizeClass[size],
          className
        )}
        dir="rtl"
        lang="he"
      >
        <span className="bg-gradient-to-l from-primary to-tool-image bg-clip-text text-transparent">תמיר</span>
        <span className="relative text-accent">
          לי
          <span
            className="absolute -bottom-1 start-0 end-0 h-1 rounded-full bg-accent/35"
            aria-hidden
          />
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex select-none items-baseline font-black tracking-tight",
        sizeClass[size],
        className
      )}
      lang="en"
    >
      <span className="text-foreground">Tamir</span>
      <span className="bg-gradient-to-r from-primary to-tool-video bg-clip-text text-transparent">.li</span>
    </span>
  );
}
