export interface Report {
  areaCode: string;
  metricValue: string;
  date: string;
}
export interface Region {
  areaCode: string;
  areaName: string;
  population: string;
}
export interface ReportsParams {
  pageSize: number;
  beforeDate: string;
}
export interface Strategy {
  getReports(params?: ReportsParams): Promise<Report[]>;
  getRegions(): Promise<Region[]>;
}
