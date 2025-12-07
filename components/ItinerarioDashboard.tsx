"use client";

import { useMemo, useState, useTransition, FormEvent, useEffect } from "react";
import clsx from "clsx";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import type {
  Actividad,
  ActividadPayload,
  FiltrosItinerario,
  Itinerario,
  ItinerarioPayload,
} from "@/types/itinerario";
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  generateTempId,
  isTempId,
} from "@/lib/localStorage";

interface Props {
  initialItinerarios: Itinerario[];
}

const formBase: Omit<ItinerarioPayload, "etiquetas"> & { etiquetas: string } = {
  nombre: "",
  destino: "",
  fechaInicio: "",
  fechaFin: "",
  presupuesto: 0,
  transporte: "Avión",
  hospedaje: "",
  notas: "",
  etiquetas: "",
  prioridad: "media",
  estadoManual: "planificado",
  colorTema: "#2563eb",
};

const filtrosBase: FiltrosItinerario = {
  texto: "",
  fecha: "",
  estado: "todos",
  prioridad: "todas",
  orden: "fechaAsc",
};

const estadosLegibles: Record<string, string> = {
  planificado: "Planificado",
  enCurso: "En curso",
  finalizado: "Finalizado",
  archivado: "Archivado",
};

const prioridadesLegibles: Record<string, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

function formatearFecha(iso: string) {
  try {
    return format(parseISO(iso), "PPP", { locale: es });
  } catch (error) {
    return iso;
  }
}

