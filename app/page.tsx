import prisma from "@/lib/prisma";
import { toDTO } from "@/lib/serializers";
import ItinerarioDashboard from "@/components/ItinerarioDashboard";
import type { Itinerario } from "@/types/itinerario";

export const revalidate = 0;

export default async function HomePage() {
  let serializados: Itinerario[] = [];
  
  try {
    const datos = await prisma.itinerario.findMany({
      include: { actividades: { orderBy: { inicio: "asc" } } },
      orderBy: { fechaInicio: "asc" },
    });

    serializados = datos.map(toDTO);
  } catch (error) {
    console.error("Error loading from database:", error);
    // Will load from localStorage on client side
  }

  return (
    <main>
      <ItinerarioDashboard initialItinerarios={serializados} />
    </main>
  );
}
