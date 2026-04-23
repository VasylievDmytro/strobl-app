import type { IncomingInvoice } from "@/lib/dataverse/models";

export const incomingInvoices: IncomingInvoice[] = [
  {
    id: "inv-001",
    supplierName: "Asphalt Technik Süd",
    invoiceNumber: "ER-2026-1042",
    lvNumber: "LV-2104",
    bauleiter: "Thomas Berger",
    bookingDate: "2026-04-03",
    passt: true,
    comment: "Freigabe ohne Abweichung",
    amount: 18420.75,
    statusLabel: "Bestätigt"
  },
  {
    id: "inv-002",
    supplierName: "BauLogistik Bayern",
    invoiceNumber: "ER-2026-1031",
    lvNumber: "LV-2078",
    bauleiter: "Nina Koller",
    bookingDate: "2026-04-01",
    passt: false,
    comment: "Mengendifferenz bei Schotterlieferung",
    amount: 9260.4,
    statusLabel: "Unbestätigt"
  },
  {
    id: "inv-003",
    supplierName: "Mayer Beton GmbH",
    invoiceNumber: "ER-2026-0998",
    lvNumber: "LV-2104",
    bauleiter: "Thomas Berger",
    bookingDate: "2026-03-29",
    passt: true,
    comment: "Skonto berucksichtigt",
    amount: 31240.2,
    statusLabel: "Bestätigt"
  },
  {
    id: "inv-004",
    supplierName: "Riedl Maschinenservice",
    invoiceNumber: "ER-2026-0954",
    lvNumber: "LV-1994",
    bauleiter: "Mara Stein",
    bookingDate: "2026-03-22",
    passt: false,
    comment: "Wartungsposition noch offen",
    amount: 4760,
    statusLabel: "Unbestätigt"
  },
  {
    id: "inv-005",
    supplierName: "Kieswerk Traun",
    invoiceNumber: "ER-2026-0912",
    lvNumber: "LV-2055",
    bauleiter: "Nina Koller",
    bookingDate: "2026-03-17",
    passt: true,
    comment: "Alles plausibel",
    amount: 12250.3,
    statusLabel: "Bestätigt"
  }
];
