# Planificador Integral de Itinerarios

Una aplicación completa de Next.js para planificar viajes con persistencia automática en localStorage como respaldo.

## 🚀 Características

### Funcionalidad Principal
- ✈️ **Gestión de Itinerarios**: Crea, edita, elimina y duplica itinerarios de viaje
- 📅 **Actividades con Franjas de Color**: Agrega actividades detalladas con códigos de color
- 🔍 **Búsqueda y Filtros**: Filtra por texto, fecha, estado y prioridad
- 📊 **Panel de Resumen**: Visualiza estadísticas de tus viajes
- 🎨 **Personalización**: Asigna colores personalizados a cada itinerario
- 🏷️ **Etiquetas**: Organiza con etiquetas personalizadas

### 💾 **Sistema de Respaldo con localStorage**

La aplicación ahora incluye un sistema completo de respaldo con localStorage que garantiza que **nunca pierdas tus datos**, incluso cuando:
- La base de datos SQLite falla
- No hay conexión al servidor
- Ocurren errores en las APIs

#### Cómo Funciona

1. **Auto-guardado**: Todos los cambios se guardan automáticamente en localStorage
2. **Fallback inteligente**: Si la API falla, la operación se realiza localmente
3. **Carga desde localStorage**: Si la base de datos no está disponible, carga los datos guardados localmente
4. **Indicador visual**: Muestra un banner amarillo cuando estás trabajando en modo sin conexión
5. **IDs temporales**: Genera IDs temporales para nuevos elementos hasta que se sincronicen con el servidor

#### Operaciones Soportadas con localStorage

Todas las operaciones principales funcionan con localStorage como respaldo:

✅ **Crear itinerario** - Guarda con ID temporal si la API falla  
✅ **Editar itinerario** - Actualiza localmente si no hay conexión  
✅ **Eliminar itinerario** - Elimina de localStorage automáticamente  
✅ **Duplicar itinerario** - Crea copia local con nuevos IDs  
✅ **Agregar actividad** - Añade actividades localmente  
✅ **Editar actividad** - Actualiza estado y datos  
✅ **Eliminar actividad** - Elimina de localStorage  
✅ **Importar/Exportar JSON** - Funciona con datos locales  

#### Ventajas

- 🛡️ **Protección de datos**: Nunca pierdas tu trabajo
- 🌐 **Funciona offline**: Continúa trabajando sin conexión
- ⚡ **Instantáneo**: Operaciones locales son ultra rápidas
- 🔄 **Sincronización transparente**: Se sincroniza automáticamente cuando la conexión se restaura
- 📱 **Persistencia del navegador**: Los datos permanecen entre sesiones

## 🛠️ Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Prisma** - ORM para base de datos
- **SQLite** - Base de datos embebida
- **date-fns** - Manipulación de fechas
- **localStorage API** - Sistema de respaldo

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar migraciones
npx prisma migrate deploy

# Generar cliente de Prisma
npx prisma generate

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar producción
npm start
```

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas de localStorage específicamente
npm test -- localStorage.test.ts
```

## 📁 Estructura del Proyecto

```
/workspace
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes
│   │   └── itinerarios/        # Endpoints de itinerarios
│   ├── page.tsx                # Página principal
│   └── layout.tsx              # Layout raíz
├── components/                  # Componentes React
│   └── ItinerarioDashboard.tsx # Componente principal
├── lib/                        # Utilidades
│   ├── localStorage.ts         # 💾 Sistema de respaldo
│   ├── prisma.ts              # Cliente Prisma
│   ├── serializers.ts         # Serialización de datos
│   └── validators.ts          # Validación con Zod
├── types/                      # Tipos TypeScript
│   └── itinerario.ts          # Tipos principales
├── prisma/                     # Prisma ORM
│   ├── schema.prisma          # Esquema de BD
│   └── migrations/            # Migraciones
└── __tests__/                 # Tests
    ├── api/                   # Tests de API
    └── lib/                   # Tests de utilidades
```

