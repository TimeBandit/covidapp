// championswimmer.in/vuex-module-decorators/
import store from "@/store";
import { Action, Module, Mutation, VuexModule, getModule } from "vuex-module-decorators";
import { GeometryModule } from "@/store/modules/geometry/GeometryModule";
import { RegionsModule } from "@/store/modules/regions/RegionsModule";
import { ReportsModule } from "../reports/ReportsModule";

export interface AppState {
  loading: boolean;
}

@Module({ dynamic: true, store, name: "app" })
export default class App extends VuexModule implements AppState {
  // state
  loading = false;

  // mutations
  @Mutation
  setLoading(loading: boolean) {
    this.loading = loading;
  }

  // actions
  @Action
  async fetchData() {
    this.setLoading(true);
    await GeometryModule.fetchGeoJson();
    await RegionsModule.fetchRegions();
    await ReportsModule.fetchReports();
    this.setLoading(false);
  }
}

export const AppModule = getModule(App);
