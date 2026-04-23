import type {
  DailyCarRecord,
  DailyConstructionPerformanceRecord,
  DailyDifficultyRecord,
  DailyDocumentRecord,
  DailyEmployeeRecord,
  DailyReport,
  DailyTruckDriverRecord,
  DailyTruckRecord,
  DailyWarehouseRecord,
  DailyWeatherRecord
} from "@/lib/dataverse/models";

export const dailyReports: DailyReport[] = [
  {
    id: "day-001",
    reportName: "A8 Westtrasse Tagesbericht",
    lvNumber: "LV-2104",
    address: "München, Bauabschnitt 4",
    client: "Autobahn GmbH",
    bauleiter: "Thomas Berger",
    date: "2026-04-04",
    summary: "Asphaltierung mit zwei Kolonnen und vollem Fuhrpark."
  },
  {
    id: "day-002",
    reportName: "Ingolstadt Nord Tagesbericht",
    lvNumber: "LV-2078",
    address: "Ingolstadt, Manchinger Straße",
    client: "Stadt Ingolstadt",
    bauleiter: "Nina Koller",
    date: "2026-04-02",
    summary: "Vorbereitung Unterbau und Verkehrssicherung."
  },
  {
    id: "day-003",
    reportName: "Passau Südbrücke Tagesbericht",
    lvNumber: "LV-1994",
    address: "Passau, Hafenstraße",
    client: "Stadt Passau",
    bauleiter: "Mara Stein",
    date: "2026-03-28",
    summary: "Maschineneinsatz und wetterbedingte Unterbrechung."
  }
];

export const dailyEmployeeRecords: DailyEmployeeRecord[] = [
  {
    id: "de-001",
    parentId: "day-001",
    personnelNumber: "10024",
    firstName: "Lukas",
    lastName: "Bauer",
    role: "Kolonnenführer",
    startTime: "06:00",
    endTime: "16:00",
    breakMinutes: 30,
    totalHours: 9.5
  },
  {
    id: "de-002",
    parentId: "day-001",
    personnelNumber: "10031",
    firstName: "Anna",
    lastName: "Kern",
    role: "Bohlenbedienung",
    startTime: "06:15",
    endTime: "15:20",
    breakMinutes: 30,
    totalHours: 8.58
  },
  {
    id: "de-003",
    parentId: "day-002",
    personnelNumber: "10112",
    firstName: "Paul",
    lastName: "Dietrich",
    role: "Maschinist",
    startTime: "07:00",
    endTime: "15:45",
    breakMinutes: 45,
    totalHours: 8
  }
];

export const dailyTruckRecords: DailyTruckRecord[] = [
  {
    id: "dt-001",
    parentId: "day-001",
    plate: "ST-AB 204",
    vehicleType: "LKW",
    usage: "Asphaltanlieferung",
    zusatzgeraet: "Thermomulde"
  },
  {
    id: "dt-002",
    parentId: "day-001",
    plate: "ST-AB 221",
    vehicleType: "LKW",
    usage: "Fräsguttransport"
  },
  {
    id: "dt-003",
    parentId: "day-003",
    plate: "ST-PA 612",
    vehicleType: "Tieflader",
    usage: "Maschinentransport",
    zusatzgeraet: "Begleitset"
  }
];

export const dailyTruckDriverRecords: DailyTruckDriverRecord[] = [
  {
    id: "dd-001",
    parentId: "day-001",
    truckPlate: "ST-AB 204",
    driverName: "Lukas Bauer"
  },
  {
    id: "dd-002",
    parentId: "day-001",
    truckPlate: "ST-AB 221",
    driverName: "Marco Winter"
  },
  {
    id: "dd-003",
    parentId: "day-003",
    truckPlate: "ST-PA 612",
    driverName: "Oliver Kern"
  }
];

export const dailyCarRecords: DailyCarRecord[] = [
  {
    id: "dc-001",
    parentId: "day-001",
    plate: "ST-MA 14",
    usage: "Bauleitung",
    zusatzgeraet: "Vermessungskoffer"
  },
  {
    id: "dc-002",
    parentId: "day-002",
    plate: "ST-IN 77",
    usage: "Verkehrssicherung"
  }
];

export const dailyConstructionPerformanceRecords: DailyConstructionPerformanceRecord[] = [
  {
    id: "db-001",
    parentId: "day-001",
    bauleistung: "1.250 m2 Deckschicht eingebaut",
    sonstige: "Markierung vorbereitet",
    einweisung: "Sicherheitsunterweisung morgens 05:50",
    vrao: "Keine Abweichung"
  },
  {
    id: "db-002",
    parentId: "day-002",
    bauleistung: "Unterbau profiliert und verdichtet",
    sonstige: "Umleitungsführung angepasst",
    einweisung: "Einweisung für Fremdfirma durchgeführt"
  }
];

export const dailyDifficultyRecords: DailyDifficultyRecord[] = [
  {
    id: "df-001",
    parentId: "day-003",
    erschwernisse: "Windböen führten zu 45 Minuten Unterbrechung."
  },
  {
    id: "df-002",
    parentId: "day-002",
    erschwernisse: "Enge Zufahrt für größere LKW."
  }
];

export const dailyWarehouseRecords: DailyWarehouseRecord[] = [
  {
    id: "dw-001",
    parentId: "day-001",
    lagerbereitung: "Asphaltfertiger und Walzen vorbereitet",
    gemacht: "Material geprüft und Funkgeräte geladen"
  },
  {
    id: "dw-002",
    parentId: "day-003",
    lagerbereitung: "Walze samt Ersatzteilen disponiert",
    gemacht: "Hydraulikschlauch getauscht"
  }
];

export const dailyWeatherRecords: DailyWeatherRecord[] = [
  {
    id: "we-001",
    parentId: "day-001",
    sonne: true,
    regenSchnee: false,
    temperatur: "16 °C",
    wind: "leicht"
  },
  {
    id: "we-002",
    parentId: "day-002",
    sonne: false,
    regenSchnee: true,
    temperatur: "9 °C",
    wind: "mäßig"
  },
  {
    id: "we-003",
    parentId: "day-003",
    sonne: false,
    regenSchnee: true,
    temperatur: "7 °C",
    wind: "stark"
  }
];

export const dailyDocumentRecords: DailyDocumentRecord[] = [
  {
    id: "doc-001",
    parentId: "day-001",
    title: "Fotodokumentation Asphalt",
    status: "Bereit"
  },
  {
    id: "doc-002",
    parentId: "day-002",
    title: "Verkehrssicherungsplan",
    status: "Ausstehend"
  }
];
