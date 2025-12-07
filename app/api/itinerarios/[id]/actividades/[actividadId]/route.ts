import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { actividadUpdateSchema } from "@/lib/validators";
import { toDTO } from "@/lib/serializers";
import type { z } from "zod";

export const dynamic = 'force-dynamic';

const includeCompleto = {
  actividades: {
    orderBy: { inicio: "asc" as const },
  },
};

type Params = { params: { id: string; actividadId: string } };
type DatosActividad = z.infer<typeof actividadUpdateSchema>;

export async function PATCH(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const resultado = actividadUpdateSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error.flatten() }, { status: 400 });
    }
    const datos = resultado.data;
    const actualizado = await prisma.itinerario.update({
      where: { id: params.id },
      data: {
        actividades: {
          update: {
            where: { id: params.actividadId },
            data: adaptarActividad(datos),
          },
        },
      },
      include: includeCompleto,
    });
    return NextResponse.json(toDTO(actualizado));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "No se pudo actualizar la actividad" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const actualizado = await prisma.itinerario.update({
      where: { id: params.id },
      data: {
        actividades: {
          delete: { id: params.actividadId },
        },
      },
      include: includeCompleto,
    });
    return NextResponse.json(toDTO(actualizado));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "No se pudo eliminar la actividad" }, { status: 500 });
  }
}

function adaptarActividad(datos: DatosActividad) {
  const payload: Record<string, unknown> = {};
  if (datos.titulo) payload.titulo = datos.titulo;
  if (typeof datos.descripcion !== "undefined") payload.descripcion = datos.descripcion;
  if (typeof datos.ubicacion !== "undefined") payload.ubicacion = datos.ubicacion;
  if (typeof datos.color !== "undefined") payload.color = datos.color;
  if (typeof datos.estado !== "undefined") payload.estado = datos.estado;
  if (typeof datos.completado !== "undefined") payload.completado = datos.completado;
  if (typeof datos.inicio !== "undefined") {
    payload.inicio = datos.inicio ? new Date(datos.inicio) : null;
  }
  if (typeof datos.fin !== "undefined") {
    payload.fin = datos.fin ? new Date(datos.fin) : null;
  }
  return payload;
}
