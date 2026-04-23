export type StatusMode = "all" | "true" | "false";

export interface IncomingInvoice {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  lvNumber: string;
  bauleiter: string;
  bookingDate: string;
  passt: boolean;
  comment?: string;
  amount: number;
  statusLabel: "Bestätigt" | "Unbestätigt";
  documentUrl?: string;
  documentPath?: string;
}

export interface TransportReport {
  id: string;
  transportberichtNumber: string;
  lvNumber: string;
  projectLabel: string;
  address: string;
  client: string;
  bauleiter: string;
  date: string;
  reportType: string;
  hasDocument: boolean;
  documentUrl?: string;
  summary: string;
  mitarbeiterName?: string;
  vehicleLabel?: string;
}

export interface TransportWarehouseRecord {
  id: string;
  parentId: string;
  title: string;
  preparedBy: string;
  completedBy: string;
  machineReference?: string;
  notes: string;
}

export interface TransportTimeRecord {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  role: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalHours: number;
}

export interface TourRecord {
  id: string;
  parentId: string;
  routeLabel: string;
  deliveryNoteNumber?: string;
  loadingLocation: string;
  unloadingLocation: string;
  material: string;
  tonnage?: number;
  cubicMeters?: number;
  vehicle: string;
  notes?: string;
}

export interface TransportDetailBundle {
  lager: TransportWarehouseRecord[];
  zeiterfassung: TransportTimeRecord[];
  tours: TourRecord[];
}

export interface DailyReport {
  id: string;
  reportName: string;
  reportType?: string;
  lvNumber: string;
  address: string;
  client: string;
  bauleiter: string;
  date: string;
  summary: string;
  documentUrl?: string;
}

export interface DailyEmployeeRecord {
  id: string;
  parentId: string;
  personnelNumber: string;
  firstName: string;
  lastName: string;
  role: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalHours: number;
}

export interface DailyTruckRecord {
  id: string;
  parentId: string;
  plate: string;
  vehicleType: string;
  usage: string;
  zusatzgeraet?: string;
}

export interface DailyTruckDriverRecord {
  id: string;
  parentId: string;
  truckPlate: string;
  driverName: string;
}

export interface DailyCarRecord {
  id: string;
  parentId: string;
  plate: string;
  usage: string;
  zusatzgeraet?: string;
}

export interface DailyConstructionPerformanceRecord {
  id: string;
  parentId: string;
  bauleistung: string;
  sonstige?: string;
  einweisung?: string;
  vrao?: string;
}

export interface DailyDifficultyRecord {
  id: string;
  parentId: string;
  erschwernisse: string;
}

export interface DailyWarehouseRecord {
  id: string;
  parentId: string;
  lagerbereitung: string;
  gemacht: string;
}

export interface DailyWeatherRecord {
  id: string;
  parentId: string;
  sonne: boolean;
  regenSchnee: boolean;
  temperatur: string;
  wind: string;
}

export interface DailyDocumentRecord {
  id: string;
  parentId: string;
  title: string;
  status: string;
}

export interface DailyDetailBundle {
  mitarbeiter: DailyEmployeeRecord[];
  lkw: DailyTruckRecord[];
  lkwFahrer: DailyTruckDriverRecord[];
  pkw: DailyCarRecord[];
  bauleistung: DailyConstructionPerformanceRecord[];
  erschwernisse: DailyDifficultyRecord[];
  lager: DailyWarehouseRecord[];
  wetter: DailyWeatherRecord[];
  dokumente: DailyDocumentRecord[];
}

export interface HomeSummary {
  incomingInvoices: number;
  transportReports: number;
  dailyReports: number;
  openReviews: number;
}

export interface GeoCaptureEntry {
  id: string;
  employeeName: string;
  employeeNumber?: string;
  entryDate: string;
  workHours: number;
  department?: string;
  projectNumber?: string;
  costCenter?: string;
  address?: string;
  vehicleLicensePlate?: string;
  vehicleDescription?: string;
}

export interface GeoCaptureMonthOption {
  value: string;
  label: string;
}

export interface GeoCaptureRankingItem {
  label: string;
  value: number;
  secondary?: string;
}

export interface GeoCaptureTrendPoint {
  label: string;
  value: string;
  hours: number;
}

export interface GeoCaptureDailyPeak {
  label: string;
  date: string;
  hours: number;
}

export interface GeoCaptureAnalytics {
  periodMode: "month" | "day";
  selectedLabel: string;
  selectedMonth: string;
  selectedMonthLabel: string;
  selectedDate?: string;
  availableEmployees: string[];
  availableProjects: string[];
  totalHours: number;
  activeEmployees: number;
  averageHoursPerEmployee: number;
  workdays: number;
  entryCount: number;
  topEmployee?: GeoCaptureRankingItem;
  topDepartment?: GeoCaptureRankingItem;
  busiestDay?: GeoCaptureDailyPeak;
  employeeLeaderboard: GeoCaptureRankingItem[];
  departmentLeaderboard: GeoCaptureRankingItem[];
  projectLeaderboard: GeoCaptureRankingItem[];
  vehicleLeaderboard: GeoCaptureRankingItem[];
  monthlyTrend: GeoCaptureTrendPoint[];
}

export interface SmapOneAnalytics {
  periodMode: "month" | "day";
  selectedLabel: string;
  selectedMonth: string;
  selectedMonthLabel: string;
  selectedDate?: string;
  availableEmployees: string[];
  availableBauleiter: string[];
  availableProjects: string[];
  totalHours: number;
  activeEmployees: number;
  averageHoursPerEmployee: number;
  workdays: number;
  entryCount: number;
  topEmployee?: GeoCaptureRankingItem;
  busiestDay?: GeoCaptureDailyPeak;
  employeeLeaderboard: GeoCaptureRankingItem[];
  bauleiterLeaderboard: GeoCaptureRankingItem[];
  projectLeaderboard: GeoCaptureRankingItem[];
  sourceLeaderboard: GeoCaptureRankingItem[];
  monthlyTrend: GeoCaptureTrendPoint[];
}

export interface GeoCaptureAnalyticsFilters {
  month?: string;
  date?: string;
  periodMode?: "month" | "day";
  employeeName?: string;
  bauleiter?: string;
  projectNumbers?: string[];
  isAdmin?: boolean;
  userName?: string;
}

export interface UserAccessScope {
  isAdmin: boolean;
  bauleiter?: string;
  userName?: string;
}

export interface InvoiceFilters {
  dateFrom?: string;
  dateTo?: string;
  supplier?: string;
  bauleiter?: string;
  search?: string;
  passt?: StatusMode;
}

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  bauleiter?: string;
  lvNumbers?: string[];
  reportType?: string;
}

export interface FilterOptions {
  bauleiter: string[];
  lvNumbers: string[];
  reportTypes?: string[];
}
