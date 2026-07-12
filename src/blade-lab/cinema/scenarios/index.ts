import type { CinemaScenario } from '../types';
import { scenarioRooftop } from './s01-rooftop';

export const CINEMA_SCENARIOS: CinemaScenario[] = [
  scenarioRooftop,
];

export function getScenario(id: string): CinemaScenario | undefined {
  return CINEMA_SCENARIOS.find(s => s.id === id);
}