## 🔧 API

### Endpoints Principales

- `GET /api/itinerarios` - Lista todos los itinerarios
- `POST /api/itinerarios` - Crea un nuevo itinerario
- `PUT /api/itinerarios/[id]` - Actualiza un itinerario
- `DELETE /api/itinerarios/[id]` - Elimina un itinerario
- `POST /api/itinerarios/[id]/duplicar` - Duplica un itinerario
- `POST /api/itinerarios/[id]/actividades` - Agrega actividad
- `PATCH /api/itinerarios/[id]/actividades/[actividadId]` - Actualiza actividad
- `DELETE /api/itinerarios/[id]/actividades/[actividadId]` - Elimina actividad

## 💡 Uso del Sistema localStorage

### Funciones Disponibles

```typescript
import {
  saveToLocalStorage,      // Guardar itinerarios
  loadFromLocalStorage,    // Cargar itinerarios
  getLastSyncTime,         // Obtener última sincronización
  clearLocalStorage,       // Limpiar storage
  generateTempId,          // Generar ID temporal
  isTempId,               // Verificar si es ID temporal
} from "@/lib/localStorage";
```

### Ejemplo de Uso

```typescript
// El componente automáticamente maneja localStorage
// No necesitas hacer nada especial, solo usa la app normalmente

// Si la API falla, verás un banner que dice:
// "⚠️ Modo sin conexión - Los datos se guardan solo en localStorage"

// Todas tus operaciones seguirán funcionando normalmente
```

## 🎨 Características de UI

- **Diseño Responsivo**: Funciona en todos los dispositivos
- **Modo Sin Conexión**: Banner visual cuando estás offline
- **Paleta de Colores**: Personaliza cada itinerario
- **Filtros Avanzados**: Busca por múltiples criterios
- **Estados Visuales**: Iconos y colores para estados
- **Mensajes de Confirmación**: Feedback instantáneo

## 📊 Base de Datos

### Modelos

**Itinerario**
- ID único
- Nombre, destino, fechas
- Presupuesto, transporte, hospedaje
- Etiquetas, prioridad, estado
- Color personalizado
- Relación con actividades

**Actividad**
- ID único
- Título, descripción, ubicación
- Inicio y fin (datetime)
- Color, estado, completado
- Relación con itinerario

## 🚨 Manejo de Errores

La aplicación incluye manejo robusto de errores:

1. **Errores de API**: Fallback automático a localStorage
2. **Errores de Base de Datos**: Carga desde localStorage
3. **Errores de Validación**: Mensajes claros al usuario
4. **Errores de Red**: Modo offline automático

## 🔐 Seguridad

- ✅ Validación con Zod
- ✅ Sanitización de datos
- ✅ Protección contra inyección
- ✅ Manejo seguro de errores
- ✅ Datos locales en navegador del usuario

## 🌟 Mejoras Futuras

- [ ] Sincronización automática con servidor
- [ ] Detección de conflictos
- [ ] Modo offline completo con Service Worker
- [ ] Exportar a PDF
- [ ] Compartir itinerarios
- [ ] Integración con mapas
- [ ] Recordatorios y notificaciones

## 📝 Licencia

Este proyecto es de código abierto.

## 👨‍💻 Desarrollo

```bash
# Desarrollo con hot reload
npm run dev

# Verificar tipos
npm run type-check

# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

## 🐛 Debugging

Si encuentras problemas:

1. **Verifica la consola del navegador** para errores
2. **Abre DevTools → Application → Local Storage** para ver datos guardados
3. **Ejecuta los tests** con `npm test`
4. **Limpia localStorage** usando el botón "Limpiar base de datos"
5. **Refresca la página** para recargar desde el servidor

## 📞 Soporte

Para reportar bugs o solicitar características, abre un issue en el repositorio.

---

**¡Disfruta planificando tus viajes! ✈️🌍**
