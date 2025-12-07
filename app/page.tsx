import prisma from "@/lib/prisma";
import { toDTO } from "@/lib/serializers";
import ItinerarioDashboard from "@/components/ItinerarioDashboard";

export const revalidate = 0;

export default async function HomePage() {
  const datos = await prisma.itinerario.findMany({
    include: { actividades: { orderBy: { inicio: "asc" } } },
    orderBy: { fechaInicio: "asc" },
  });

  const serializados = datos.map(toDTO);

  return (
    <main>
      <ItinerarioDashboard initialItinerarios={serializados} />
    </main>
  );
}
