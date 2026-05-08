import { useCallback, useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import * as commands from "../lib/tauri-commands";
import { useConsumerStore } from "../stores/consumerStore";
import { useLocale } from "../i18n";

/**
 * Friendly billing-context date: "Mon, May 11" if same calendar year,
 * "Mon, May 11, 2027" if it's a future year. Mirrors how Apple, Stripe
 * dashboards, and most consumer SaaS surface "next billing" lines —
 * the day-of-week makes it parseable at a glance, the year is suppressed
 * unless ambiguous.
 */
function friendlyDate(ms: number | null | undefined, locale: string): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  try {
    return d.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "numeric" }),
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

const PRICE_BY_PLAN: Record<string, string> = {
  monthly: "$4.99/month",
  annual: "$50/year",
};

const PLAN_LABEL: Record<string, string> = {
  monthly: "Monthly plan",
  annual: "Annual plan",
};

export function BillingSection() {
  const { t, locale } = useLocale();
  const entitlement = useConsumerStore((s) => s.entitlement);
  const refresh = useConsumerStore((s) => s.refresh);
  const [opening, setOpening] = useState<"" | "portal" | "upgrade" | "signout">(
    "",
  );
  const [error, setError] = useState<string | null>(null);

  // ── "Already a subscriber? Sign in" sub-flow ─────────────────────
  // When a user reinstalls Noah (or the dev resets state), their device
  // forgets they paid and they land in trial. This affordance lets them
  // recover by entering the email they paid with — we send a fresh
  // magic link and the deep-link handler in App.tsx finishes the
  // sign-in. It's intentionally hidden behind a small text link so the
  // primary subscribe path stays the loudest action.
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInSubmitting, setSignInSubmitting] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleManage = useCallback(async () => {
    setOpening("portal");
    setError(null);
    try {
      const url = await commands.consumerBillingPortalUrl();
      await openUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setOpening("");
    }
  }, []);

  const handleUpgrade = useCallback(async () => {
    setOpening("upgrade");
    setError(null);
    try {
      const url = await commands.consumerBillingCheckoutUrl("annual");
      await openUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setOpening("");
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setOpening("signout");
    try {
      await commands.consumerSignOut();
      // Reloading the window is the simplest way to re-trigger the App.tsx gate.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOpening("");
    }
  }, []);

  const handleRequestMagicLink = useCallback(async () => {
    const trimmed = signInEmail.trim();
    if (!trimmed) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setSignInError(t("billing.signInInvalidEmail"));
      return;
    }
    setSignInSubmitting(true);
    setSignInError(null);
    try {
      // Server returns null when it's gating on the email click (the
      // expected post-fix behavior). When that happens, we transition
      // to the "check your inbox" affirmation. App.tsx's noah://auth
      // deep-link handler will pick up the eventual click and refresh
      // the entitlement.
      await commands.consumerRequestMagicLink(trimmed);
      setLinkSentTo(trimmed);
      setSignInOpen(false);
    } catch (err) {
      setSignInError(err instanceof Error ? err.message : String(err));
    } finally {
      setSignInSubmitting(false);
    }
  }, [signInEmail, t]);

  if (!entitlement) return null;

  const statusLabel = ((): string => {
    switch (entitlement.status) {
      case "none":
        return t("billing.statusNone");
      case "trialing":
        return t("billing.statusTrialing");
      case "active":
        return t("billing.statusActive");
      case "past_due":
        return t("billing.statusPastDue");
      case "canceled":
        return t("billing.statusCanceled");
      case "expired":
        return t("billing.statusExpired");
    }
  })();

  // Heuristic for "is the active sub still inside its first billing
  // period (Stripe trial)?" After Stripe charges, period_end advances
  // by a month or a year, putting it well beyond trial_ends_at. Before
  // that first charge, period_end ≈ trial_ends_at. Within 2 days of
  // each other = still in the paid-trial window.
  const isInPaidTrial = (() => {
    if (entitlement.status !== "active") return false;
    if (!entitlement.period_end || !entitlement.trial_ends_at) return false;
    const diffDays =
      Math.abs(entitlement.period_end - entitlement.trial_ends_at) /
      (1000 * 60 * 60 * 24);
    return diffDays < 2;
  })();

  const planKey = entitlement.plan ?? "";
  const planLabel = PLAN_LABEL[planKey] ?? "";
  const planPrice = PRICE_BY_PLAN[planKey] ?? "";

  // One human line that captures what's happening — replaces both the
  // old "Renews X" and the duplicated trial-ends line. Mirrors Apple,
  // Stripe Dashboard, Setapp conventions.
  const billingLine = ((): string => {
    if (entitlement.status === "trialing" && entitlement.trial_ends_at) {
      return t("billing.lineTrial", {
        date: friendlyDate(entitlement.trial_ends_at, locale),
      });
    }
    if (entitlement.status === "active") {
      if (isInPaidTrial && entitlement.period_end && planPrice) {
        return t("billing.linePaidTrial", {
          date: friendlyDate(entitlement.period_end, locale),
          price: planPrice,
        });
      }
      if (entitlement.period_end) {
        return t("billing.lineActive", {
          date: friendlyDate(entitlement.period_end, locale),
        });
      }
    }
    if (entitlement.status === "canceled" && entitlement.period_end) {
      return t("billing.lineCanceled", {
        date: friendlyDate(entitlement.period_end, locale),
      });
    }
    if (entitlement.status === "past_due") {
      return t("billing.linePastDue");
    }
    return "";
  })();

  // Show the "Already a subscriber?" affordance whenever the user is
  // NOT currently active. Active users wouldn't need it (and showing
  // it would be confusing).
  const showSignInAffordance = entitlement.status !== "active";

  return (
    <section className="rounded-2xl border border-border-primary bg-bg-secondary p-5">
      <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
        {t("billing.sectionTitle")}
      </h2>
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between items-baseline">
          <span className="text-text-muted">{t("billing.status")}</span>
          <span className="text-text-primary font-medium">{statusLabel}</span>
        </div>
        {planLabel && (
          <div className="flex justify-between items-baseline">
            <span className="text-text-muted">{t("billing.plan")}</span>
            <span className="text-text-primary">
              {planLabel}
              {planPrice && (
                <span className="text-text-muted ml-1.5">· {planPrice}</span>
              )}
            </span>
          </div>
        )}
        {billingLine && (
          <p className="text-[12.5px] text-text-secondary leading-relaxed pt-1">
            {billingLine}
          </p>
        )}
        {/* Per design rule: never show the per-period cap unless they
            actually hit it. Most users won't, and exposing the number
            invites questions ("why 100? why not more?"). */}
      </div>

      {error && <p className="text-xs text-accent-red mt-3">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {entitlement.status === "active" ? (
          <button
            onClick={handleManage}
            disabled={opening === "portal"}
            className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-xs text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50"
          >
            {opening === "portal"
              ? t("subscribe.opening")
              : t("billing.manage")}
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={opening === "upgrade"}
            className="btn-launch px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
          >
            {opening === "upgrade"
              ? t("subscribe.opening")
              : t("billing.upgrade")}
          </button>
        )}
        <button
          onClick={handleSignOut}
          disabled={opening === "signout"}
          className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
        >
          {t("billing.signOut")}
        </button>
      </div>

      {showSignInAffordance && (
        <div className="mt-4 pt-4 border-t border-border-primary">
          {linkSentTo ? (
            // After a successful magic-link request — friendly, never
            // pressuring. The user goes to their inbox at their own pace.
            <div className="space-y-2">
              <p className="text-[13px] text-text-primary">
                {t("billing.signInLinkSent", { email: linkSentTo })}
              </p>
              <p className="text-[12.5px] text-text-muted">
                {t("billing.signInLinkSentHint")}
              </p>
              <button
                onClick={() => {
                  setLinkSentTo(null);
                  setSignInEmail("");
                  setSignInOpen(true);
                }}
                className="text-[12.5px] text-accent-blue hover:underline"
              >
                {t("billing.signInUseDifferentEmail")}
              </button>
            </div>
          ) : signInOpen ? (
            <div className="space-y-2">
              <p className="text-[13px] text-text-primary font-medium">
                {t("billing.signInPrompt")}
              </p>
              <p className="text-[12.5px] text-text-muted">
                {t("billing.signInHelp")}
              </p>
              <div className="flex items-stretch gap-2 mt-2">
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => {
                    setSignInEmail(e.target.value);
                    setSignInError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRequestMagicLink();
                  }}
                  placeholder={t("billing.signInEmailPlaceholder")}
                  disabled={signInSubmitting}
                  autoFocus
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-bg-input border border-border-primary text-[13px] text-text-primary placeholder:text-text-muted aurora-focus disabled:opacity-50"
                />
                <button
                  onClick={handleRequestMagicLink}
                  disabled={signInSubmitting || !signInEmail.trim()}
                  className="btn-action px-3 py-2 rounded-xl text-[12.5px] font-semibold disabled:opacity-50 whitespace-nowrap"
                >
                  {signInSubmitting
                    ? t("billing.signInSending")
                    : t("billing.signInSendLink")}
                </button>
              </div>
              {signInError && (
                <p className="text-[11.5px] text-accent-red">{signInError}</p>
              )}
              <button
                onClick={() => {
                  setSignInOpen(false);
                  setSignInError(null);
                }}
                className="text-[12px] text-text-muted hover:text-text-secondary mt-1"
              >
                {t("billing.signInCancel")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSignInOpen(true)}
              className="text-[13px] text-accent-blue hover:underline"
            >
              {t("billing.signInLink")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
