// Adapters: normalize each engine's final result into the shared RevealProps
// shape that drives the ElectionNight reveal. Pure functions over final game
// state, no store access, so they're trivially testable. Each engine's adapter
// is its own module so a results screen loads only its own map and tables;
// this file gathers them for tests and the native vector export.
export { usReveal } from "./usReveal";
export { ukReveal } from "./ukReveal";
export { countryReveal } from "./countryReveal";
