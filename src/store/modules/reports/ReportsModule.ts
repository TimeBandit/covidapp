// championswimmer.in/vuex-module-decorators/
import Api from "@/api/Api";
import { Report } from "@/api/Report";
import store from "@/store";
import { Action, Module, Mutation, VuexModule, getModule } from "vuex-module-decorators";
const api = Api.getInstance();

export interface ReportsState {
  reports: Report[];
}
@Module({ dynamic: true, store, name: "reports" })
export default class Reports extends VuexModule implements ReportsState {
  // state
  reports: Report[] = [];

  // mutations
  @Mutation
  setReports(reports: Report[]) {
    this.reports = reports;
  }

  // actions
  @Action
  async fetchReports() {
    try {
      const reports = await api.getReports();
      this.setReports(reports);
    } catch (error) {
      console.error(`${1587587242}: ${error}`);
    }
  }
}

export const ReportsModule = getModule(Reports);