export default function ItinerarioDashboard({ initialItinerarios }: Props) {
  const [itinerarios, setItinerarios] = useState<Itinerario[]>(initialItinerarios);
  const [formulario, setFormulario] = useState(formBase);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "info" | "error"; texto: string } | null>(
    null
  );
  const [filtros, setFiltros] = useState<FiltrosItinerario>(filtrosBase);
  const [isPending, startTransition] = useTransition();
  const [enviando, setEnviando] = useState(false);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);

  // Load from localStorage on mount if no initial data
  useEffect(() => {
    if (initialItinerarios.length === 0) {
      const localData = loadFromLocalStorage();
      if (localData && localData.length > 0) {
        setItinerarios(localData);
        setUsingLocalStorage(true);
        mostrarMensaje("Datos cargados desde localStorage (sin conexión al servidor)", "info");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage whenever itinerarios change
  useEffect(() => {
    if (itinerarios.length > 0) {
      saveToLocalStorage(itinerarios);
    }
  }, [itinerarios]);

  const listaFiltrada = useMemo(() => {
    return itinerarios
      .filter((it) =>
        filtros.texto
          ? `${it.nombre} ${it.destino} ${it.hospedaje} ${it.transporte} ${it.notas} ${it.etiquetas.join(
              " "
            )}`
              .toLowerCase()
              .includes(filtros.texto.toLowerCase())
          : true
      )
      .filter((it) =>
        filtros.fecha ? parseISO(it.fechaInicio) >= parseISO(filtros.fecha) : true
      )
      .filter((it) =>
        filtros.estado === "todos" ? true : it.estadoManual === filtros.estado
      )
      .filter((it) =>
        filtros.prioridad === "todas" ? true : it.prioridad === filtros.prioridad
      )
      .sort((a, b) => ordenarItinerarios(a, b, filtros.orden));
  }, [itinerarios, filtros]);

  const resumen = useMemo(() => {
    const hoy = new Date();
    const enTreintaDias = addDays(hoy, 30);
    const proximos = itinerarios.filter((it) => {
      const inicio = parseISO(it.fechaInicio);
      return isWithinInterval(inicio, { start: hoy, end: enTreintaDias });
    }).length;
    const presupuesto = itinerarios.reduce(
      (acc, it) => acc + (Number(it.presupuesto) || 0),
      0
    );
    const paletas = new Set<string>();
    itinerarios.forEach((it) => {
      it.actividades.forEach((act) => act.color && paletas.add(act.color));
    });

    return {
      total: itinerarios.length,
      proximos,
      presupuesto,
      paletas: paletas.size,
    };
  }, [itinerarios]);

  function mostrarMensaje(texto: string, tipo: "info" | "error" = "info") {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 5000);
  }

  function limpiarFormulario() {
    setFormulario(formBase);
    setEditandoId(null);
  }

  function manejarCambio(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  }

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    try {
      const etiquetas = formulario.etiquetas
        .split(",")
        .map((etiqueta) => etiqueta.trim())
        .filter(Boolean);
      const payload: ItinerarioPayload = {
        nombre: formulario.nombre,
        destino: formulario.destino,
        fechaInicio: formulario.fechaInicio,
        fechaFin: formulario.fechaFin,
        presupuesto: Number(formulario.presupuesto) || 0,
        transporte: formulario.transporte ?? "Avión",
        hospedaje: formulario.hospedaje,
        notas: formulario.notas,
        etiquetas,
        prioridad: formulario.prioridad as ItinerarioPayload["prioridad"],
        estadoManual: formulario.estadoManual as ItinerarioPayload["estadoManual"],
        colorTema: formulario.colorTema,
      };

      let actualizado: Itinerario;
      
      try {
        const url = editandoId ? `/api/itinerarios/${editandoId}` : "/api/itinerarios";
        const metodo = editandoId ? "PUT" : "POST";
        const respuesta = await fetch(url, {
          method: metodo,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!respuesta.ok) {
          throw new Error("No se pudo guardar el itinerario");
        }

        actualizado = await respuesta.json();
        setUsingLocalStorage(false);
      } catch (apiError) {
        // Fallback to localStorage if API fails
        console.error("API failed, using localStorage:", apiError);
        
        if (editandoId) {
          // Update existing
          const existing = itinerarios.find(it => it.id === editandoId);
          if (!existing) throw new Error("Itinerario no encontrado");
          
          actualizado = {
            ...existing,
            ...payload,
            actualizadoEn: new Date().toISOString(),
          };
        } else {
          // Create new with temporary ID
          actualizado = {
            id: generateTempId(),
            ...payload,
            actividades: [],
            creadoEn: new Date().toISOString(),
            actualizadoEn: new Date().toISOString(),
          };
        }
        
        setUsingLocalStorage(true);
        mostrarMensaje(
          editandoId 
            ? "Itinerario actualizado en localStorage (sin conexión)" 
            : "Itinerario guardado en localStorage (sin conexión)",
          "info"
        );
      }

      startTransition(() => {
        setItinerarios((prev) => {
          if (editandoId) {
            return prev.map((it) => (it.id === actualizado.id ? actualizado : it));
          }
          return [actualizado, ...prev];
        });
      });
      
      if (!usingLocalStorage) {
        mostrarMensaje(editandoId ? "Itinerario actualizado." : "Itinerario guardado.");
      }
      
      limpiarFormulario();
    } catch (error) {
      mostrarMensaje("Ocurrió un error al guardar.", "error");
    } finally {
      setEnviando(false);
    }
  }

  function iniciarEdicion(itinerario: Itinerario) {
    setEditandoId(itinerario.id);
    setFormulario({
      nombre: itinerario.nombre,
      destino: itinerario.destino,
      fechaInicio: itinerario.fechaInicio.slice(0, 10),
      fechaFin: itinerario.fechaFin.slice(0, 10),
      presupuesto: itinerario.presupuesto ?? 0,
      transporte: itinerario.transporte ?? "Avión",
      hospedaje: itinerario.hospedaje ?? "",
      notas: itinerario.notas ?? "",
      etiquetas: itinerario.etiquetas.join(", "),
      prioridad: itinerario.prioridad,
      estadoManual: itinerario.estadoManual,
      colorTema: itinerario.colorTema,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminarItinerario(id: string) {
    const confirmar = window.confirm("¿Eliminar definitivamente este itinerario?");
    if (!confirmar) return;
    
    try {
      const respuesta = await fetch(`/api/itinerarios/${id}`, { method: "DELETE" });
      if (!respuesta.ok && !isTempId(id)) {
        throw new Error("API failed");
      }
      setUsingLocalStorage(false);
    } catch (error) {
      // If API fails but it's a temp ID or we're already using localStorage, proceed locally
      if (!isTempId(id)) {
        console.error("API failed, deleting from localStorage:", error);
        setUsingLocalStorage(true);
        mostrarMensaje("Itinerario eliminado de localStorage (sin conexión)", "info");
      }
    }
    
    startTransition(() => {
      setItinerarios((prev) => prev.filter((it) => it.id !== id));
    });
    
    if (!usingLocalStorage && !isTempId(id)) {
      mostrarMensaje("Itinerario eliminado.");
    }
  }

  async function duplicarItinerario(id: string) {
    const original = itinerarios.find(it => it.id === id);
    if (!original) {
      mostrarMensaje("No se pudo encontrar el itinerario.", "error");
      return;
    }
    
    let nuevo: Itinerario;
    
    try {
      if (isTempId(id)) {
        throw new Error("Cannot duplicate temp ID via API");
      }
      
      const respuesta = await fetch(`/api/itinerarios/${id}/duplicar`, { method: "POST" });
      if (!respuesta.ok) {
        throw new Error("API failed");
      }
      nuevo = await respuesta.json();
      setUsingLocalStorage(false);
    } catch (error) {
      // Fallback to localStorage
      console.error("API failed, duplicating in localStorage:", error);
      
      nuevo = {
        ...original,
        id: generateTempId(),
        nombre: `${original.nombre} (copia)`,
        actividades: original.actividades.map(act => ({
          ...act,
          id: generateTempId(),
          itinerarioId: "",
        })),
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      };
      nuevo.actividades = nuevo.actividades.map(act => ({
        ...act,
        itinerarioId: nuevo.id,
      }));
      
      setUsingLocalStorage(true);
      mostrarMensaje("Itinerario duplicado en localStorage (sin conexión)", "info");
    }
    
    startTransition(() => {
      setItinerarios((prev) => [nuevo, ...prev]);
    });
    
    if (!usingLocalStorage) {
      mostrarMensaje("Itinerario duplicado.");
    }
  }

  async function manejarActividadSubmit(event: FormEvent<HTMLFormElement>, itinerarioId: string) {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const payload: ActividadPayload = {
      titulo: String(datos.get("titulo") ?? ""),
      descripcion: String(datos.get("descripcion") ?? ""),
      ubicacion: String(datos.get("ubicacion") ?? ""),
      inicio: normalizarDateTime(datos.get("inicio")),
      fin: normalizarDateTime(datos.get("fin")),
      color: (datos.get("color") as string) || "#14b8a6",
      estado: (datos.get("estado") as Actividad["estado"]) ?? "pendiente",
    };

    if (!payload.titulo.trim()) {
      mostrarMensaje("La actividad necesita un título.", "error");
      return;
    }

    let actualizado: Itinerario;
    
    try {
      if (isTempId(itinerarioId)) {
        throw new Error("Cannot add activity to temp ID via API");
      }
      
      const respuesta = await fetch(`/api/itinerarios/${itinerarioId}/actividades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!respuesta.ok) {
        throw new Error("API failed");
      }

      actualizado = await respuesta.json();
      setUsingLocalStorage(false);
    } catch (error) {
      // Fallback to localStorage
      console.error("API failed, adding activity to localStorage:", error);
      
      const itinerario = itinerarios.find(it => it.id === itinerarioId);
      if (!itinerario) {
        mostrarMensaje("No se pudo encontrar el itinerario.", "error");
        return;
      }
      
      const nuevaActividad: Actividad = {
        id: generateTempId(),
        itinerarioId: itinerarioId,
        titulo: payload.titulo,
        descripcion: payload.descripcion || null,
        ubicacion: payload.ubicacion || null,
        inicio: payload.inicio || null,
        fin: payload.fin || null,
        color: payload.color || "#14b8a6",
        estado: payload.estado || "pendiente",
        completado: false,
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      };
      
      actualizado = {
        ...itinerario,
        actividades: [...itinerario.actividades, nuevaActividad],
        actualizadoEn: new Date().toISOString(),
      };
      
      setUsingLocalStorage(true);
      mostrarMensaje("Actividad registrada en localStorage (sin conexión)", "info");
    }

    event.currentTarget.reset();
    startTransition(() => {
      setItinerarios((prev) => prev.map((it) => (it.id === actualizado.id ? actualizado : it)));
    });
    
    if (!usingLocalStorage) {
      mostrarMensaje("Actividad registrada.");
    }
  }

  async function toggleActividad(
    itinerarioId: string,
    actividadId: string,
    estadoActual: boolean
  ) {
    let actualizado: Itinerario;
    
    try {
      if (isTempId(itinerarioId) || isTempId(actividadId)) {
        throw new Error("Cannot update temp ID via API");
      }
      
      const respuesta = await fetch(
        `/api/itinerarios/${itinerarioId}/actividades/${actividadId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completado: !estadoActual }),
        }
      );

      if (!respuesta.ok) {
        throw new Error("API failed");
      }

      actualizado = await respuesta.json();
      setUsingLocalStorage(false);
    } catch (error) {
      // Fallback to localStorage
      console.error("API failed, toggling activity in localStorage:", error);
      
      const itinerario = itinerarios.find(it => it.id === itinerarioId);
      if (!itinerario) {
        mostrarMensaje("No se pudo encontrar el itinerario.", "error");
        return;
      }
      
      actualizado = {
        ...itinerario,
        actividades: itinerario.actividades.map(act =>
          act.id === actividadId
            ? { ...act, completado: !estadoActual, actualizadoEn: new Date().toISOString() }
            : act
        ),
        actualizadoEn: new Date().toISOString(),
      };
      
      setUsingLocalStorage(true);
    }

    startTransition(() => {
      setItinerarios((prev) => prev.map((it) => (it.id === actualizado.id ? actualizado : it)));
    });
  }

  async function eliminarActividad(itinerarioId: string, actividadId: string) {
    let actualizado: Itinerario;
    
    try {
      if (isTempId(itinerarioId) || isTempId(actividadId)) {
        throw new Error("Cannot delete temp ID via API");
      }
      
      const respuesta = await fetch(
        `/api/itinerarios/${itinerarioId}/actividades/${actividadId}`,
        { method: "DELETE" }
      );

      if (!respuesta.ok) {
        throw new Error("API failed");
      }

      actualizado = await respuesta.json();
      setUsingLocalStorage(false);
    } catch (error) {
      // Fallback to localStorage
      console.error("API failed, deleting activity from localStorage:", error);
      
      const itinerario = itinerarios.find(it => it.id === itinerarioId);
      if (!itinerario) {
        mostrarMensaje("No se pudo encontrar el itinerario.", "error");
        return;
      }
      
      actualizado = {
        ...itinerario,
        actividades: itinerario.actividades.filter(act => act.id !== actividadId),
        actualizadoEn: new Date().toISOString(),
      };
      
      setUsingLocalStorage(true);
    }

    startTransition(() => {
      setItinerarios((prev) => prev.map((it) => (it.id === actualizado.id ? actualizado : it)));
    });
  }

  function importarDesdeArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = async (e) => {
      try {
        const contenido = JSON.parse(String(e.target?.result));
        if (!Array.isArray(contenido)) throw new Error();
        
        let allSucceeded = true;
        const nuevosItinerarios: Itinerario[] = [];
        
        for (const item of contenido) {
          try {
            const respuesta = await fetch("/api/itinerarios", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...item,
                etiquetas: item.etiquetas ?? [],
                colorTema: item.colorTema ?? "#2563eb",
              }),
            });
            
            if (respuesta.ok) {
              const nuevo = await respuesta.json();
              nuevosItinerarios.push(nuevo);
            } else {
              throw new Error("API failed");
            }
          } catch (apiError) {
            allSucceeded = false;
            // Add to localStorage with temp ID
            const nuevoLocal: Itinerario = {
              ...item,
              id: generateTempId(),
              etiquetas: item.etiquetas ?? [],
              colorTema: item.colorTema ?? "#2563eb",
              actividades: (item.actividades || []).map((act: any) => ({
                ...act,
                id: generateTempId(),
              })),
              creadoEn: new Date().toISOString(),
              actualizadoEn: new Date().toISOString(),
            };
            nuevosItinerarios.push(nuevoLocal);
          }
        }
        
        setItinerarios((prev) => [...nuevosItinerarios, ...prev]);
        
        if (allSucceeded) {
          mostrarMensaje("Importación completada.");
          setUsingLocalStorage(false);
        } else {
          mostrarMensaje("Importación completada en localStorage (sin conexión)", "info");
          setUsingLocalStorage(true);
        }
      } catch (error) {
        mostrarMensaje("No se pudo importar el archivo.", "error");
      } finally {
        event.target.value = "";
      }
    };
    lector.readAsText(archivo);
  }

  function exportarJSON() {
    const blob = new Blob([JSON.stringify(itinerarios, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `itinerarios-${new Date().toISOString().slice(0, 10)}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  async function limpiarTodo() {
    const confirmar = window.confirm("¿Seguro que deseas vaciar toda la base?");
    if (!confirmar) return;
    
    try {
      // Try to clear from API
      const deletePromises = itinerarios
        .filter(it => !isTempId(it.id))
        .map((it) => fetch(`/api/itinerarios/${it.id}`, { method: "DELETE" }));
      
      await Promise.all(deletePromises);
      setUsingLocalStorage(false);
    } catch (error) {
      console.error("API failed when clearing, will clear localStorage:", error);
    }
    
    setItinerarios([]);
    mostrarMensaje("Se eliminó toda la información.");
  }

  return (
    <>
      <header className="app-header">
        <div>
          <p className="etiqueta">Organiza cada detalle</p>
          <h1>Planificador integral de itinerarios</h1>
          <p>
            Construido con Next.js, Prisma y SQLite para guardar tus viajes, actividades con franjas de
            color y reportes en español.
          </p>
          {usingLocalStorage && (
            <div style={{
              marginTop: "12px",
              padding: "12px 16px",
              background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))",
              border: "2px solid rgba(251, 191, 36, 0.3)",
              borderRadius: "8px",
              color: "#d97706",
              fontWeight: "600",
              fontSize: "0.95rem"
            }}>
              ⚠️ Modo sin conexión - Los datos se guardan solo en localStorage
            </div>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="btn secundario" 
            onClick={exportarJSON}
            title="Descargar todos los itinerarios como archivo JSON"
          >
            💾 Exportar JSON
          </button>
          <button 
            className="btn primario" 
            onClick={() => document.getElementById("archivoImportacion")?.click()}
            title="Importar itinerarios desde un archivo JSON"
          >
            📥 Importar JSON
          </button>
          <button 
            className="btn peligro" 
            onClick={limpiarTodo}
            title="⚠️ Eliminar TODOS los itinerarios permanentemente"
          >
            🗑️ Limpiar base de datos
          </button>
          <input
            id="archivoImportacion"
            type="file"
            hidden
            accept="application/json"
            onChange={importarDesdeArchivo}
          />
        </div>
      </header>

      {mensaje && (
        <div className={clsx("alerta", mensaje.tipo === "error" && "error", mensaje.tipo === "info" && "exito")}>
          {mensaje.texto}
        </div>
      )}

      <section className="panel" id="panel-formulario">
        <div className="panel-header">
          <h2>{editandoId ? "Editar itinerario" : "Nuevo itinerario"}</h2>
          <p>{editandoId ? "Estás actualizando un viaje existente." : "Completa los campos y guarda."}</p>
        </div>
        <form className="grid-formulario" onSubmit={manejarSubmit}>
          <label>
            Nombre del viaje
            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              required
              placeholder="Ej. Ruta gastronómica por Oaxaca"
            />
          </label>
          <label>
            Destino principal
            <input
              type="text"
              name="destino"
              value={formulario.destino}
              onChange={manejarCambio}
              required
            />
          </label>
          <label>
            Fecha de inicio
            <input
              type="date"
              name="fechaInicio"
              value={formulario.fechaInicio}
              onChange={manejarCambio}
              required
            />
          </label>
          <label>
            Fecha de regreso
            <input
              type="date"
              name="fechaFin"
              value={formulario.fechaFin}
              onChange={manejarCambio}
              required
            />
          </label>
          <label>
            Presupuesto estimado (USD)
            <input
              type="number"
              name="presupuesto"
              min="0"
              step="50"
              value={formulario.presupuesto ?? ""}
              onChange={manejarCambio}
            />
          </label>
          <label>
            Medio de transporte
            <select
              name="transporte"
              value={formulario.transporte ?? ""}
              onChange={manejarCambio}
            >
              <option value="Avión">Avión</option>
              <option value="Tren">Tren</option>
              <option value="Auto">Auto</option>
              <option value="Autobús">Autobús</option>
              <option value="Barco">Barco</option>
            </select>
          </label>
          <label>
            Hospedaje
            <input
              type="text"
              name="hospedaje"
              value={formulario.hospedaje ?? ""}
              onChange={manejarCambio}
              placeholder="Hotel, Airbnb, hostal"
            />
          </label>
          <label>
            Prioridad
            <select name="prioridad" value={formulario.prioridad} onChange={manejarCambio}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </label>
          <label>
            Estado manual
            <select name="estadoManual" value={formulario.estadoManual} onChange={manejarCambio}>
              <option value="planificado">Planificado</option>
              <option value="enCurso">En curso</option>
              <option value="finalizado">Finalizado</option>
              <option value="archivado">Archivado</option>
            </select>
          </label>
          <label>
            Color del itinerario
            <input type="color" name="colorTema" value={formulario.colorTema} onChange={manejarCambio} />
          </label>
          <label>
            Etiquetas (separadas por coma)
            <input
              type="text"
              name="etiquetas"
              value={formulario.etiquetas}
              onChange={manejarCambio}
              placeholder="familia, trabajo, playa"
            />
          </label>
          <label>
            Notas generales
            <textarea
              name="notas"
              rows={4}
              value={formulario.notas ?? ""}
              onChange={manejarCambio}
              placeholder="Contactos, recordatorios, seguros..."
            />
          </label>
          <div className="form-acciones">
            <button type="button" className="btn secundario" onClick={limpiarFormulario}>
              Cancelar
            </button>
            <button type="submit" className="btn primario" disabled={enviando || isPending}>
              {enviando ? (
                <>
                  <span className="loading" style={{ marginRight: "8px", display: "inline-block" }}></span>
                  Guardando...
                </>
              ) : editandoId ? (
                "Actualizar itinerario"
              ) : (
                "Guardar nuevo itinerario"
              )}
            </button>
          </div>
        </form>
      </section>

      <section className="panel" id="panel-filtros">
        <div className="panel-header">
          <h2>Explorar itinerarios</h2>
          <p>Filtra por texto, fecha, prioridad o estado.</p>
        </div>
        <div className="grid-filtros">
          <label>
            Búsqueda rápida
            <input
              type="search"
              value={filtros.texto}
              onChange={(e) => setFiltros((prev) => ({ ...prev, texto: e.target.value }))}
              placeholder="Destino, etiqueta, hospedaje..."
            />
          </label>
          <label>
            Salida a partir de
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => setFiltros((prev) => ({ ...prev, fecha: e.target.value }))}
            />
          </label>
          <label>
            Estado
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value as FiltrosItinerario["estado"] }))}
            >
              <option value="todos">Todos</option>
              <option value="planificado">Planificado</option>
              <option value="enCurso">En curso</option>
              <option value="finalizado">Finalizado</option>
              <option value="archivado">Archivado</option>
            </select>
          </label>
          <label>
            Prioridad
            <select
              value={filtros.prioridad}
              onChange={(e) => setFiltros((prev) => ({ ...prev, prioridad: e.target.value as FiltrosItinerario["prioridad"] }))}
            >
              <option value="todas">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </label>
          <label>
            Ordenar por
            <select
              value={filtros.orden}
              onChange={(e) => setFiltros((prev) => ({ ...prev, orden: e.target.value as FiltrosItinerario["orden"] }))}
            >
              <option value="fechaAsc">Fecha más cercana</option>
              <option value="fechaDesc">Fecha más lejana</option>
              <option value="presupuesto">Presupuesto</option>
              <option value="creacion">Recientes</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel" id="panel-resumen">
        <div className="panel-header">
          <h2>Resumen rápido</h2>
        </div>
        <div className="resumen-grid">
          <article>
            <p className="etiqueta">📊 Total de itinerarios</p>
            <strong>{resumen.total}</strong>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              {resumen.total === 0 
                ? "Aún no hay itinerarios creados" 
                : resumen.total === 1 
                ? "Itinerario guardado" 
                : "Itinerarios guardados"}
            </span>
          </article>
          <article>
            <p className="etiqueta">⏰ Próximos 30 días</p>
            <strong>{resumen.proximos}</strong>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              {resumen.proximos === 0 
                ? "No hay viajes próximos" 
                : resumen.proximos === 1 
                ? "Viaje que inicia pronto" 
                : "Viajes que inician pronto"}
            </span>
          </article>
          <article>
            <p className="etiqueta">💰 Presupuesto total</p>
            <strong>${resumen.presupuesto.toLocaleString()}</strong>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              {resumen.presupuesto === 0 
                ? "Sin presupuesto definido" 
                : "USD considerados en total"}
            </span>
          </article>
          <article>
            <p className="etiqueta">🎨 Paletas de colores</p>
            <strong>{resumen.paletas}</strong>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              {resumen.paletas === 0 
                ? "Sin colores asignados" 
                : resumen.paletas === 1 
                ? "Color único en uso" 
                : "Colores diferentes usados"}
            </span>
          </article>
        </div>
      </section>

      <section className="panel" id="panel-itinerarios">
        <div className="panel-header lista-header">
          <div>
            <h2>Mis itinerarios</h2>
            <p id="contadorItinerarios">
              {listaFiltrada.length} {listaFiltrada.length === 1 ? "resultado" : "resultados"}
            </p>
          </div>
        </div>
        <div className={clsx("lista-itinerarios", !listaFiltrada.length && "vacio")}>
          {!listaFiltrada.length ? (
            <div style={{ 
              textAlign: "center", 
              padding: "48px 24px",
              color: "var(--muted)"
            }}>
              <p style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                🔍 No se encontraron resultados
              </p>
              <p style={{ fontSize: "0.95rem" }}>
                {itinerarios.length === 0 
                  ? "Comienza creando tu primer itinerario arriba." 
                  : "Intenta ajustar los filtros para ver más resultados."}
              </p>
            </div>
          ) : (
            listaFiltrada.map((itinerario) => (
              <article
                key={itinerario.id}
                className="itinerario"
                style={{ borderColor: itinerario.colorTema }}
              >
                <header>
                  <div>
                    <h3>{itinerario.nombre}</h3>
                    <p>
                      {itinerario.destino} · {formatearFecha(itinerario.fechaInicio)} →{" "}
                      {formatearFecha(itinerario.fechaFin)}
                    </p>
                  </div>
                  <div className="acciones">
                    <span
                      className={clsx(
                        "chip",
                        `prioridad-${itinerario.prioridad}`.toLowerCase().replace(" ", "")
                      )}
                    >
                      Prioridad {prioridadesLegibles[itinerario.prioridad]}
                    </span>
                    <span className="chip">
                      {estadosLegibles[itinerario.estadoManual]} · {estadoTemporal(itinerario)}
                    </span>
                    <button 
                      className="btn texto" 
                      onClick={() => duplicarItinerario(itinerario.id)}
                      title="Crear una copia de este itinerario"
                    >
                      📋 Duplicar
                    </button>
                    <button 
                      className="btn texto" 
                      onClick={() => iniciarEdicion(itinerario)}
                      title="Modificar este itinerario"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn texto peligro"
                      onClick={() => eliminarItinerario(itinerario.id)}
                      title="Eliminar permanentemente este itinerario"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </header>

                <div className="detalles">
                  <p style={{ 
                    padding: "12px",
                    background: "linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(139, 92, 246, 0.05))",
                    borderRadius: "10px",
                    border: "1px solid rgba(37, 99, 235, 0.1)"
                  }}>
                    <strong>⏱️ Duración:</strong>{" "}
                    {differenceInCalendarDays(
                      parseISO(itinerario.fechaFin),
                      parseISO(itinerario.fechaInicio)
                    ) + 1}{" "}
                    {differenceInCalendarDays(
                      parseISO(itinerario.fechaFin),
                      parseISO(itinerario.fechaInicio)
                    ) + 1 === 1 ? "día" : "días"}
                  </p>
                  <p style={{ 
                    padding: "12px",
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(34, 197, 94, 0.05))",
                    borderRadius: "10px",
                    border: "1px solid rgba(16, 185, 129, 0.1)"
                  }}>
                    <strong>💰 Presupuesto:</strong> $
                    {(itinerario.presupuesto ?? 0).toLocaleString()}
                    {itinerario.presupuesto && itinerario.presupuesto > 0 && (
                      <span style={{ 
                        display: "block",
                        fontSize: "0.85rem",
                        color: "var(--muted)",
                        marginTop: "4px"
                      }}>
                        ~${Math.round((itinerario.presupuesto ?? 0) / (differenceInCalendarDays(
                          parseISO(itinerario.fechaFin),
                          parseISO(itinerario.fechaInicio)
                        ) + 1))} por día
                      </span>
                    )}
                  </p>
                  <p style={{ 
                    padding: "12px",
                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05))",
                    borderRadius: "10px",
                    border: "1px solid rgba(139, 92, 246, 0.1)"
                  }}>
                    <strong>✈️ Transporte:</strong> {itinerario.transporte || "Sin definir"}
                  </p>
                  <p style={{ 
                    padding: "12px",
                    background: "linear-gradient(135deg, rgba(20, 184, 166, 0.05), rgba(14, 165, 233, 0.05))",
                    borderRadius: "10px",
                    border: "1px solid rgba(20, 184, 166, 0.1)"
                  }}>
                    <strong>🏨 Hospedaje:</strong> {itinerario.hospedaje || "Pendiente"}
                  </p>
                </div>

                <div className="indicador-color" style={{ 
                  color: itinerario.colorTema,
                  padding: "12px 16px",
                  background: `linear-gradient(135deg, ${itinerario.colorTema}15, ${itinerario.colorTema}25)`,
                  borderRadius: "12px",
                  border: `2px solid ${itinerario.colorTema}30`
                }}>
                  <span style={{ 
                    backgroundColor: itinerario.colorTema,
                    width: "32px",
                    height: "12px",
                    boxShadow: `0 2px 8px ${itinerario.colorTema}50`
                  }} />
                  🎨 Paleta principal para franjas temporales: {itinerario.colorTema}
                </div>

                {itinerario.etiquetas.length > 0 && (
                  <div className="etiquetas">
                    {itinerario.etiquetas.map((etiqueta) => (
                      <span key={etiqueta}>{etiqueta}</span>
                    ))}
                  </div>
                )}

                {itinerario.notas && <p>{itinerario.notas}</p>}

                <section className="actividades">
                  <div className="actividades-header">
                    <h4>📅 Agenda y franjas de color</h4>
                    <span style={{ 
                      background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(139, 92, 246, 0.1))",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "var(--primario-oscuro)"
                    }}>
                      {itinerario.actividades.length} actividad
                      {itinerario.actividades.length === 1 ? "" : "es"}
                    </span>
                  </div>
                  <ul className="lista-actividades">
                    {itinerario.actividades.length === 0 ? (
                      <li style={{ 
                        textAlign: "center", 
                        padding: "24px",
                        color: "var(--muted)",
                        fontStyle: "italic"
                      }}>
                        ✨ Sin franjas registradas todavía. Agrega tu primera actividad abajo.
                      </li>
                    ) : (
                      itinerario.actividades.map((actividad) => (
                        <li 
                          key={actividad.id}
                          style={{ 
                            "--actividad-color": actividad.color || itinerario.colorTema 
                          } as React.CSSProperties}
                        >
                          <div className="actividad-datos">
                            <strong style={{ 
                              fontSize: "1.05rem",
                              color: "var(--texto)",
                              marginBottom: "4px"
                            }}>
                              {actividad.titulo}
                            </strong>
                            <small style={{ 
                              color: "var(--muted)",
                              fontSize: "0.9rem"
                            }}>
                              {resumenActividad(actividad)}
                            </small>
                            {actividad.descripcion && (
                              <small style={{ 
                                color: "var(--muted)",
                                fontSize: "0.85rem",
                                marginTop: "4px"
                              }}>
                                📝 {actividad.descripcion}
                              </small>
                            )}
                            {actividad.ubicacion && (
                              <small style={{ 
                                color: "var(--primario)",
                                fontSize: "0.85rem",
                                marginTop: "2px"
                              }}>
                                📍 {actividad.ubicacion}
                              </small>
                            )}
                          </div>
                          <div className="actividad-acciones">
                            <span
                              className="color-preview"
                              style={{ backgroundColor: actividad.color || itinerario.colorTema }}
                              title={`Color: ${actividad.color || itinerario.colorTema}`}
                            />
                            <label style={{ 
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer"
                            }}>
                              <input
                                type="checkbox"
                                checked={actividad.completado}
                                onChange={() =>
                                  toggleActividad(
                                    itinerario.id,
                                    actividad.id,
                                    actividad.completado
                                  )
                                }
                              />
                              <small style={{ 
                                fontWeight: actividad.completado ? "600" : "400",
                                color: actividad.completado ? "var(--exito)" : "var(--muted)"
                              }}>
                                {actividad.completado ? "✅ Completado" : "⏳ Pendiente"}
                              </small>
                            </label>
                            <button
                              type="button"
                              className="btn texto peligro"
                              onClick={() => eliminarActividad(itinerario.id, actividad.id)}
                              title="Eliminar esta actividad"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>

                  <form
                    className="form-actividad"
                    onSubmit={(event) => manejarActividadSubmit(event, itinerario.id)}
                  >
                    <input name="titulo" placeholder="Actividad o lugar" required />
                    <input name="descripcion" placeholder="Notas rápidas" />
                    <input name="ubicacion" placeholder="Ubicación" />
                    <input type="datetime-local" name="inicio" />
                    <input type="datetime-local" name="fin" />
                    <input type="color" name="color" defaultValue={itinerario.colorTema} />
                    <select name="estado" defaultValue="pendiente">
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    <button className="btn secundario" type="submit" style={{ gridColumn: "1 / -1" }}>
                      ➕ Agregar nueva actividad
                    </button>
                  </form>
                </section>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}

function ordenarItinerarios(
  a: Itinerario,
  b: Itinerario,
  criterio: FiltrosItinerario["orden"]
) {
  switch (criterio) {
    case "fechaDesc":
      return parseISO(b.fechaInicio).getTime() - parseISO(a.fechaInicio).getTime();
    case "presupuesto":
      return (b.presupuesto ?? 0) - (a.presupuesto ?? 0);
    case "creacion":
      return parseISO(b.creadoEn).getTime() - parseISO(a.creadoEn).getTime();
    case "fechaAsc":
    default:
      return parseISO(a.fechaInicio).getTime() - parseISO(b.fechaInicio).getTime();
  }
}

function estadoTemporal(itinerario: Itinerario) {
  const hoy = new Date();
  const inicio = parseISO(itinerario.fechaInicio);
  const fin = parseISO(itinerario.fechaFin);
  if (isBefore(fin, hoy)) return "Finalizado cronológicamente";
  if (isWithinInterval(hoy, { start: inicio, end: fin })) return "En curso según fechas";
  if (isAfter(inicio, hoy)) return "Próximo";
  return "Sin definir";
}

function normalizarDateTime(valor: FormDataEntryValue | null): string | null {
  if (!valor) return null;
  const texto = String(valor);
  if (!texto) return null;
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toISOString();
}

function resumenActividad(actividad: Actividad) {
  const partes = [];
  if (actividad.inicio) {
    partes.push(`Inicio: ${formatearFecha(actividad.inicio)}`);
  }
  if (actividad.fin) {
    partes.push(`Fin: ${formatearFecha(actividad.fin)}`);
  }
  if (actividad.ubicacion) {
    partes.push(`Ubicación: ${actividad.ubicacion}`);
  }
  return partes.length ? partes.join(" · ") : "Sin detalles todavía";
}