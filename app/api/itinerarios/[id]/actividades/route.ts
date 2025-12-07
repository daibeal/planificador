import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { actividadSchema } from "@/lib/validators";
import { toDTO } from "@/lib/serializers";

const includeCompleto = {
  actividades: {
    orderBy: { inicio: "asc" as const },
  },
};

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const resultado = actividadSchema.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error.flatten() }, { status: 400 });
    }
    const datos = resultado.data;
    const actualizado = await prisma.itinerario.update({
      where: { id: params.id },
      data: {
        actividades: {
          create: {
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            ubicacion: datos.ubicacion,
            inicio: datos.inicio ? new Date(datos.inicio) : null,
            fin: datos.fin ? new Date(datos.fin) : null,
            color: datos.color ?? "#14b8a6",
            estado: datos.estado ?? "pendiente",
            completado: datos.estado === "completado",
          },
        },
      },
      include: includeCompleto,
    });
    return NextResponse.json(toDTO(actualizado));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Itinerario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "No se pudo agregar la actividad" }, { status: 500 });
  }
}
