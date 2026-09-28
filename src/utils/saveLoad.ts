import { GameState } from '../types/game';
import { CITIES } from '../data/cities';

export interface SaveMetadata {
  airlineName: string;
  airlineColor: string;
  currentYear: number;
  currentQuarter: number;
  turnNumber: number;
  cashK: number;
  fleetCount: number;
  routesCount: number;
  rank: number;
  savedAt: string; // ISO string
}

const AUTOSAVE_KEY = 'aerobiz_autosave';
const MANUAL_SAVE_KEY = 'aerobiz_manual_save';
const AUTOSAVE_META_KEY = 'aerobiz_autosave_meta';
const MANUAL_META_KEY = 'aerobiz_manual_meta';

/**
 * Extract summary metadata for quick UI presentation
 */
export function extractSaveMetadata(state: GameState): SaveMetadata {
  const player = state.airlines.find((a) => a.isHuman) || state.airlines[0];
  const playerRoutes = state.routes.filter((r) => r.airlineId === player.id);
  const playerRank = state.airlineStandings?.find((s) => s.isHuman)?.rank || 1;

  return {
    airlineName: player?.name || 'Siam Supersonic Airways',
    airlineColor: player?.color || '#38bdf8',
    currentYear: state.currentYear,
    currentQuarter: state.currentQuarter,
    turnNumber: state.turnNumber,
    cashK: player?.cashK || 0,
    fleetCount: player?.fleet.length || 0,
    routesCount: playerRoutes.length,
    rank: playerRank,
    savedAt: new Date().toISOString(),
  };
}

/**
 * Validate and patch loaded state for backward compatibility
 */
export function sanitizeLoadedState(loadedState: any): GameState {
  if (!loadedState || !Array.isArray(loadedState.airlines) || !Array.isArray(loadedState.routes)) {
    throw new Error('Invalid save file: missing airlines or routes data.');
  }

  // Ensure airportSlots exists
  if (!loadedState.airportSlots || typeof loadedState.airportSlots !== 'object') {
    loadedState.airportSlots = CITIES.reduce((acc, c) => {
      acc[c.id] = c.baseSlots;
      return acc;
    }, {} as Record<string, number>);
  }

  // Ensure airportExpansions exists
  if (!Array.isArray(loadedState.airportExpansions)) {
    loadedState.airportExpansions = [];
  }

  // Ensure activeEvents exists
  if (!Array.isArray(loadedState.activeEvents)) {
    loadedState.activeEvents = [];
  }

  return loadedState as GameState;
}

/**
 * Save game state to localStorage
 */
export function saveGameToLocalStorage(
  state: GameState,
  isAutoSave: boolean = true
): boolean {
  try {
    const key = isAutoSave ? AUTOSAVE_KEY : MANUAL_SAVE_KEY;
    const metaKey = isAutoSave ? AUTOSAVE_META_KEY : MANUAL_META_KEY;

    const json = JSON.stringify(state);
    localStorage.setItem(key, json);

    const meta = extractSaveMetadata(state);
    localStorage.setItem(metaKey, JSON.stringify(meta));
    return true;
  } catch (err) {
    console.error('Failed to save game to localStorage:', err);
    return false;
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameFromLocalStorage(
  isAutoSave: boolean = true
): GameState | null {
  try {
    const key = isAutoSave ? AUTOSAVE_KEY : MANUAL_SAVE_KEY;
    const json = localStorage.getItem(key);
    if (!json) return null;

    const parsed = JSON.parse(json);
    return sanitizeLoadedState(parsed);
  } catch (err) {
    console.error('Failed to load game from localStorage:', err);
    return null;
  }
}

/**
 * Get save metadata without parsing the entire game state
 */
export function getSaveMetadata(isAutoSave: boolean = true): SaveMetadata | null {
  try {
    const metaKey = isAutoSave ? AUTOSAVE_META_KEY : MANUAL_META_KEY;
    const json = localStorage.getItem(metaKey);
    if (!json) return null;
    return JSON.parse(json) as SaveMetadata;
  } catch (err) {
    return null;
  }
}

/**
 * Check if any valid save exists (auto or manual)
 */
export function getLatestAvailableSave(): {
  isAutoSave: boolean;
  metadata: SaveMetadata;
} | null {
  const autoMeta = getSaveMetadata(true);
  const manualMeta = getSaveMetadata(false);

  if (!autoMeta && !manualMeta) return null;
  if (autoMeta && !manualMeta) return { isAutoSave: true, metadata: autoMeta };
  if (!autoMeta && manualMeta) return { isAutoSave: false, metadata: manualMeta };

  // Pick the one with the latest timestamp
  const autoDate = new Date(autoMeta!.savedAt).getTime();
  const manualDate = new Date(manualMeta!.savedAt).getTime();

  return autoDate >= manualDate
    ? { isAutoSave: true, metadata: autoMeta! }
    : { isAutoSave: false, metadata: manualMeta! };
}

/**
 * Export game state as a downloadable JSON file
 */
export function exportSaveFile(state: GameState): void {
  try {
    const player = state.airlines.find((a) => a.isHuman) || state.airlines[0];
    const sanitizedName = (player?.name || 'Airline').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Aerobiz_Save_${sanitizedName}_${state.currentYear}_Q${state.currentQuarter}.json`;

    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export save file:', err);
  }
}

/**
 * Import and parse game state from a JSON file
 */
export function importSaveFile(file: File): Promise<GameState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const state = sanitizeLoadedState(parsed);
        resolve(state);
      } catch (err) {
        reject(new Error('Invalid save file format. Please upload a valid Aerobiz JSON save.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
