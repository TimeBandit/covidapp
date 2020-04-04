export interface Report {
  areaCode: string;
  count: string;
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
  reports(params?: ReportsParams): Promise<Report[]>;
  regions(): Promise<Region[]>;
}
