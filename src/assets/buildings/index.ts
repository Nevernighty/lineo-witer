// Registry of user-uploaded building GLB pointers with rough footprint metadata.
// Footprints are approximate (metres) and used only to place actors on the stage.
import slavutych5 from "./slavutych_5-floors_appartments.glb.asset.json";
import panel12160 from "./121-60-25_panel_building.glb.asset.json";
import boxLike from "./box-like_building.glb.asset.json";
import cherkasy9 from "./cherkasy_9-floors_appartments.glb.asset.json";
import krSpire from "./kryvyi_rih_95th_block_spire.glb.asset.json";
import krUniversity from "./kryvyi_rih_national_university.glb.asset.json";
import panelKT from "./panel_building_kt-serie.glb.asset.json";
import palace from "./pripyat_palace_of_culture_energetik.glb.asset.json";
import station from "./railway_station_chervona.glb.asset.json";
import kiosk from "./simple_90s_kiosk.glb.asset.json";

export interface BuildingSpec {
  url: string;
  labelUA: string;
  labelEN: string;
  /** Target world size (largest bbox axis, metres) used for auto-fit. */
  targetSize: number;
  /** Approximate height above ground for turbine mounting (metres, world units). */
  roofHeight: number;
}

export const BUILDING_MODELS: Record<string, BuildingSpec> = {
  slavutych5:    { url: slavutych5.url,   labelUA: "5-поверхівка Славутич",   labelEN: "Slavutych 5-storey",      targetSize: 12, roofHeight: 6.5 },
  panel12160:    { url: panel12160.url,   labelUA: "Панельна 121-60-25",       labelEN: "121-60-25 panel block",   targetSize: 14, roofHeight: 8   },
  boxLike:       { url: boxLike.url,      labelUA: "Кубічний будинок",          labelEN: "Box-like building",       targetSize: 10, roofHeight: 5.5 },
  cherkasy9:     { url: cherkasy9.url,    labelUA: "9-поверхівка Черкаси",     labelEN: "Cherkasy 9-storey",       targetSize: 16, roofHeight: 11  },
  krSpire:       { url: krSpire.url,      labelUA: "Шпиль 95-го Кривий Ріг",   labelEN: "Kryvyi Rih 95th spire",   targetSize: 22, roofHeight: 18  },
  krUniversity:  { url: krUniversity.url, labelUA: "КНУ Кривий Ріг",           labelEN: "Kryvyi Rih University",   targetSize: 20, roofHeight: 12  },
  panelKT:       { url: panelKT.url,      labelUA: "Панельна серії КТ",        labelEN: "KT-series panel block",   targetSize: 14, roofHeight: 8   },
  palace:        { url: palace.url,       labelUA: "Палац культури Енергетик", labelEN: "Palace of Culture",       targetSize: 18, roofHeight: 9   },
  station:       { url: station.url,      labelUA: "Вокзал Червона",           labelEN: "Chervona station",        targetSize: 16, roofHeight: 8   },
  kiosk:         { url: kiosk.url,        labelUA: "Кіоск 90-х",               labelEN: "90s kiosk",               targetSize: 3,  roofHeight: 2.6 },
} as const;

export type BuildingKey = keyof typeof BUILDING_MODELS;
