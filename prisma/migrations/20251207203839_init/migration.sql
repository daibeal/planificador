-- CreateTable
CREATE TABLE "Itinerario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME NOT NULL,
    "presupuesto" INTEGER,
    "transporte" TEXT,
    "hospedaje" TEXT,
    "notas" TEXT,
    "etiquetas" TEXT NOT NULL DEFAULT '[]',
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "estadoManual" TEXT NOT NULL DEFAULT 'planificado',
    "colorTema" TEXT NOT NULL DEFAULT '#2563eb',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itinerarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "ubicacion" TEXT,
    "inicio" DATETIME,
    "fin" DATETIME,
    "color" TEXT NOT NULL DEFAULT '#14b8a6',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Actividad_itinerarioId_fkey" FOREIGN KEY ("itinerarioId") REFERENCES "Itinerario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
