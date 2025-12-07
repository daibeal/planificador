import {
  saveToLocalStorage,
  loadFromLocalStorage,
  getLastSyncTime,
  clearLocalStorage,
  generateTempId,
  isTempId,
} from "@/lib/localStorage";
import type { Itinerario } from "@/types/itinerario";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

const mockItinerario: Itinerario = {
  id: "test-id-1",
  nombre: "Viaje a Tokyo",
  destino: "Tokyo, Japón",
  fechaInicio: "2025-01-01T00:00:00.000Z",
  fechaFin: "2025-01-10T00:00:00.000Z",
  presupuesto: 5000,
  transporte: "Avión",
  hospedaje: "Hotel",
  notas: "Visitar templos",
  etiquetas: ["asia", "cultura"],
  prioridad: "alta",
  estadoManual: "planificado",
  colorTema: "#2563eb",
  creadoEn: "2024-12-01T00:00:00.000Z",
  actualizadoEn: "2024-12-01T00:00:00.000Z",
  actividades: [],
};

describe("localStorage utilities", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("saveToLocalStorage", () => {
    it("should save itinerarios to localStorage", () => {
      const itinerarios = [mockItinerario];
      saveToLocalStorage(itinerarios);

      const stored = localStorage.getItem("itinerarios_backup");
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(itinerarios);
    });

    it("should save last sync timestamp", () => {
      const itinerarios = [mockItinerario];
      saveToLocalStorage(itinerarios);

      const lastSync = localStorage.getItem("itinerarios_last_sync");
      expect(lastSync).toBeTruthy();
      expect(new Date(lastSync!).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("loadFromLocalStorage", () => {
    it("should load itinerarios from localStorage", () => {
      const itinerarios = [mockItinerario];
      localStorage.setItem("itinerarios_backup", JSON.stringify(itinerarios));

      const loaded = loadFromLocalStorage();
      expect(loaded).toEqual(itinerarios);
    });

    it("should return null when no data exists", () => {
      const loaded = loadFromLocalStorage();
      expect(loaded).toBeNull();
    });

    it("should return null when data is invalid", () => {
      localStorage.setItem("itinerarios_backup", "invalid json");
      const loaded = loadFromLocalStorage();
      expect(loaded).toBeNull();
    });

    it("should return null when data is not an array", () => {
      localStorage.setItem("itinerarios_backup", JSON.stringify({ not: "array" }));
      const loaded = loadFromLocalStorage();
      expect(loaded).toBeNull();
    });
  });

  describe("getLastSyncTime", () => {
    it("should get last sync timestamp", () => {
      const timestamp = new Date().toISOString();
      localStorage.setItem("itinerarios_last_sync", timestamp);

      const lastSync = getLastSyncTime();
      expect(lastSync).toBe(timestamp);
    });

    it("should return null when no sync time exists", () => {
      const lastSync = getLastSyncTime();
      expect(lastSync).toBeNull();
    });
  });

  describe("clearLocalStorage", () => {
    it("should clear localStorage", () => {
      localStorage.setItem("itinerarios_backup", JSON.stringify([mockItinerario]));
      localStorage.setItem("itinerarios_last_sync", new Date().toISOString());

      clearLocalStorage();

      expect(localStorage.getItem("itinerarios_backup")).toBeNull();
      expect(localStorage.getItem("itinerarios_last_sync")).toBeNull();
    });
  });

  describe("generateTempId", () => {
    it("should generate a temporary ID", () => {
      const id = generateTempId();
      expect(id).toMatch(/^temp_\d+_[a-z0-9]+$/);
    });

    it("should generate unique IDs", () => {
      const id1 = generateTempId();
      const id2 = generateTempId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("isTempId", () => {
    it("should return true for temporary IDs", () => {
      const tempId = generateTempId();
      expect(isTempId(tempId)).toBe(true);
    });

    it("should return false for non-temporary IDs", () => {
      expect(isTempId("regular-id")).toBe(false);
      expect(isTempId("uuid-123-456")).toBe(false);
    });
  });
});
