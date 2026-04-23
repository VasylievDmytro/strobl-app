"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  ClipboardPenLine,
  ReceiptText,
  Sparkles,
  Truck
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/page-title";
import { InfoCard } from "@/components/ui/info-card";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { fetchJson } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import type { HomeSummary } from "@/lib/dataverse/models";

const quickLinks = [
  {
    title: "Eingangsrechnungen",
    description: "Lieferantenrechnungen prüfen, filtern und im Detail ansehen.",
    href: "/rechnungen/eingangsrechnungen",
    icon: ReceiptText
  },
  {
    title: "Transportbericht",
    description: "Master-Detail Ansicht mit Lager, Zeiten und Touren.",
    href: "/transportbericht",
    icon: Truck
  },
  {
    title: "Tagesbericht",
    description: "Projektstatus, Mitarbeiter, Fahrzeuge und Wetter sauber gebündelt.",
    href: "/tagesbericht",
    icon: ClipboardPenLine
  },
  {
    title: "GeoCapture",
    description: "Arbeitszeiten, Monatswerte und Mitarbeiteranalysen auf einen Blick.",
    href: "/geocapture",
    icon: BarChart3
  }
] as const;

export function HomeDashboard() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);

  useEffect(() => {
    fetchJson<HomeSummary>("/api/home").then(setSummary).catch(() => setSummary(null));
  }, []);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="surface-card overflow-hidden p-4 md:p-8">
        <div className="grid gap-4 md:gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:gap-8">
          <div className="brand-band hero-panel relative overflow-hidden p-5 md:p-8">
            <div className="hero-shimmer absolute inset-y-0 right-0 w-1/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0))]" />
            <div className="hero-float absolute -right-10 top-6 h-28 w-28 rounded-full bg-white/10 blur-3xl md:h-36 md:w-36" />
            <div
              className="hero-float absolute bottom-0 left-8 h-20 w-20 rounded-full bg-[#83c5ff]/20 blur-3xl md:h-24 md:w-24"
              style={{ animationDelay: "1.2s" }}
            />
            <img
              src={BRAND.logoUrl}
              alt={BRAND.companyName}
              className="h-8 w-auto rounded-xl bg-white px-3 py-2 md:h-9"
            />
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 md:mt-5 md:text-xs md:tracking-[0.2em]">
              <Sparkles className="h-3.5 w-3.5" />
              INTERNE PLATTFORM
            </span>
            <h1 className="mt-4 max-w-xl text-balance text-[clamp(1.95rem,10vw,4.4rem)] leading-[0.94] text-white md:mt-5">
              Digitale Arbeitsoberfläche
            </h1>
            <p
              className="mt-3 max-w-xl text-[0.96rem] leading-7 text-white drop-shadow-[0_1px_10px_rgba(9,31,58,0.22)] md:mt-4 md:text-lg md:leading-8"
              style={{ color: "#f4f9ff" }}
            >
              Klare Arbeitsumgebung für Rechnungen, Transportberichte und Tagesberichte.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 md:mt-8">
              <div className="hero-stat rounded-[1.3rem] border border-white/16 bg-white/10 px-4 py-3 backdrop-blur-md md:rounded-[1.5rem]">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] drop-shadow-[0_1px_8px_rgba(9,31,58,0.2)] md:text-xs md:tracking-[0.2em]"
                  style={{ color: "#d8ecff" }}
                >
                  Qualität
                </p>
                <p className="mt-2 text-sm text-white">Klare Struktur für die tägliche Arbeit.</p>
              </div>
              <div
                className="hero-stat rounded-[1.3rem] border border-white/16 bg-white/10 px-4 py-3 backdrop-blur-md md:rounded-[1.5rem]"
                style={{ animationDelay: "120ms" }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] drop-shadow-[0_1px_8px_rgba(9,31,58,0.2)] md:text-xs md:tracking-[0.2em]"
                  style={{ color: "#d8ecff" }}
                >
                  Kontrolle
                </p>
                <p className="mt-2 text-sm text-white">
                  Arbeitsabläufe lassen sich einfach kontrollieren.
                </p>
              </div>
              <div
                className="hero-stat rounded-[1.3rem] border border-white/16 bg-white/10 px-4 py-3 backdrop-blur-md md:rounded-[1.5rem]"
                style={{ animationDelay: "240ms" }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] drop-shadow-[0_1px_8px_rgba(9,31,58,0.2)] md:text-xs md:tracking-[0.2em]"
                  style={{ color: "#d8ecff" }}
                >
                  Erfahrung
                </p>
                <p className="mt-2 text-sm text-white">Verständliche Business-Logik.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {summary ? (
              <>
                <InfoCard
                  label="Eingangsrechnungen"
                  value={summary.incomingInvoices}
                  hint={`${summary.openReviews} Positionen brauchen noch Prüfung.`}
                  className="min-h-0"
                  valueClassName="text-[clamp(1.05rem,7vw,1.55rem)]"
                />
                <InfoCard
                  label="Transportberichte"
                  value={summary.transportReports}
                  hint="Detailbereiche laden erst nach Auswahl eines Berichts."
                  className="min-h-0"
                  valueClassName="text-[clamp(1.05rem,7vw,1.55rem)]"
                />
                <InfoCard
                  label="Tagesberichte"
                  value={summary.dailyReports}
                  hint="Detailansichten für Fahrzeuge, Lager und Wetter."
                  className="min-h-0"
                  valueClassName="text-[clamp(1.05rem,7vw,1.55rem)]"
                />
              </>
            ) : (
              <>
                <SkeletonLoader className="h-28" />
                <SkeletonLoader className="h-28" />
                <SkeletonLoader className="h-28" />
              </>
            )}
          </div>
        </div>
      </section>

      <PageTitle
        eyebrow="Schnellzugriff"
        title="Direkter Einstieg in die wichtigsten Arbeitsbereiche"
        description="Schneller Zugriff auf die wichtigsten Bereiche für die tägliche Arbeit."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link, index) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="surface-card hover-lift group relative flex min-h-0 flex-col gap-4 overflow-hidden p-4 md:gap-6 md:p-6"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(8,88,163,0.25),transparent)]" />
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-[1.2rem] bg-[linear-gradient(135deg,#eff6fd,#f8fbff)] text-strobl-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:h-14 md:w-14 md:rounded-[1.4rem]">
                  <Icon className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-ink-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-strobl-700" />
              </div>
              <div>
                <h3 className="text-lg leading-7 text-ink-900 md:text-xl">{link.title}</h3>
                <p className="mt-2 text-sm leading-6 md:text-base">{link.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
