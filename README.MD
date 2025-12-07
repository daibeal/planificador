# Planificador de itinerarios (Next.js + Prisma)

Aplicación web 100 % en español creada con Next.js 14, Prisma y SQLite para planear viajes con actividades, franjas horarias de colores y reportes rápidos. Incluye flujo CRUD completo, importación/exportación en JSON y un workflow de GitHub Actions listo para desplegar la build.

## Requisitos

- Node.js 18 o superior
- npm 9+

## Puesta en marcha

```bash
npm install
npm run dev
```

El proyecto usa SQLite. Al ejecutar `npm install` se genera automáticamente el cliente Prisma. Si necesitas reiniciar la base local:

```bash
npx prisma migrate dev --name init
```

## Scripts disponibles

- `npm run dev`: servidor de desarrollo en `http://localhost:3000`
- `npm run build`: ejecuta `prisma migrate deploy` y compila la app
- `npm start`: arranca la versión de producción
- `npm run lint`: reglas de Next.js/ESLint

## Funcionalidades destacadas

- Gestión completa de itinerarios con prioridad, estado manual y color temático
- Persistencia de actividades con inicio/fin, color de franja, estado y ubicación
- Panel de filtros combinados (texto, fecha, estado, prioridad y orden)
- Resumen con totales, próximos 30 días, presupuesto acumulado y paletas activas
- Importación y exportación en JSON compatibles con la base
- Duplicación instantánea de itinerarios preservando actividades
- UI responsiva optimizada para escritorio y móvil

## GitHub Actions

El workflow `deploy.yml` (ver `.github/workflows/deploy.yml`) instala dependencias, ejecuta pruebas básicas (`npm run lint`) y compila la app para garantizar que cada commit en `main` quede listo para despliegue.
