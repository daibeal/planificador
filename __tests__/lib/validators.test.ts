import { describe, it, expect } from '@jest/globals';
import { itinerarioSchema, actividadSchema } from '@/lib/validators';

describe('Validadores de Itinerario', () => {
  describe('itinerarioSchema', () => {
    it('debe validar un itinerario válido', () => {
      const datosValidos = {
        nombre: 'Viaje a París',
        destino: 'París, Francia',
        fechaInicio: new Date('2024-06-01'),
        fechaFin: new Date('2024-06-10'),
        presupuesto: 2000,
        transporte: 'Avión',
        hospedaje: 'Hotel',
        notas: 'Llevar pasaporte',
        etiquetas: ['vacaciones', 'europa'],
        prioridad: 'alta' as const,
        estadoManual: 'planificado' as const,
        colorTema: '#2563eb',
      };

      const resultado = itinerarioSchema.safeParse(datosValidos);
      expect(resultado.success).toBe(true);
    });

    it('debe rechazar un nombre muy corto', () => {
      const datosInvalidos = {
        nombre: 'Ab',
        destino: 'París',
        fechaInicio: new Date('2024-06-01'),
        fechaFin: new Date('2024-06-10'),
        colorTema: '#2563eb',
      };

      const resultado = itinerarioSchema.safeParse(datosInvalidos);
      expect(resultado.success).toBe(false);
    });

    it('debe rechazar un color inválido', () => {
      const datosInvalidos = {
        nombre: 'Viaje a París',
        destino: 'París',
        fechaInicio: new Date('2024-06-01'),
        fechaFin: new Date('2024-06-10'),
        colorTema: 'rojo',
      };

      const resultado = itinerarioSchema.safeParse(datosInvalidos);
      expect(resultado.success).toBe(false);
    });

    it('debe aceptar valores opcionales como null', () => {
      const datosValidos = {
        nombre: 'Viaje a París',
        destino: 'París',
        fechaInicio: new Date('2024-06-01'),
        fechaFin: new Date('2024-06-10'),
        presupuesto: null,
        transporte: null,
        colorTema: '#2563eb',
      };

      const resultado = itinerarioSchema.safeParse(datosValidos);
      expect(resultado.success).toBe(true);
    });
  });

  describe('actividadSchema', () => {
    it('debe validar una actividad válida', () => {
      const datosValidos = {
        titulo: 'Visitar Torre Eiffel',
        descripcion: 'Subir a la torre al atardecer',
        ubicacion: 'París, Francia',
        inicio: '2024-06-01T14:00:00Z',
        fin: '2024-06-01T16:00:00Z',
        color: '#14b8a6',
        estado: 'pendiente' as const,
      };

      const resultado = actividadSchema.safeParse(datosValidos);
      expect(resultado.success).toBe(true);
    });

    it('debe rechazar un título muy corto', () => {
      const datosInvalidos = {
        titulo: 'Ab',
        color: '#14b8a6',
      };

      const resultado = actividadSchema.safeParse(datosInvalidos);
      expect(resultado.success).toBe(false);
    });

    it('debe aceptar valores opcionales', () => {
      const datosMinimos = {
        titulo: 'Visitar museo',
        color: '#14b8a6',
      };

      const resultado = actividadSchema.safeParse(datosMinimos);
      expect(resultado.success).toBe(true);
    });
  });
});
