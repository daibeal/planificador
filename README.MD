# 🗺️ Planificador Integral de Itinerarios

Una aplicación web moderna y completa para gestionar tus viajes, actividades y franjas de color temporal. Construida con Next.js 14, Prisma, SQLite y TypeScript.

## ✨ Características Principales

### 🎨 Interfaz Mejorada con Colores Vibrantes
- **Paleta de colores extensa**: Gradientes y colores vibrantes en toda la aplicación
- **Animaciones suaves**: Transiciones y efectos visuales mejorados
- **Diseño responsivo**: Funciona perfectamente en dispositivos móviles y desktop
- **Estados visuales**: Indicadores claros para cada estado de itinerario y actividad

### 📋 Gestión Completa de Itinerarios
- ✅ Crear, editar y eliminar itinerarios
- ✅ Duplicar itinerarios existentes
- ✅ Filtros avanzados (texto, fecha, estado, prioridad)
- ✅ Ordenamiento múltiple (fecha, presupuesto, creación)
- ✅ Etiquetas personalizadas
- ✅ Colores temáticos por itinerario

### 📅 Sistema de Actividades
- ✅ Agregar actividades con franjas de color
- ✅ Fechas de inicio y fin para cada actividad
- ✅ Ubicaciones y descripciones detalladas
- ✅ Estados de actividad (pendiente, confirmado, completado, cancelado)
- ✅ Marcado de actividades como completadas

### 💾 Persistencia de Datos
- ✅ Base de datos SQLite con Prisma ORM
- ✅ Exportación e importación de datos en formato JSON
- ✅ Validación robusta con Zod
- ✅ Serialización segura de datos

### 🧪 Testing Integrado
- ✅ Tests unitarios para validadores
- ✅ Tests para serializadores
- ✅ Tests para APIs
- ✅ Cobertura de código configurada

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+ 
- npm o yarn

### Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd planificador-itinerarios-next
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar la base de datos**
```bash
npx prisma migrate dev
npx prisma generate
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## 📦 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm test` - Ejecuta los tests
- `npm run test:watch` - Ejecuta tests en modo watch
- `npm run test:coverage` - Genera reporte de cobertura

## 🏗️ Estructura del Proyecto

```
/
├── app/                    # Rutas y páginas de Next.js
│   ├── api/               # Endpoints de API
│   │   └── itinerarios/  # Rutas de itinerarios y actividades
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   └── ItinerarioDashboard.tsx
├── lib/                   # Utilidades y helpers
│   ├── prisma.ts         # Cliente de Prisma
│   ├── serializers.ts    # Serialización de datos
│   └── validators.ts     # Validación con Zod
├── prisma/                # Esquema y migraciones
│   ├── schema.prisma     # Esquema de base de datos
│   └── migrations/       # Migraciones de Prisma
├── types/                 # Tipos TypeScript
│   └── itinerario.ts
└── __tests__/            # Tests
    ├── api/              # Tests de API
    └── lib/              # Tests de utilidades
```

## 🎯 Funcionalidades Detalladas

### Crear un Itinerario
1. Completa el formulario en la parte superior
2. Ingresa nombre, destino, fechas, presupuesto
3. Selecciona transporte, hospedaje y prioridad
4. Elige un color temático
5. Agrega etiquetas separadas por comas
6. Haz clic en "Guardar nuevo itinerario"

### Agregar Actividades
1. Desplázate hasta el itinerario deseado
2. Completa el formulario de actividad
3. Ingresa título, descripción, ubicación
4. Selecciona fechas de inicio y fin
5. Elige un color para la franja
6. Haz clic en "Agregar nueva actividad"

### Filtrar Itinerarios
- **Búsqueda rápida**: Busca en nombre, destino, hospedaje, transporte, notas y etiquetas
- **Filtro por fecha**: Muestra solo itinerarios que inician después de una fecha
- **Filtro por estado**: Planificado, En curso, Finalizado, Archivado
- **Filtro por prioridad**: Alta, Media, Baja
- **Ordenamiento**: Por fecha (ascendente/descendente), presupuesto, o fecha de creación

### Exportar e Importar
- **Exportar**: Descarga todos tus itinerarios como archivo JSON
- **Importar**: Carga itinerarios desde un archivo JSON
- **Limpiar**: Elimina todos los itinerarios (¡cuidado!)

## 🎨 Paleta de Colores

La aplicación utiliza una paleta de colores vibrante y moderna:

- **Primario**: Azul (#2563eb) - Acciones principales
- **Secundario**: Turquesa (#14b8a6) - Acciones secundarias
- **Terciario**: Púrpura (#8b5cf6) - Elementos destacados
- **Cuaternario**: Rosa (#ec4899) - Acentos
- **Éxito**: Verde (#10b981) - Estados positivos
- **Peligro**: Rojo (#dc2626) - Advertencias
- **Advertencia**: Amarillo (#f59e0b) - Alertas

## 🧪 Testing

Los tests están organizados por módulo:

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

### Estructura de Tests
- `__tests__/lib/validators.test.ts` - Validación de datos
- `__tests__/lib/serializers.test.ts` - Serialización
- `__tests__/api/itinerarios.test.ts` - Endpoints de API

## 🔧 Tecnologías Utilizadas

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Prisma** - ORM para base de datos
- **SQLite** - Base de datos ligera
- **Zod** - Validación de esquemas
- **date-fns** - Manipulación de fechas
- **Jest** - Framework de testing
- **React Testing Library** - Testing de componentes

## 📝 Notas de Desarrollo

- Todos los textos están en español
- La aplicación es completamente responsive
- Los datos se validan tanto en cliente como en servidor
- Las migraciones de Prisma se ejecutan automáticamente en build

## 🚢 Despliegue

La aplicación está lista para desplegarse en plataformas como:
- Vercel (recomendado para Next.js)
- Netlify
- Railway
- Cualquier plataforma que soporte Node.js

> **Importante:** Este proyecto utiliza Prisma y rutas dinámicas del App Router, por lo que no es compatible con despliegues estáticos (GitHub Pages / `next export`). Usa un proveedor con entorno Node.js.

### Variables de Entorno
No se requieren variables de entorno adicionales para desarrollo local. SQLite se inicializa automáticamente.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

**Desarrollado con ❤️ usando Next.js y TypeScript**
