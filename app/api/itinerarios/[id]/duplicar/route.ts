import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toDTO } from "@/lib/serializers";

const includeCompleto = {
  actividades: {
    orderBy: { inicio: "asc" as const },
  },
};

type Params = { params: { id: string } };

export async function POST(_request: Request, { params }: Params) {
  const original = await prisma.itinerario.findUnique({
    where: { id: params.id },
    include: includeCompleto,
  });
  if (!original) {
    return NextResponse.json({ error: "Itinerario no encontrado" }, { status: 404 });
  }

  const copia = await prisma.itinerario.create({
    data: {
      nombre: `${original.nombre} (copia)`,
      destino: original.destino,
      fechaInicio: original.fechaInicio,
      fechaFin: original.fechaFin,
      presupuesto: original.presupuesto,
      transporte: original.transporte,
      hospedaje: original.hospedaje,
      notas: original.notas,
      etiquetas: original.etiquetas,
      prioridad: original.prioridad,
      estadoManual: original.estadoManual,
      colorTema: original.colorTema,
      actividades: {
        create: original.actividades.map((actividad) => ({
          titulo: actividad.titulo,
          descripcion: actividad.descripcion,
          ubicacion: actividad.ubicacion,
          inicio: actividad.inicio,
          fin: actividad.fin,
          color: actividad.color,
          estado: actividad.estado,
          completado: false,
        })),
      },
    },
    include: includeCompleto,
  });

  return NextResponse.json(toDTO(copia));
}
