import type { Route } from "next";
import type { ComponentType } from "react";
import {
  BtrSectionIcon,
  BaustellenSectionIcon,
  DailySectionIcon,
  GeoCaptureSectionIcon,
  HomeSectionIcon,
  InvoiceSectionIcon,
  TransportSectionIcon
} from "@/components/section-icons";

type NavIcon = ComponentType<{ className?: string }>;

type ChildRoute = {
  title: string;
  href: Route;
};

type AppRoute = {
  title: string;
  href: Route;
  icon: NavIcon;
  children?: ChildRoute[];
};

export const appRoutes: AppRoute[] = [
  {
    title: "Home",
    href: "/",
    icon: HomeSectionIcon
  },
  {
    title: "Rechnungen",
    href: "/rechnungen/eingangsrechnungen",
    icon: InvoiceSectionIcon,
    children: [
      {
        title: "Eingangsrechnungen",
        href: "/rechnungen/eingangsrechnungen"
      },
      {
        title: "Ausgangsrechnungen",
        href: "/rechnungen/ausgangsrechnungen"
      }
    ]
  },
  {
    title: "BTR System",
    href: "/btr-system",
    icon: BtrSectionIcon
  },
  {
    title: "Baustellen",
    href: "/baustellen",
    icon: BaustellenSectionIcon
  },
  {
    title: "Transportbericht",
    href: "/transportbericht",
    icon: TransportSectionIcon
  },
  {
    title: "Tagesbericht",
    href: "/tagesbericht",
    icon: DailySectionIcon
  },
  {
    title: "GeoCapture",
    href: "/geocapture",
    icon: GeoCaptureSectionIcon
  },
  {
    title: "SmapOne",
    href: "/smapone",
    icon: GeoCaptureSectionIcon
  }
];

export const routeTitles = new Map<string, string>([
  ["/", "Home"],
  ["/rechnungen/eingangsrechnungen", "Eingangsrechnungen"],
  ["/rechnungen/ausgangsrechnungen", "Ausgangsrechnungen"],
  ["/btr-system", "BTR System"],
  ["/baustellen", "Baustellen"],
  ["/transportbericht", "Transportbericht"],
  ["/geocapture", "GeoCapture"],
  ["/tagesbericht", "Tagesbericht"],
  ["/smapone", "SmapOne"]
]);

export function getRouteTitle(pathname: string) {
  return routeTitles.get(pathname) ?? "Strobl App";
}
