import { z } from "zod";

export const itinerarioSchema = z.object({
  nombre: z.string({ required_error: "El nombre es obligatorio" }).min(3),
  destino: z.string({ required_error: "El destino es obligatorio" }).min(3),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  presupuesto: z.preprocess(
    (val) => val === null || val === undefined ? null : Number(val),
    z.union([z.number().int().nonnegative(), z.null()])
  ).optional(),
  transporte: z.string().nullable().optional().default("Avión"),
  hospedaje: z.string().nullable().optional().default(""),
  notas: z.string().nullable().optional().default(""),
  etiquetas: z.array(z.string()).optional().default([]),
  prioridad: z.enum(["alta", "media", "baja"]).default("media"),
  estadoManual: z.enum(["planificado", "enCurso", "finalizado", "archivado"]).default("planificado"),
  colorTema: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, {
    message: "El color debe estar en formato hexadecimal",
  }),
});

export const itinerarioUpdateSchema = itinerarioSchema.partial();

export const actividadSchema = z.object({
  titulo: z.string().min(3),
  descripcion: z.string().optional().default(""),
  ubicacion: z.string().optional().default(""),
  inicio: z.string().datetime({ offset: true }).or(z.null()).optional(),
  fin: z.string().datetime({ offset: true }).or(z.null()).optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Color inválido").optional(),
  estado: z.enum(["pendiente", "confirmado", "completado", "cancelado"]).default("pendiente"),
});

export const actividadUpdateSchema = actividadSchema.partial().extend({
  completado: z.boolean().optional(),
});
