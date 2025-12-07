import type { Actividad, Itinerario as PrismaItinerario } from "@prisma/client";
import type { Itinerario } from "@/types/itinerario";

export function toDTO(
  itinerario: PrismaItinerario & { actividades: Actividad[] }
): Itinerario {
  return {
    id: itinerario.id,
    nombre: itinerario.nombre,
    destino: itinerario.destino,
    fechaInicio: itinerario.fechaInicio.toISOString(),
    fechaFin: itinerario.fechaFin.toISOString(),
    presupuesto: itinerario.presupuesto ?? 0,
    transporte: itinerario.transporte ?? "",
    hospedaje: itinerario.hospedaje ?? "",
    notas: itinerario.notas ?? "",
    etiquetas: safeParseEtiquetas(itinerario.etiquetas),
    prioridad: (itinerario.prioridad as Itinerario["prioridad"]) ?? "media",
    estadoManual:
      (itinerario.estadoManual as Itinerario["estadoManual"]) ?? "planificado",
    colorTema: itinerario.colorTema ?? "#2563eb",
    creadoEn: itinerario.creadoEn.toISOString(),
    actualizadoEn: itinerario.actualizadoEn.toISOString(),
    actividades: itinerario.actividades.map((actividad) => ({
      id: actividad.id,
      itinerarioId: actividad.itinerarioId,
      titulo: actividad.titulo,
      descripcion: actividad.descripcion,
      ubicacion: actividad.ubicacion,
      inicio: actividad.inicio?.toISOString() ?? null,
      fin: actividad.fin?.toISOString() ?? null,
      color: actividad.color,
      estado: (actividad.estado as any) ?? "pendiente",
      completado: actividad.completado,
      creadoEn: actividad.creadoEn.toISOString(),
      actualizadoEn: actividad.actualizadoEn.toISOString(),
    })),
  };
}

function safeParseEtiquetas(valor: string | null): string[] {
  if (!valor) return [];
  try {
    const resultado = JSON.parse(valor);
    if (Array.isArray(resultado)) {
      return resultado.map((item) => String(item)).filter(Boolean);
    }
    return [];
  } catch (error) {
    return [];
  }
}
