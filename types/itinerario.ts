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
