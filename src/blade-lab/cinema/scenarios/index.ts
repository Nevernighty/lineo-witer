import type { CinemaScenario } from '../types';
import { scenarioRooftop } from './s01-rooftop';
import { scenarioRidge } from './s02-ridge';
import { scenarioWake } from './s03-wake';
import { scenarioUrbanCanyon } from './s04-urban-canyon';
import { scenarioRooftopParapet } from './s05-rooftop-parapet';
import { scenarioColdStart } from './s06-cold-start';

export const CINEMA_SCENARIOS: CinemaScenario[] = [
  scenarioRooftop,
  scenarioRooftopParapet,
  scenarioUrbanCanyon,
  scenarioRidge,
  scenarioWake,
  scenarioColdStart,
];

export function getScenario(id: string): CinemaScenario | undefined {
  return CINEMA_SCENARIOS.find(s => s.id === id);
}
