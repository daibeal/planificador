import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toDTO } from "@/lib/serializers";
import { itinerarioSchema } from "@/lib/validators";
import type { z } from "zod";

const includeCompleto = {
  actividades: {
    orderBy: { inicio: "asc" as const },
  },
};

export async function GET() {
  const registros = await prisma.itinerario.findMany({
    include: includeCompleto,
    orderBy: { fechaInicio: "asc" },
  });
  return NextResponse.json(registros.map(toDTO));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resultado = itinerarioSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error.flatten() }, { status: 400 });
    }
    const datos = resultado.data;
    if (datos.fechaFin < datos.fechaInicio) {
      return NextResponse.json(
        { error: "La fecha de regreso no puede ser anterior a la de inicio." },
        { status: 400 }
      );
    }

    const nuevo = await prisma.itinerario.create({
      data: adaptarDatos(datos),
      include: includeCompleto,
    });
    return NextResponse.json(toDTO(nuevo), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error al crear el itinerario." }, { status: 500 });
  }
}

type DatosItinerario = z.infer<typeof itinerarioSchema>;

function adaptarDatos(datos: DatosItinerario) {
  return {
    nombre: datos.nombre,
    destino: datos.destino,
    fechaInicio: datos.fechaInicio,
    fechaFin: datos.fechaFin,
    presupuesto: Math.max(0, Math.round(Number(datos.presupuesto ?? 0))),
    transporte: datos.transporte,
    hospedaje: datos.hospedaje,
    notas: datos.notas,
    etiquetas: JSON.stringify(datos.etiquetas ?? []),
    prioridad: datos.prioridad,
    estadoManual: datos.estadoManual,
    colorTema: datos.colorTema,
  };
}
