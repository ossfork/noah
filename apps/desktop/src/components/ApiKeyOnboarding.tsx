import { useCallback, useState } from "react";
import { ArrowRight, ExternalLink, KeyRound } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { NoahIcon } from "./NoahIcon";
import { useLocale } from "../i18n";
import * as commands from "../lib/tauri-commands";

const CONSOLE_URL = "https://console.anthropic.com/settings/keys";

interface ApiKeyOnboardingProps {
  /** Called once a valid key has been saved. */
  onComplete: () => void;
}

/**
 * First-run key gate (BYOK). Noah runs on the user's own Anthropic API key, so
 * before the first chat (which would otherwise hit the LLM with no key) we ask
 * for one. This is the BYOK analog of the paid app's paywall moment: instead of
 * "start a subscription", it's "paste your key" — with a pointer to where to get
 * one and a note that other providers are coming. Reuses the same save +
 * validation as the Settings key card (no forked logic).
 */
export function ApiKeyOnboarding({ onComplete }: ApiKeyOnboardingProps) {
  const { t } = useLocale();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setError(null);
    const trimmed = value.trim();
    if (!trimmed) {
      setError(t("settings.apiKeyEmpty"));
      return;
    }
    if (!trimmed.startsWith("sk-ant-")) {
      setError(t("settings.apiKeyInvalid"));
      return;
    }
    setSaving(true);
    try {
      await commands.setApiKey(trimmed);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }, [value, t, onComplete]);

  return (
    <div
      className="relative h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(99, 102, 241, 0.16) 0%, transparent 70%), " +
          "radial-gradient(ellipse 50% 45% at 90% 100%, rgba(139, 92, 246, 0.08) 0%, transparent 65%), " +
          "var(--color-bg-primary)",
      }}
    >
      {/* Drag region — no MainTitleBar on pre-app screens (macOS overlay). */}
      <div data-tauri-drag-region="" className="absolute top-0 left-0 right-0 h-9 z-20" />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-8">
          <div className="relative w-full max-w-[440px]">
            <div className="flex flex-col items-center text-center mb-7">
              <div className="relative mb-4">
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-2xl blur-2xl opacity-70"
                  style={{ background: "rgba(99, 102, 241, 0.32)" }}
                />
                <NoahIcon className="relative w-16 h-16 rounded-2xl shadow-xl" alt="Noah" />
              </div>
              <span className="eyebrow mb-3">
                <KeyRound size={12} style={{ marginRight: 4, verticalAlign: "-1px" }} />
                {t("onboarding.key.eyebrow")}
              </span>
              <h1 className="text-title font-bold text-text-primary">{t("onboarding.key.title")}</h1>
              <p className="text-body text-text-muted mt-2 leading-relaxed">
                {t("onboarding.key.subtitle")}
              </p>
            </div>

            <div className="card-soft px-5 py-5">
              <input
                type="password"
                value={value}
                autoFocus
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                placeholder={t("settings.apiKeyPlaceholder")}
                className="w-full px-4 py-2.5 rounded-input bg-bg-input border border-border-primary text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus transition-colors"
              />
              {error && <p className="text-caption text-accent-red mt-2">{error}</p>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-launch w-full mt-3 inline-flex items-center justify-center gap-2 rounded-btn px-5 py-3 text-body font-semibold cursor-pointer disabled:opacity-60"
              >
                {saving ? t("settings.apiKeySaving") : t("onboarding.key.save")}
                {!saving && <ArrowRight size={16} />}
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center gap-2 text-center">
              <p className="text-caption text-text-muted leading-relaxed">{t("onboarding.key.where")}</p>
              <button
                onClick={() => openUrl(CONSOLE_URL).catch(() => {})}
                className="inline-flex items-center gap-1.5 text-caption font-semibold text-accent-indigo hover:underline cursor-pointer"
              >
                {t("onboarding.key.getKey")}
                <ExternalLink size={13} />
              </button>
              <p className="text-micro text-text-muted mt-1">{t("onboarding.key.soon")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
