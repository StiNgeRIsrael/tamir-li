import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/admin-api";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { AdRuntimeConfig } from "@/lib/ads/adsterra";

type AdSettingsForm = {
  zoneBanner: string;
  zoneSidebar: string;
  zoneSidebar2: string;
  zoneInline: string;
  popunderScriptUrl: string;
  nativeScriptUrl: string;
  nativeContainerId: string;
  invokeHost: string;
};

const FIELDS: { key: keyof AdSettingsForm; labelKey: string; hintKey?: string }[] = [
  { key: "zoneBanner", labelKey: "adsFieldBanner", hintKey: "adsHintBanner" },
  { key: "zoneSidebar", labelKey: "adsFieldSidebar", hintKey: "adsHintSidebar" },
  { key: "zoneSidebar2", labelKey: "adsFieldSidebar2", hintKey: "adsHintSidebar2" },
  { key: "zoneInline", labelKey: "adsFieldInline", hintKey: "adsHintInline" },
  { key: "popunderScriptUrl", labelKey: "adsFieldPopunder", hintKey: "adsHintPopunder" },
  { key: "nativeScriptUrl", labelKey: "adsFieldNativeScript", hintKey: "adsHintNative" },
  { key: "nativeContainerId", labelKey: "adsFieldNativeContainer", hintKey: "adsHintNative" },
  { key: "invokeHost", labelKey: "adsFieldInvokeHost", hintKey: "adsHintInvokeHost" },
];

function toForm(settings: AdRuntimeConfig | null | undefined): AdSettingsForm {
  return {
    zoneBanner: settings?.zoneBanner ?? "",
    zoneSidebar: settings?.zoneSidebar ?? "",
    zoneSidebar2: settings?.zoneSidebar2 ?? "",
    zoneInline: settings?.zoneInline ?? "",
    popunderScriptUrl: settings?.popunderScriptUrl ?? "",
    nativeScriptUrl: settings?.nativeScriptUrl ?? "",
    nativeContainerId: settings?.nativeContainerId ?? "",
    invokeHost: settings?.invokeHost ?? "",
  };
}

function toPayload(form: AdSettingsForm): AdRuntimeConfig {
  const payload: AdRuntimeConfig = {};
  for (const { key } of FIELDS) {
    payload[key] = form[key].trim() || null;
  }
  return payload;
}

export default function AdminAds() {
  const { token } = useAuth();
  const { t } = useLocale();
  const admin = t.admin as Record<string, string>;
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-ads", token],
    queryFn: () => adminFetch<{ settings: AdRuntimeConfig }>("/api/admin/ads/settings", token),
    enabled: !!token,
    retry: false,
  });

  const [form, setForm] = useState<AdSettingsForm>(() => toForm(null));

  useEffect(() => {
    if (data?.settings) {
      setForm(toForm(data.settings));
    }
  }, [data?.settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await adminFetch("/api/admin/ads/settings", token, {
        method: "PATCH",
        body: JSON.stringify(toPayload(form)),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ads"] });
      qc.invalidateQueries({ queryKey: ["ad-config"] });
      toast.success(admin.saved ?? "Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const loadError = isError && error instanceof Error ? error.message : null;

  return (
    <div className="space-y-6 max-w-2xl">
      {loadError && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {loadError}
        </p>
      )}
      <p className="text-sm text-muted-foreground">{admin.adsHint}</p>

      <div className="space-y-5">
        {FIELDS.map(({ key, labelKey, hintKey }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`ads-${key}`}>{admin[labelKey]}</Label>
            {hintKey && admin[hintKey] && (
              <p className="text-xs text-muted-foreground">{admin[hintKey]}</p>
            )}
            <Input
              id={`ads-${key}`}
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              className="font-mono text-xs"
              dir="ltr"
              spellCheck={false}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
          {admin.save}
        </Button>
      </div>
    </div>
  );
}
