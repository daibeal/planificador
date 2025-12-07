import { describe, it, expect } from '@jest/globals';
import { toDTO } from '@/lib/serializers';
import type { Itinerario, Actividad } from '@prisma/client';

describe('Serializadores', () => {
  describe('toDTO', () => {
    it('debe convertir un itinerario de Prisma a DTO', () => {
      const fecha = new Date('2024-06-01');
      const itinerarioPrisma = {
        id: '123',
        nombre: 'Viaje a París',
        destino: 'París',
        fechaInicio: fecha,
        fechaFin: fecha,
        presupuesto: 2000,
        transporte: 'Avión',
        hospedaje: 'Hotel',
        notas: 'Notas',
        etiquetas: '["vacaciones", "europa"]',
        prioridad: 'alta',
        estadoManual: 'planificado',
        colorTema: '#2563eb',
        creadoEn: fecha,
        actualizadoEn: fecha,
        actividades: [] as Actividad[],
      };

      const dto = toDTO(itinerarioPrisma as Itinerario & { actividades: Actividad[] });

      expect(dto.id).toBe('123');
      expect(dto.nombre).toBe('Viaje a París');
      expect(dto.etiquetas).toEqual(['vacaciones', 'europa']);
      expect(dto.fechaInicio).toBe(fecha.toISOString());
    });

    it('debe manejar etiquetas vacías', () => {
      const fecha = new Date();
      const itinerarioPrisma = {
        id: '123',
        nombre: 'Viaje',
        destino: 'Destino',
        fechaInicio: fecha,
        fechaFin: fecha,
        presupuesto: null,
        transporte: null,
        hospedaje: null,
        notas: null,
        etiquetas: '[]',
        prioridad: 'media',
        estadoManual: 'planificado',
        colorTema: '#2563eb',
        creadoEn: fecha,
        actualizadoEn: fecha,
        actividades: [] as Actividad[],
      };

      const dto = toDTO(itinerarioPrisma as Itinerario & { actividades: Actividad[] });

      expect(dto.etiquetas).toEqual([]);
    });

    it('debe serializar actividades correctamente', () => {
      const fecha = new Date();
      const actividad = {
        id: 'act-1',
        itinerarioId: '123',
        titulo: 'Actividad',
        descripcion: 'Descripción',
        ubicacion: 'Ubicación',
        inicio: fecha,
        fin: fecha,
        color: '#14b8a6',
        estado: 'pendiente',
        completado: false,
        creadoEn: fecha,
        actualizadoEn: fecha,
      };

      const itinerarioPrisma = {
        id: '123',
        nombre: 'Viaje',
        destino: 'Destino',
        fechaInicio: fecha,
        fechaFin: fecha,
        presupuesto: null,
        transporte: null,
        hospedaje: null,
        notas: null,
        etiquetas: '[]',
        prioridad: 'media',
        estadoManual: 'planificado',
        colorTema: '#2563eb',
        creadoEn: fecha,
        actualizadoEn: fecha,
        actividades: [actividad] as Actividad[],
      };

      const dto = toDTO(itinerarioPrisma as Itinerario & { actividades: Actividad[] });

      expect(dto.actividades).toHaveLength(1);
      expect(dto.actividades[0].titulo).toBe('Actividad');
      expect(dto.actividades[0].inicio).toBe(fecha.toISOString());
    });
  });
});
