import Vue from "vue";
import Vuex from "vuex";
import { GeometryState } from "./modules/geometry/GeometryModule";
import { AppState } from "./modules/app/AppModule";
import { RegionsState } from "./modules/regions/RegionsModule";
import { ReportsState } from "./modules/reports/ReportsModule";

Vue.use(Vuex);
export interface RootState {
  app: AppState;
  geometry: GeometryState;
  regions: RegionsState;
  reports: ReportsState;
}

export default new Vuex.Store<RootState>({});
