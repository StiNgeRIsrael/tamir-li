import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/api/client";
import type { Tool } from "@/lib/tools-data";

type ToolConfigEntry = { toolId: string; enabled: boolean; featured: boolean; sortOrder: number };

export type ToolConfigContextValue = {
  loading: boolean;
  /** כלי מוצג באתר כשאין שרת או כשאין רשומה — ברירת מחדל פתוח */
  filterTools: (list: Tool[]) => Tool[];
  isToolEnabled: (toolId: string) => boolean;
};

const fallback: ToolConfigContextValue = {
  loading: false,
  filterTools: (list) => list,
  isToolEnabled: () => true,
};

const ToolConfigContext = createContext<ToolConfigContextValue>(fallback);

export function ToolConfigProvider({ children }: { children: ReactNode }) {
  const api = getApiBaseUrl();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tool-config", api],
    queryFn: async () => {
      const res = await fetch(`${api}/api/tools/config`);
      if (!res.ok) throw new Error("tool_config");
      return res.json() as Promise<{ tools: ToolConfigEntry[] }>;
    },
    enabled: !!api,
    staleTime: 60_000,
    retry: 1,
  });

  const value = useMemo((): ToolConfigContextValue => {
    if (!api) return fallback;
    if (isLoading && !data) {
      return { ...fallback, loading: true };
    }
    if (isError || !data?.tools) {
      return fallback;
    }
    const enabledMap: Record<string, boolean> = {};
    const sortMap: Record<string, number> = {};
    for (const t of data.tools) {
      enabledMap[t.toolId] = t.enabled;
      sortMap[t.toolId] = t.sortOrder;
    }
    const filterTools = (list: Tool[]) =>
      [...list]
        .filter((tool) => enabledMap[tool.id] !== false)
        .sort((a, b) => (sortMap[a.id] ?? 0) - (sortMap[b.id] ?? 0));
    const isToolEnabled = (toolId: string) => enabledMap[toolId] !== false;
    return { loading: false, filterTools, isToolEnabled };
  }, [api, data, isLoading, isError]);

  return <ToolConfigContext.Provider value={value}>{children}</ToolConfigContext.Provider>;
}

export function useToolConfig(): ToolConfigContextValue {
  return useContext(ToolConfigContext);
}
