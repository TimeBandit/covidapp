import moment from "moment";
import { Strategy, ReportsParams, Report, Region } from "../../Report";
import { Document } from "../../Api";
import { GoogleSheet } from "./GoogleSheet";

enum ColumnName {
  AreaCode = 0,
  AreaName = 1,
  Population = 2,
}
function columnToLetter(columnIndex: number) {
  let ret = "",
    a = 1,
    b = 26;
  for (; (columnIndex -= a) >= 0; a = b, b *= 26) {
    ret = String.fromCharCode((columnIndex % b) / a + 65) + ret;
  }
  return ret;
}
export class GoogleSheetsDataStrategy implements Strategy {
  private sheet: GoogleSheet | null = null;
  private headers: string[] | undefined = undefined;
  public async getReports(
    options: ReportsParams = { pageSize: 1, beforeDate: moment.utc().toISOString() }
  ): Promise<Report[] | []> {
    await this.getSheet();
    if (!this.sheet) {
      throw new Error(`${1586981781}: no sheet found`);
    }

    const results = [];
    const { rowCount, columnCount } = this.sheet;

    // load area codes
    await this.sheet.loadCells([`A1:A${rowCount}`]);

    // load case data
    for (let currentColumnIndex = columnCount - 1; currentColumnIndex > 0; currentColumnIndex--) {
      await this.sheet.loadCells([`${columnToLetter(currentColumnIndex + 1)}1`]);
      const currentColumnDate = (await this.sheet.getCell(0, currentColumnIndex)).formattedValue;
      if (
        results.length < options.pageSize * (rowCount - 1) &&
        moment.utc(currentColumnDate).isValid() &&
        moment.utc(currentColumnDate).isBefore(options.beforeDate)
      ) {
        const columnLetter = columnToLetter(currentColumnIndex + 1);
        console.info(`Reading column , ${columnLetter}1:${columnLetter}${rowCount}`);
        await this.sheet.loadCells([`${columnLetter}1:${columnLetter}${rowCount}`]);

        for (let rowIndex = 1; rowIndex <= rowCount - 1; rowIndex++) {
          const areaCode = (await this.sheet.getCell(rowIndex, 0)).value;
          const metricValue = (await this.sheet.getCell(rowIndex, currentColumnIndex)).value;
          const date = (await this.sheet.getCell(0, currentColumnIndex)).formattedValue;

          results.push({
            areaCode,
            metricValue,
            date,
          });
        }
      } else {
        break;
      }
    }

    return results;
  }
  public async getRegions(): Promise<Region[]> {
    const results: Region[] = [];

    if (!this.sheet) {
      throw new Error(`${1587016207}: no sheet found`);
    }
    const { rowCount } = this.sheet;
    console.log("getting regions");

    await this.sheet.loadCells([`A2:C${rowCount}`]); // columns with area codes/name/population

    for (let rowIndex = 2; rowIndex <= rowCount - 1; rowIndex++) {
      const areaCode = (await this.sheet.getCell(rowIndex, ColumnName.AreaCode)).value;
      const areaName = (await this.sheet.getCell(rowIndex, ColumnName.AreaName)).value;
      const population = (await this.sheet.getCell(rowIndex, ColumnName.Population)).value;
      results.push({
        areaCode,
        areaName,
        population,
      });
    }

    return results;
  }
  public async getSheet(): Promise<GoogleSheet> {
    if (!this.sheet) {
      const indexOfEnglandSheet = 1;
      await Document.getInstance();
      this.sheet = Document.doc.sheetsByIndex[indexOfEnglandSheet];
      if (!this.sheet) {
        throw new Error(`${1587016304}: no sheet found`);
      }
    }
    return this.sheet;
  }
  public async getHeaders(): Promise<string[] | undefined> {
    if (!this.sheet) {
      throw new Error(`${1586981565}: no sheet found`);
    }
    if (!this.headers) {
      await this.sheet.loadHeaderRow();
      this.headers = this.sheet.headerValues;
    }
    return this.headers;
  }
}
