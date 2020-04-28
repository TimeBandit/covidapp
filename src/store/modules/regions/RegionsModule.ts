// championswimmer.in/vuex-module-decorators/
import Api from "@/api/Api";
import { Region } from "@/api/Report";
import store from "@/store";
import { Action, Module, Mutation, VuexModule, getModule } from "vuex-module-decorators";
import { AppModule } from "../app/AppModule";

const api = Api.getInstance();

export interface RegionsState {
  regions: Region[];
}
@Module({ dynamic: true, store, name: "regions" })
export default class Regions extends VuexModule implements RegionsState {
  // state
  regions: Region[] = [];

  // mutations
  @Mutation
  updateRegions(regions: Region[]) {
    this.regions = regions;
  }

  // actions
  @Action
  async fetchRegions() {
    try {
      const regions = await api.getRegions();
      this.updateRegions(regions);
    } catch (error) {
      console.error(`${1587587131}: ${error}`);
    }
  }
}

export const RegionsModule = getModule(Regions);
