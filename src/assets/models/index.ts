// Centralised registry of uploaded turbine GLB pointers.
import hawtHero from "./wind_turbine_animated.glb.asset.json";
import hawtAlt from "./wind_turbine_animated-2.glb.asset.json";
import hawtCompact from "./wind_generator_animated.glb.asset.json";
import phoenix from "./phoenix_rising_eco_wind_generator.glb.asset.json";
import vawtHero from "./vertical_wind_turbine.glb.asset.json";
import darrieus from "./darrieus_rotor_for_vertical_wind_turbine_.stl.glb.asset.json";
import savoniusMain from "./savonius3_main.glb.asset.json";
import savoniusTop from "./savonius3_top.glb.asset.json";
import archimedes from "./archimedes_wind_turbine.glb.asset.json";
// Second batch — modern utility turbines, farms and classic windmills.
import turbineAnimated from "./animated_wind_turbine.glb.asset.json";
import turbineStatic from "./wind_turbine.glb.asset.json";
import generatorSmall from "./wind_generator.glb.asset.json";
import spinner from "./wind_spinnerwhirligig.glb.asset.json";
import windmillClassic from "./windmill.glb.asset.json";
import windmillAnimated from "./windmill__animated.glb.asset.json";
import windmillHighpoly from "./simple_animated_highpoly_windmill.glb.asset.json";
import windmillTech from "./tech_windmill.glb.asset.json";
import windmillFarm from "./windmill_pump_farm.glb.asset.json";

export const TURBINE_MODELS = {
  hawtHero: hawtHero.url,
  hawtAlt: hawtAlt.url,
  hawtCompact: hawtCompact.url,
  phoenix: phoenix.url,
  vawtHero: vawtHero.url,
  darrieus: darrieus.url,
  savoniusMain: savoniusMain.url,
  savoniusTop: savoniusTop.url,
  archimedes: archimedes.url,
  turbineAnimated: turbineAnimated.url,
  turbineStatic: turbineStatic.url,
  generatorSmall: generatorSmall.url,
  spinner: spinner.url,
  windmillClassic: windmillClassic.url,
  windmillAnimated: windmillAnimated.url,
  windmillHighpoly: windmillHighpoly.url,
  windmillTech: windmillTech.url,
  windmillFarm: windmillFarm.url,
} as const;

export type TurbineModelKey = keyof typeof TURBINE_MODELS;
