import { useState, useEffect, useCallback } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTheme, type ThemePreference } from "../hooks/useTheme";
import * as commands from "../lib/tauri-commands";
import { useLocale } from "../i18n";
import { BillingSection } from "./BillingSection";

/**
 * Trimmed Settings — clean app, no bells and whistles.
 *
 * Three sections only: Billing, Appearance, Help & Feedback. Everything
 * else (BYOK input, proactive-suggestions toggle, auto-heal toggle,
 * language picker) was removed for the consumer launch. The Tauri
 * commands for those features still exist server-side so they can be
 * re-surfaced later without breaking compatibility.
 */
export function SettingsPanel() {
  const [version, setVersion] = useState("");
  const [authMode, setAuthMode] = useState<"api_key" | "proxy">("proxy");

  useEffect(() => {
    commands.getAppVersion().then(setVersion).catch(() => {});
    commands.getAuthMode().then(setAuthMode).catch(() => {});
  }, []);

  const { preference: themePref, setTheme } = useTheme();
  const { t } = useLocale();

  const handleReportProblem = useCallback(async () => {
    // Direct support email — short, no GitHub round-trip, no auto-attached
    // diagnostics. Keeps the surface clean and makes the conversation
    // immediately personal ("reply to this email — we read everything").
    const subject = encodeURIComponent("Noah feedback");
    const body = encodeURIComponent(
      `\n\n\n---\nNoah v${version || "?"} — please describe the issue above this line.`,
    );
    await openUrl(`mailto:support@onnoah.app?subject=${subject}&body=${body}`);
  }, [version]);

  const handleOpenHelp = useCallback(async () => {
    await openUrl("https://help.onnoah.app");
  }, []);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-bg-primary">
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">{t("settings.title")}</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {authMode === "proxy" && <BillingSection />}

          {/* Appearance */}
          <section className="rounded-2xl border border-border-primary bg-bg-secondary p-5">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
              {t("settings.appearance")}
            </h2>
            <div className="flex rounded-lg border border-border-primary overflow-hidden">
              {(["system", "light", "dark"] as ThemePreference[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTheme(opt)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    themePref === opt
                      ? "bg-accent-blue/15 text-accent-blue"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50"
                  }`}
                >
                  {opt === "system" ? t("settings.system") : opt === "light" ? t("settings.light") : t("settings.dark")}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {themePref === "system"
                ? t("settings.followsOS")
                : themePref === "light"
                  ? t("settings.alwaysLight")
                  : t("settings.alwaysDark")}
            </p>
          </section>

          {/* Help & Feedback — full-width, sits at the bottom */}
          <section className="rounded-2xl border border-border-primary bg-bg-secondary p-5 lg:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                {t("settings.helpFeedback")}
              </h2>
              <p className="text-xs text-text-muted whitespace-nowrap">
                {t("settings.version", { version: version || "..." })}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={handleReportProblem}
                className="flex items-center gap-2 w-full px-3 py-3 rounded-lg text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {t("settings.contactSupport")}
              </button>
              <button
                onClick={handleOpenHelp}
                className="flex items-center gap-2 w-full px-3 py-3 rounded-lg text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {t("settings.helpAndFaq")}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
