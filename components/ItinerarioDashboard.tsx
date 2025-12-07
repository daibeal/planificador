"use client";

import { useMemo, useState, useTransition, FormEvent } from "react";
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
    setTimeout(() => setMensaje(null), 4500);
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

      const actualizado: Itinerario = await respuesta.json();
      startTransition(() => {
        setItinerarios((prev) => {
          if (editandoId) {
            return prev.map((it) => (it.id === actualizado.id ? actualizado : it));
          }
          return [actualizado, ...prev];
        });
      });
      mostrarMensaje(editandoId ? "Itinerario actualizado." : "Itinerario guardado.");
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
    const respuesta = await fetch(`/api/itinerarios/${id}`, { method: "DELETE" });
    if (!respuesta.ok) {
      mostrarMensaje("No se pudo eliminar.", "error");
      return;
    }
    startTransition(() => {
      setItinerarios((prev) => prev.filter((it) => it.id !== id));
    });
    mostrarMensaje("Itinerario eliminado.");
  }

  async function duplicarItinerario(id: string) {
    const respuesta = await fetch(`/api/itinerarios/${id}/duplicar`, { method: "POST" });
    if (!respuesta.ok) {
      mostrarMensaje("No se pudo duplicar.", "error");
      return;
    }
    const nuevo: Itinerario = await respuesta.json();
    startTransition(() => {
      setItinerarios((prev) => [nuevo, ...prev]);
    });
    mostrarMensaje("Itinerario duplicado.");
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

    const respuesta = await fetch(`/api/itinerarios/${itinerarioId}/actividades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!respuesta.ok) {
      mostrarMensaje("No se pudo agregar la actividad.", "error");
      return;
    }

    const actualizado: Itinerario = await respuesta.json();
    event.currentTarget.reset();
    startTransition(() => {
      setItinerarios((prev) => prev.map((it) => (it.id === actualizado.id ? actualizado : it)));
    });
    mostrarMensaje("Actividad registrada.");
  }

  async function toggleActividad(
    itinerarioId: string,
    actividadId: string,
    estadoActual: boolean
  ) {
    const respuesta = await fetch(
      `/api/itinerarios/${itinerarioId}/actividades/${actividadId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completado: !estadoActual }),
      }
    );

    if (!respuesta.ok) {
      mostrarMensaje("No se pudo actualizar la actividad.", "error");
      return;
    }

    const actualizado: Itinerario = await respuesta.json();
    startTransition(() => {
      setItinerarios((prev) => prev.map((it) => (it.id === actualizado.id ? actualizado : it)));
    });
  }

  async function eliminarActividad(itinerarioId: string, actividadId: string) {
    const respuesta = await fetch(
      `/api/itinerarios/${itinerarioId}/actividades/${actividadId}`,
      { method: "DELETE" }
    );

    if (!respuesta.ok) {
      mostrarMensaje("No se pudo quitar la actividad.", "error");
      return;
    }

    const actualizado: Itinerario = await respuesta.json();
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
        for (const item of contenido) {
          await fetch("/api/itinerarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...item,
              etiquetas: item.etiquetas ?? [],
              colorTema: item.colorTema ?? "#2563eb",
            }),
          });
        }
        const refresco = await fetch("/api/itinerarios");
        const lista: Itinerario[] = await refresco.json();
        setItinerarios(lista);
        mostrarMensaje("Importación completada.");
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
    await Promise.all(
      itinerarios.map((it) => fetch(`/api/itinerarios/${it.id}`, { method: "DELETE" }))
    );
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
        </div>
        <div className="header-actions">
          <button className="btn secundario" onClick={exportarJSON}>
            Exportar JSON
          </button>
          <button className="btn primario" onClick={() => document.getElementById("archivoImportacion")?.click()}>
            Importar JSON
          </button>
          <button className="btn peligro" onClick={limpiarTodo}>
            Limpiar base
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
        <div className={clsx("alerta", mensaje.tipo === "error" && "error")}>{mensaje.texto}</div>
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
              {enviando ? "Guardando..." : editandoId ? "Actualizar" : "Guardar"}
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
            <p className="etiqueta">Total</p>
            <strong>{resumen.total}</strong>
            <span>Itinerarios guardados</span>
          </article>
          <article>
            <p className="etiqueta">Próximos 30 días</p>
            <strong>{resumen.proximos}</strong>
            <span>Viajes que inician pronto</span>
          </article>
          <article>
            <p className="etiqueta">Presupuesto combinado</p>
            <strong>${resumen.presupuesto.toLocaleString()}</strong>
            <span>USD considerados</span>
          </article>
          <article>
            <p className="etiqueta">Paletas activas</p>
            <strong>{resumen.paletas}</strong>
            <span>Colores usados en franjas</span>
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
            <p>No hay coincidencias con los filtros actuales.</p>
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
                    <button className="btn texto" onClick={() => duplicarItinerario(itinerario.id)}>
                      Duplicar
                    </button>
                    <button className="btn texto" onClick={() => iniciarEdicion(itinerario)}>
                      Editar
                    </button>
                    <button
                      className="btn texto peligro"
                      onClick={() => eliminarItinerario(itinerario.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </header>

                <div className="detalles">
                  <p>
                    <strong>Duración:</strong>{" "}
                    {differenceInCalendarDays(
                      parseISO(itinerario.fechaFin),
                      parseISO(itinerario.fechaInicio)
                    ) + 1}{" "}
                    días
                  </p>
                  <p>
                    <strong>Presupuesto:</strong> $
                    {(itinerario.presupuesto ?? 0).toLocaleString()}
                  </p>
                  <p>
                    <strong>Transporte:</strong> {itinerario.transporte || "Sin definir"}
                  </p>
                  <p>
                    <strong>Hospedaje:</strong> {itinerario.hospedaje || "Pendiente"}
                  </p>
                </div>

                <div className="indicador-color" style={{ color: itinerario.colorTema }}>
                  <span style={{ backgroundColor: itinerario.colorTema }} />
                  Paleta principal para franjas temporales
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
                    <h4>Agenda y franjas de color</h4>
                    <span>
                      {itinerario.actividades.length} actividad
                      {itinerario.actividades.length === 1 ? "" : "es"}
                    </span>
                  </div>
                  <ul className="lista-actividades">
                    {itinerario.actividades.length === 0 ? (
                      <li>Sin franjas registradas todavía.</li>
                    ) : (
                      itinerario.actividades.map((actividad) => (
                        <li key={actividad.id}>
                          <div className="actividad-datos">
                            <strong>{actividad.titulo}</strong>
                            <small>{resumenActividad(actividad)}</small>
                            {actividad.descripcion && <small>{actividad.descripcion}</small>}
                          </div>
                          <div className="actividad-acciones">
                            <span
                              className="color-preview"
                              style={{ backgroundColor: actividad.color || itinerario.colorTema }}
                            />
                            <label>
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
                              <small>{actividad.completado ? "Listo" : "Pendiente"}</small>
                            </label>
                            <button
                              type="button"
                              className="btn texto peligro"
                              onClick={() => eliminarActividad(itinerario.id, actividad.id)}
                            >
                              Quitar
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
                    <button className="btn secundario" type="submit">
                      Agregar franja
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