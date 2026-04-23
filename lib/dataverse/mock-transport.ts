import type {
  TourRecord,
  TransportReport,
  TransportTimeRecord,
  TransportWarehouseRecord
} from "@/lib/dataverse/models";

export const transportReports: TransportReport[] = [
  {
    id: "tb-001",
    transportberichtNumber: "TB-2026-118",
    lvNumber: "LV-2104",
    projectLabel: "A8 Westtrasse",
    address: "München, Bauabschnitt 4",
    client: "Autobahn GmbH",
    bauleiter: "Thomas Berger",
    date: "2026-04-04",
    reportType: "Materialtransport",
    hasDocument: true,
    documentUrl: "https://example.com/transportbericht/tb-001.pdf",
    summary: "Asphalt und Fräsgut mit zwei Touren und Lagerfreigabe.",
    mitarbeiterName: "Lukas Bauer",
    vehicleLabel: "LKW ST-AB 204"
  },
  {
    id: "tb-002",
    transportberichtNumber: "TB-2026-112",
    lvNumber: "LV-2078",
    projectLabel: "Ingolstadt Nord",
    address: "Ingolstadt, Manchinger Straße",
    client: "Stadt Ingolstadt",
    bauleiter: "Nina Koller",
    date: "2026-04-02",
    reportType: "Baustellenlogistik",
    hasDocument: false,
    documentUrl: undefined,
    summary: "Schotteranlieferung und Umlagerung im Tagesverlauf.",
    mitarbeiterName: "Paul Dietrich",
    vehicleLabel: "LKW ST-CL 818"
  },
  {
    id: "tb-003",
    transportberichtNumber: "TB-2026-105",
    lvNumber: "LV-1994",
    projectLabel: "Passau Südbrücke",
    address: "Passau, Hafenstraße",
    client: "Stadt Passau",
    bauleiter: "Mara Stein",
    date: "2026-03-28",
    reportType: "Maschinentransport",
    hasDocument: true,
    documentUrl: "https://example.com/transportbericht/tb-003.pdf",
    summary: "Transport von Walze und Vorbereitungsgerät.",
    vehicleLabel: "Tieflader ST-PA 612"
  }
];

export const transportWarehouseRecords: TransportWarehouseRecord[] = [
  {
    id: "tw-001",
    parentId: "tb-001",
    title: "Lagerbereitung",
    preparedBy: "Werkstatt Ost",
    completedBy: "David Seidl",
    machineReference: "Vögele Super 1800-3i",
    notes: "Maschine bereitgestellt, Ölstand kontrolliert, Streuer geprüft."
  },
  {
    id: "tw-002",
    parentId: "tb-002",
    title: "Werkstattcheck",
    preparedBy: "Zentrallager",
    completedBy: "Julia Rauch",
    notes: "Planen und Sicherungsmaterial ergänzt."
  },
  {
    id: "tw-003",
    parentId: "tb-003",
    title: "Maschinenbereitstellung",
    preparedBy: "Werkstatt Passau",
    completedBy: "Oliver Kern",
    machineReference: "Hamm HD 12",
    notes: "Walze verladen, Zusatzgeraet gesichert."
  }
];

export const transportTimeRecords: TransportTimeRecord[] = [
  {
    id: "tt-001",
    parentId: "tb-001",
    firstName: "Lukas",
    lastName: "Bauer",
    role: "Fahrer",
    startTime: "06:15",
    endTime: "15:00",
    breakMinutes: 30,
    totalHours: 8.25
  },
  {
    id: "tt-002",
    parentId: "tb-001",
    firstName: "Mia",
    lastName: "Heller",
    role: "Dispo",
    startTime: "06:00",
    endTime: "14:30",
    breakMinutes: 30,
    totalHours: 8
  },
  {
    id: "tt-003",
    parentId: "tb-002",
    firstName: "Paul",
    lastName: "Dietrich",
    role: "Fahrer",
    startTime: "07:10",
    endTime: "16:00",
    breakMinutes: 45,
    totalHours: 8.08
  }
];

export const tourRecords: TourRecord[] = [
  {
    id: "tour-001",
    parentId: "tb-001",
    routeLabel: "Tour 1",
    loadingLocation: "Mischanlage Süd",
    unloadingLocation: "A8 BA4",
    material: "Asphalt AC 11",
    tonnage: 24.5,
    vehicle: "LKW ST-AB 204",
    notes: "Anlieferung planmäßig"
  },
  {
    id: "tour-002",
    parentId: "tb-001",
    routeLabel: "Tour 2",
    loadingLocation: "A8 BA4",
    unloadingLocation: "Recyclinghof Ost",
    material: "Fräsgut",
    tonnage: 18.2,
    vehicle: "LKW ST-AB 204"
  },
  {
    id: "tour-003",
    parentId: "tb-002",
    routeLabel: "Tour 1",
    loadingLocation: "Kieswerk Donau",
    unloadingLocation: "Manchinger Straße",
    material: "Schotter 0/32",
    cubicMeters: 14,
    vehicle: "LKW ST-CL 818",
    notes: "Teilweise Umleitung"
  },
  {
    id: "tour-004",
    parentId: "tb-003",
    routeLabel: "Tour 1",
    loadingLocation: "Werkstatt Passau",
    unloadingLocation: "Südbrücke",
    material: "Walze und Zubehör",
    vehicle: "Tieflader ST-PA 612",
    notes: "Maschinentransport mit Begleitfahrzeug"
  }
];
