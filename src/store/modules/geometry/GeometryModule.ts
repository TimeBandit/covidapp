// championswimmer.in/vuex-module-decorators/
import store from "@/store";
import { LatLngBounds, latLngBounds, latLng } from "leaflet";
import * as topoClient from "topojson-client";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
const topoJsonObjectsKeyName = "Counties_and_Unitary_Authorities_April_2019_Boundaries_EW_BGC";

export interface GeometryState {
  geojson: GeoJSON.GeoJSON;
  bounds: LatLngBounds;
}

@Module({ dynamic: true, store, name: "geometry" })
export default class Geometry extends VuexModule implements GeometryState {
  // state
  geojson: GeoJSON.GeoJSON = {
    type: "FeatureCollection",
    features: [],
  };
  bounds: LatLngBounds = new LatLngBounds(latLng(55.81, 1.76), latLng(49.86, -6.42));

  // mutations
  @Mutation
  setGeoJson(geo: GeoJSON.GeoJSON) {
    this.geojson = geo;
  }

  @Mutation
  setBbox(bbox: LatLngBounds) {
    this.bounds = bbox;
  }

  // actions
  @Action
  async fetchGeoJson() {
    try {
      const topoJson: any = await import("../../../assets/topoUA.json");

      const geo: GeoJSON.GeoJSON = topoClient.feature(
        topoJson,
        topoJson.objects[topoJsonObjectsKeyName]
      );
      this.setGeoJson(geo);

      const [west, south, east, north] = topoClient.bbox(topoJson);
      this.setBbox(
        latLngBounds([
          [south, west],
          [north, east],
        ])
      );
    } catch (error) {
      console.error(`${1587711158}: ${error}`);
    }
  }
}

export const GeometryModule = getModule(Geometry);
