import { GoogleSpreadsheet } from "google-spreadsheet";
import moment, { Moment } from "moment";

const SHEET_ID = "1ptQxoiLEc2F0_ig47Hg5UcFyUNzpUp5ElFtHBDpuiw4";
const API_KEY = "AIzaSyBNmCyfUnkofe0Jxmf3EnwhJOY5M7MYHgw";

interface Report {
  date: string;
  gsscd: string;
  authorityName: string;
  count: string;
}

interface Population {
  gsscd: string;
  population: string;
}

interface ReportsParams {
  pageSize: number;
  beforeDataTime: string;
}

export interface DataStrategy {
  reports(params: ReportsParams): Promise<Report[]>;
  populations(): Promise<Population[]>;
}

class CaseDataApi implements DataStrategy {
  private static instance: CaseDataApi;
  public static strategy: DataStrategy | null = null;
  public static getInstance(): CaseDataApi {
    if (!CaseDataApi.instance) {
      CaseDataApi.instance = new CaseDataApi();
      this.strategy = new GoogleSheetsDataStrategy();
    }
    return CaseDataApi.instance;
  }
  public reports(params: ReportsParams) {
    if (CaseDataApi.strategy === null) {
      throw new Error("no stratagy set in CaseDataApi");
    }
    return CaseDataApi.strategy.reports(params);
  }
  public populations() {
    if (CaseDataApi.strategy === null) {
      throw new Error("no stratagy set in CaseDataApi");
    }
    return CaseDataApi.strategy.populations();
  }
}

export default Api;
