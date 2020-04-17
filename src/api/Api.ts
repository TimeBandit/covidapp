import { GoogleSpreadsheet } from "google-spreadsheet";
import { Moment } from "moment";
import { Strategy, ReportsParams } from "./Report";
import { GoogleSheetsDataStrategy } from "./strategies/google-sheets/GoogleSheetsDataStrategy";

const SHEET_ID = "1ptQxoiLEc2F0_ig47Hg5UcFyUNzpUp5ElFtHBDpuiw4";
const API_KEY = "AIzaSyBNmCyfUnkofe0Jxmf3EnwhJOY5M7MYHgw";

export class Document {
  private static instance: Document | null = null;
  public static doc: any | null = null;
  public static async getInstance(): Promise<Document> {
    if (!Document.instance) {
      this.doc = new GoogleSpreadsheet(SHEET_ID);
      this.doc.useApiKey(API_KEY); // TODO restrict in production

      // load document properties and worksheets
      await this.doc.loadInfo();

      if (!this.doc) {
        throw new Error("error loading document info");
      }
      Document.instance = new Document();
    }
    return Document;
  }
}

class Api implements Strategy {
  private static instance: Api;
  public static strategy: Strategy | null = null;
  public static getInstance(): Api {
    if (!Api.instance) {
      Api.instance = new Api();
      this.strategy = new GoogleSheetsDataStrategy();
    }
    return Api.instance;
  }
  public getReports(params?: ReportsParams) {
    if (Api.strategy === null) {
      throw new Error("no stratagy set in CaseDataApi");
    }
    return Api.strategy.getReports(params);
  }
  public getRegions() {
    if (Api.strategy === null) {
      throw new Error("no stratagy set in CaseDataApi");
    }
    return Api.strategy.getRegions();
  }
}

export default Api;
