import type { Itinerario } from "@/types/itinerario";

const STORAGE_KEY = "itinerarios_backup";
const LAST_SYNC_KEY = "itinerarios_last_sync";

/**
 * Save itinerarios to localStorage
 */
export function saveToLocalStorage(itinerarios: Itinerario[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerarios));
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

/**
 * Load itinerarios from localStorage
 */
export function loadFromLocalStorage(): Itinerario[] | null {
  if (typeof window === "undefined") return null;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return null;
  }
}

/**
 * Get last sync timestamp
 */
export function getLastSyncTime(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch (error) {
    console.error("Error getting last sync time:", error);
    return null;
  }
}

/**
 * Clear localStorage backup
 */
export function clearLocalStorage(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
}

/**
 * Generate a temporary ID for new items
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if ID is temporary
 */
export function isTempId(id: string): boolean {
  return id.startsWith("temp_");
}
