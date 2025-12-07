import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GET, POST } from '@/app/api/itinerarios/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// Mock de Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    itinerario: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('API de Itinerarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/itinerarios', () => {
    it('debe retornar una lista de itinerarios', async () => {
      const mockItinerarios = [
        {
          id: '1',
          nombre: 'Viaje a París',
          destino: 'París',
          fechaInicio: new Date('2024-06-01'),
          fechaFin: new Date('2024-06-10'),
          presupuesto: 2000,
          transporte: 'Avión',
          hospedaje: 'Hotel',
          notas: 'Notas',
          etiquetas: '[]',
          prioridad: 'alta',
          estadoManual: 'planificado',
          colorTema: '#2563eb',
          creadoEn: new Date(),
          actualizadoEn: new Date(),
          actividades: [],
        },
      ];

      (prisma.itinerario.findMany as jest.Mock).mockResolvedValue(mockItinerarios);

      const request = new NextRequest('http://localhost:3000/api/itinerarios');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(prisma.itinerario.findMany).toHaveBeenCalled();
    });
  });

  describe('POST /api/itinerarios', () => {
    it('debe crear un nuevo itinerario con datos válidos', async () => {
      const nuevoItinerario = {
        id: '2',
        nombre: 'Viaje a Madrid',
        destino: 'Madrid',
        fechaInicio: new Date('2024-07-01'),
        fechaFin: new Date('2024-07-10'),
        presupuesto: 1500,
        transporte: 'Avión',
        hospedaje: 'Hotel',
        notas: '',
        etiquetas: '[]',
        prioridad: 'media',
        estadoManual: 'planificado',
        colorTema: '#2563eb',
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        actividades: [],
      };

      (prisma.itinerario.create as jest.Mock).mockResolvedValue(nuevoItinerario);

      const request = new NextRequest('http://localhost:3000/api/itinerarios', {
        method: 'POST',
        body: JSON.stringify({
          nombre: 'Viaje a Madrid',
          destino: 'Madrid',
          fechaInicio: '2024-07-01',
          fechaFin: '2024-07-10',
          presupuesto: 1500,
          transporte: 'Avión',
          colorTema: '#2563eb',
          etiquetas: [],
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      expect(prisma.itinerario.create).toHaveBeenCalled();
    });

    it('debe rechazar un itinerario con fecha de fin anterior a inicio', async () => {
      const request = new NextRequest('http://localhost:3000/api/itinerarios', {
        method: 'POST',
        body: JSON.stringify({
          nombre: 'Viaje inválido',
          destino: 'Destino',
          fechaInicio: '2024-07-10',
          fechaFin: '2024-07-01',
          colorTema: '#2563eb',
          etiquetas: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});
