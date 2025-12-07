export type EstadoManual = "planificado" | "enCurso" | "finalizado" | "archivado";
export type Prioridad = "alta" | "media" | "baja";
export type EstadoActividad = "pendiente" | "confirmado" | "completado" | "cancelado";

export interface Actividad {
  id: string;
  itinerarioId: string;
  titulo: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  inicio?: string | null;
  fin?: string | null;
  color?: string | null;
  estado: EstadoActividad;
  completado: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Viajero {
  nombre: string;
  documento: string;
  telefono?: string;
}

export interface DocumentoViaje {
  tipo: string;
  numero?: string;
  vencimiento?: string;
}

export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  relacion?: string;
}

export interface ItemPacking {
  id: string;
  nombre: string;
  categoria: string;
  empacado: boolean;
}

export interface Itinerario {
  id: string;
  nombre: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  presupuesto?: number | null;
  transporte?: string | null;
  hospedaje?: string | null;
  notas?: string | null;
  etiquetas: string[];
  prioridad: Prioridad;
  estadoManual: EstadoManual;
  colorTema: string;
  creadoEn: string;
  actualizadoEn: string;
  actividades: Actividad[];
  // Extended fields for more details
  viajeros?: Viajero[];
  numeroViajeros?: number | null;
  clima?: string | null;
  idioma?: string | null;
  moneda?: string | null;
  seguro?: string | null;
  numeroSeguro?: string | null;
  documentos?: DocumentoViaje[];
  contactosEmergencia?: ContactoEmergencia[];
  packingList?: ItemPacking[];
  restricciones?: string | null;
  vacunas?: string | null;
  visa?: string | null;
  paginaWeb?: string | null;
  confirmaciones?: string | null;
}

export interface ItinerarioPayload {
  nombre: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  presupuesto?: number | null;
  transporte?: string | null;
  hospedaje?: string | null;
  notas?: string | null;
  etiquetas: string[];
  prioridad: Prioridad;
  estadoManual: EstadoManual;
  colorTema: string;
  // Extended fields
  viajeros?: Viajero[];
  numeroViajeros?: number | null;
  clima?: string | null;
  idioma?: string | null;
  moneda?: string | null;
  seguro?: string | null;
  numeroSeguro?: string | null;
  documentos?: DocumentoViaje[];
  contactosEmergencia?: ContactoEmergencia[];
  packingList?: ItemPacking[];
  restricciones?: string | null;
  vacunas?: string | null;
  visa?: string | null;
  paginaWeb?: string | null;
  confirmaciones?: string | null;
}

export interface ActividadPayload {
  titulo: string;
  descripcion?: string;
  ubicacion?: string;
  inicio?: string | null;
  fin?: string | null;
  color?: string;
  estado?: EstadoActividad;
}

export interface FiltrosItinerario {
  texto: string;
  fecha: string;
  estado: "todos" | EstadoManual;
  prioridad: "todas" | Prioridad;
  orden: "fechaAsc" | "fechaDesc" | "presupuesto" | "creacion";
}
