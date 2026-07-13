import type { CinemaScenario } from '../types';
import { scenarioRooftop } from './s01-rooftop';
import { scenarioRidge } from './s02-ridge';
import { scenarioWake } from './s03-wake';

export const CINEMA_SCENARIOS: CinemaScenario[] = [
  scenarioRooftop,
  scenarioRidge,
  scenarioWake,
];

export function getScenario(id: string): CinemaScenario | undefined {
  return CINEMA_SCENARIOS.find(s => s.id === id);
}
