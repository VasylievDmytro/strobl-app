"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import { signIn } from "next-auth/react";
import { BRAND } from "@/lib/brand";

export function LoginPanel() {
  return (
    <div className="surface-card mx-auto flex w-full max-w-[520px] flex-col gap-6 p-8 md:p-10">
      <div className="flex items-center justify-between gap-4">
        <img
          src={BRAND.logoUrl}
          alt={BRAND.companyName}
          className="h-11 w-auto rounded-2xl bg-white px-3 py-2 shadow-[0_18px_38px_-28px_rgba(8,88,163,0.42)]"
        />
        <span className="glass-chip">
          <LockKeyhole className="h-3.5 w-3.5" />
          Microsoft 365
        </span>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-strobl-700">
          Anmeldung
        </p>
        <h1 className="text-balance text-ink-900">Anmelden mit Ihrem Firmenkonto</h1>
        <p className="max-w-xl text-base leading-7 text-ink-500">
          Melden Sie sich mit Ihrem Microsoft-365-Konto an, um auf Rechnungen, Transportberichte
          und Tagesberichte zuzugreifen.
        </p>
      </div>

      <button
        type="button"
        onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
        className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] bg-ink-900 px-5 py-4 text-base font-semibold text-white transition hover:bg-strobl-700"
      >
        Mit Microsoft anmelden
        <ArrowRight className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
