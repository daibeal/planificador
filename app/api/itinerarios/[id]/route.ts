import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { toDTO } from "@/lib/serializers";
import { itinerarioUpdateSchema } from "@/lib/validators";
import type { z } from "zod";

export const dynamic = 'force-dynamic';

const includeCompleto = {
  actividades: {
    orderBy: { inicio: "asc" as const },
  },
};

type Params = { params: { id: string } };

type DatosParciales = z.infer<typeof itinerarioUpdateSchema>;

export async function GET(_request: Request, { params }: Params) {
  const registro = await prisma.itinerario.findUnique({
    where: { id: params.id },
    include: includeCompleto,
  });
  if (!registro) {
    return NextResponse.json({ error: "Itinerario no encontrado" }, { status: 404 });
  }
  return NextResponse.json(toDTO(registro));
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const resultado = itinerarioUpdateSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error.flatten() }, { status: 400 });
    }
    const datos = resultado.data;
    if (datos.fechaInicio && datos.fechaFin && datos.fechaFin < datos.fechaInicio) {
      return NextResponse.json(
        { error: "La fecha de regreso no puede ser anterior a la de inicio." },
        { status: 400 }
      );
    }
    const actualizado = await prisma.itinerario.update({
      where: { id: params.id },
      data: adaptarParcial(datos),
      include: includeCompleto,
    });
    return NextResponse.json(toDTO(actualizado));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Itinerario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "No se pudo actualizar el registro." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const eliminado = await prisma.itinerario.delete({
      where: { id: params.id },
      include: includeCompleto,
    });
    return NextResponse.json(toDTO(eliminado));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Itinerario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
  }
}

function adaptarParcial(datos: DatosParciales) {
  const payload: Record<string, unknown> = {};
  if (datos.nombre) payload.nombre = datos.nombre;
  if (datos.destino) payload.destino = datos.destino;
  if (datos.fechaInicio) payload.fechaInicio = datos.fechaInicio;
  if (datos.fechaFin) payload.fechaFin = datos.fechaFin;
  if (typeof datos.presupuesto !== "undefined") {
    payload.presupuesto = Math.max(0, Math.round(Number(datos.presupuesto ?? 0)));
  }
  if (typeof datos.transporte !== "undefined") payload.transporte = datos.transporte;
  if (typeof datos.hospedaje !== "undefined") payload.hospedaje = datos.hospedaje;
  if (typeof datos.notas !== "undefined") payload.notas = datos.notas;
  if (typeof datos.colorTema !== "undefined") payload.colorTema = datos.colorTema;
  if (typeof datos.etiquetas !== "undefined") {
    payload.etiquetas = JSON.stringify(datos.etiquetas ?? []);
  }
  if (datos.prioridad) payload.prioridad = datos.prioridad;
  if (datos.estadoManual) payload.estadoManual = datos.estadoManual;
  return payload;
}
