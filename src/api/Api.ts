import { GoogleSpreadsheet } from "google-spreadsheet";
import moment, { Moment } from "moment";
import { Strategy, ReportsParams, Report, Region } from "./Report";

const SHEET_ID = "1ptQxoiLEc2F0_ig47Hg5UcFyUNzpUp5ElFtHBDpuiw4";
const API_KEY = "AIzaSyBNmCyfUnkofe0Jxmf3EnwhJOY5M7MYHgw";

class Document {
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

class GoogleSheetsDataStrategy implements Strategy {
  private sheet: {
    headerValues: string[];
    loadHeaderRow: () => Promise<void>;
    getRows: () => Promise<[]>;
  } | null = null;
  private dateHeaders: string[] | undefined = undefined;
  private regionHeaders: string[] | undefined = undefined;

  public async reports(
    options: ReportsParams = { pageSize: 1, beforeDate: moment.utc().toISOString() }
  ): Promise<Report[] | []> {
    await this.loadSheet();
    await this.loadDateHeaders();
    const matchedHeaders = this.getMatchedDateHeaders(options);
    const matchedReports = this.getMatchedReports(matchedHeaders);

    return matchedReports;
  }
  public async regions(): Promise<Region[]> {
    await this.loadSheet();
    await this.loadRegionHeaders();
    if (!this.regionHeaders) {
      throw new Error(`${1585995507} no region headers found`);
    }
    const regions = this.getRegions(this.regionHeaders);
    return regions;
  }

  public async loadSheet() {
    if (!this.sheet) {
      const indexOfEnglandSheet = 1;
      await Document.getInstance();
      this.sheet = Document.doc.sheetsByIndex[indexOfEnglandSheet];
      if (!this.sheet) {
        throw new Error("no sheet loaded");
      }
    }
  }

  public async loadRegionHeaders(): Promise<string[] | undefined> {
    if (!this.regionHeaders) {
      await this.sheet?.loadHeaderRow();
      // reversing so we have the newst first
      this.regionHeaders = this.sheet?.headerValues.slice(0, 3).reverse();
    }
    return this.regionHeaders;
  }

  public async loadDateHeaders(): Promise<string[] | undefined> {
    if (!this.dateHeaders) {
      await this.sheet?.loadHeaderRow();
      // reversing so we have the newst first
      this.dateHeaders = this.sheet?.headerValues.slice(3).reverse();
    }
    return this.dateHeaders;
  }

  public getMatchedDateHeaders(options: ReportsParams): string[] {
    const matches: string[] = [];
    this.dateHeaders?.some((headerDate: string) => {
      if (
        moment.utc(headerDate).isSameOrBefore(options.beforeDate) &&
        matches.length < options.pageSize
      ) {
        matches.push(headerDate);
      }
    });
    return matches;
  }

  public async getRegions(regionHeaders: string[]): Promise<Region[]> {
    if (!this.sheet) {
      throw new Error("well I can't get no regions without a sheet");
    }
    const rows = await this.sheet.getRows();
    const results: Region[] = [];

    // using a reduce to result is dependant on the headers in the sheet
    // changes will be picked up automatically. they are not fixed
    const rowResults = rows.map(
      (row: { [id: string]: string }): Region => {
        // TODO add the types to the line above
        return regionHeaders.reduce((prevResult, currentValue) => {
          prevResult[currentValue] = row.currentValue;
          return prevResult;
        }, {});
        return {
          areaCode: row.areaCode,
          areaName: row.areaName,
          population: row.population,
        };
      }
    );
    results.push(...rowResults);

    return results;
  }
  public async getMatchedReports(matchedHeaders: string[]): Promise<Report[]> {
    if (!this.sheet) {
      throw new Error("well I can't get no reports without a sheet");
    }
    const rows = await this.sheet.getRows();
    const results: Report[] = [];

    matchedHeaders.forEach((headerString: string) => {
      const rowResults = rows.map(
        (row: { [id: string]: string }): Report => {
          const count = row[headerString];
          return { areaCode: row.areaCode, count, date: headerString };
        }
      );
      results.push(...rowResults);
    });

    return results;
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
  public reports(params?: ReportsParams) {
    if (Api.strategy === null) {
      throw new Error("no stratagy set in CaseDataApi");
    }
    return Api.strategy.reports(params);
  }
  public regions() {
    if (Api.strategy === null) {
      throw new Error("no stratagy set in CaseDataApi");
    }
    return Api.strategy.regions();
  }
}

export default Api;
