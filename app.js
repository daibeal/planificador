const storageKey = "planificadorItinerarios.v1";

const refs = {
  form: document.getElementById("formItinerario"),
  campoId: document.getElementById("itinerarioId"),
  nombre: document.getElementById("nombre"),
  destino: document.getElementById("destino"),
  fechaInicio: document.getElementById("fechaInicio"),
  fechaFin: document.getElementById("fechaFin"),
  presupuesto: document.getElementById("presupuesto"),
  transporte: document.getElementById("transporte"),
  hospedaje: document.getElementById("hospedaje"),
  etiquetas: document.getElementById("etiquetas"),
  notas: document.getElementById("notas"),
  btnCancelar: document.getElementById("btnCancelarEdicion"),
  tituloFormulario: document.getElementById("titulo-formulario"),
  estadoFormulario: document.getElementById("estado-formulario"),
  lista: document.getElementById("listaItinerarios"),
  plantilla: document.getElementById("tplItinerario"),
  buscador: document.getElementById("buscador"),
  filtroFecha: document.getElementById("filtroFecha"),
  filtroEstado: document.getElementById("filtroEstado"),
  filtroOrden: document.getElementById("filtroOrden"),
  contador: document.getElementById("contadorItinerarios"),
  resumenTotal: document.getElementById("resumenTotal"),
  resumenProximos: document.getElementById("resumenProximos"),
  resumenPresupuesto: document.getElementById("resumenPresupuesto"),
  btnLimpiarTodo: document.getElementById("btnLimpiarTodo"),
  btnExportar: document.getElementById("btnExportar"),
  btnImportar: document.getElementById("btnImportar"),
  inputImportar: document.getElementById("inputImportar"),
};

let itinerarios = cargarDesdeStorage();
render();

refs.form.addEventListener("submit", manejarEnvioFormulario);
refs.btnCancelar.addEventListener("click", (event) => {
  event.preventDefault();
  resetFormulario();
});

[refs.buscador, refs.filtroFecha, refs.filtroEstado, refs.filtroOrden].forEach((control) =>
  control.addEventListener("input", () => render())
);

refs.lista.addEventListener("click", manejarClickLista);
refs.lista.addEventListener("submit", manejarActividadSubmit);
refs.lista.addEventListener("change", manejarActividadCheckbox);

refs.btnLimpiarTodo.addEventListener("click", () => {
  if (!itinerarios.length) return;
  const confirmar = window.confirm(
    "Esto eliminará todos tus itinerarios. ¿Deseas continuar?"
  );
  if (!confirmar) return;
  itinerarios = [];
  persistir();
  resetFormulario();
  render();
  mostrarEstado("Todo se ha limpiado.");
});

refs.btnExportar.addEventListener("click", exportarJSON);
refs.btnImportar.addEventListener("click", () => refs.inputImportar.click());
refs.inputImportar.addEventListener("change", importarJSON);

function manejarEnvioFormulario(event) {
  event.preventDefault();
  const datos = obtenerDatosFormulario();
  if (new Date(datos.fechaFin) < new Date(datos.fechaInicio)) {
    mostrarEstado("La fecha de regreso no puede ser anterior a la de inicio.", true);
    return;
  }

  if (refs.campoId.value) {
    itinerarios = itinerarios.map((it) =>
      it.id === refs.campoId.value
        ? {
            ...it,
            ...datos,
            etiquetas: datos.etiquetas,
            actividades: it.actividades,
            actualizadoEn: new Date().toISOString(),
          }
        : it
    );
    mostrarEstado("Itinerario actualizado correctamente.");
  } else {
    const nuevo = {
      id: generarId(),
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      actividades: [],
      ...datos,
    };
    itinerarios = [nuevo, ...itinerarios];
    mostrarEstado("Itinerario guardado.");
  }

  persistir();
  render();
  resetFormulario();
}

function obtenerDatosFormulario() {
  return {
    nombre: refs.nombre.value.trim(),
    destino: refs.destino.value.trim(),
    fechaInicio: refs.fechaInicio.value,
    fechaFin: refs.fechaFin.value,
    presupuesto: Number(refs.presupuesto.value) || 0,
    transporte: refs.transporte.value,
    hospedaje: refs.hospedaje.value.trim(),
    etiquetas: refs.etiquetas.value
      .split(",")
      .map((etiq) => etiq.trim())
      .filter(Boolean),
    notas: refs.notas.value.trim(),
  };
}

function resetFormulario() {
  refs.form.reset();
  refs.campoId.value = "";
  refs.tituloFormulario.textContent = "Nuevo itinerario";
  mostrarEstado("Rellena los campos y guarda.");
}

function mostrarEstado(mensaje, esError = false) {
  refs.estadoFormulario.textContent = mensaje;
  refs.estadoFormulario.style.color = esError ? "#dc2626" : "var(--muted)";
}

function render() {
  const filtros = obtenerFiltros();
  const resultado = itinerarios
    .filter((it) => filtroTexto(it, filtros.texto))
    .filter((it) => filtroFecha(it, filtros.fecha))
    .filter((it) => filtroEstado(it, filtros.estado))
    .sort((a, b) => ordenarItinerarios(a, b, filtros.orden));

  refs.contador.textContent = `${resultado.length} ${
    resultado.length === 1 ? "resultado" : "resultados"
  }`;

  refs.lista.innerHTML = "";
  refs.lista.classList.toggle("vacio", resultado.length === 0);

  if (!resultado.length) {
    refs.lista.innerHTML = "<p>No hay coincidencias con los filtros elegidos.</p>";
  } else {
    resultado.forEach((itinerario) => refs.lista.appendChild(crearCard(itinerario)));
  }

  actualizarResumen();
}

function crearCard(itinerario) {
  const nodo = refs.plantilla.content.cloneNode(true);
  const tarjeta = nodo.querySelector(".itinerario");
  tarjeta.dataset.id = itinerario.id;

  tarjeta.querySelector(".titulo").textContent = itinerario.nombre;
  tarjeta.querySelector(".destino").textContent = `${
    itinerario.destino
  } · ${calcularEstadoLegible(itinerario)}`;
  tarjeta.querySelector(".fechas").textContent = formatearRango(
    itinerario.fechaInicio,
    itinerario.fechaFin
  );
  tarjeta.querySelector(
    ".transporte"
  ).textContent = `Transporte: ${itinerario.transporte || "Sin definir"}`;
  tarjeta.querySelector(
    ".hospedaje"
  ).textContent = `Hospedaje: ${itinerario.hospedaje || "Pendiente"}`;
  tarjeta.querySelector(
    ".presupuesto"
  ).textContent = `Presupuesto: ${formatearMoneda(itinerario.presupuesto)}`;
  tarjeta.querySelector(".notas").textContent = itinerario.notas || "Sin notas";

  const contenedorEtiquetas = tarjeta.querySelector(".etiquetas");
  contenedorEtiquetas.innerHTML = "";
  if (itinerario.etiquetas.length) {
    itinerario.etiquetas.forEach((etiqueta) => {
      const span = document.createElement("span");
      span.textContent = etiqueta;
      contenedorEtiquetas.appendChild(span);
    });
  }

  const listaActividades = tarjeta.querySelector(".lista-actividades");
  listaActividades.innerHTML = "";
  if (!itinerario.actividades.length) {
    const vacio = document.createElement("li");
    vacio.textContent = "Aún no agregas actividades.";
    listaActividades.appendChild(vacio);
  } else {
    itinerario.actividades.forEach((actividad) => {
      listaActividades.appendChild(crearActividadItem(itinerario.id, actividad));
    });
  }
  tarjeta.querySelector(
    ".contador-actividades"
  ).textContent = `${itinerario.actividades.length} actividad${
    itinerario.actividades.length === 1 ? "" : "es"
  }`;

  return nodo;
}

function crearActividadItem(itinerarioId, actividad) {
  const li = document.createElement("li");
  li.dataset.actividadId = actividad.id;

  const datos = document.createElement("div");
  datos.className = "actividad-datos";
  const titulo = document.createElement("strong");
  titulo.textContent = actividad.titulo;
  const meta = document.createElement("small");
  const detalles = [actividad.horario, actividad.ubicacion]
    .filter(Boolean)
    .join(" · ");
  meta.textContent = detalles || "Sin detalles";
  datos.append(titulo, meta);

  const acciones = document.createElement("div");
  acciones.className = "actividad-acciones";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(actividad.completado);
  checkbox.dataset.accion = "toggle-actividad";
  checkbox.dataset.actividadId = actividad.id;

  const etiqueta = document.createElement("span");
  etiqueta.textContent = actividad.completado ? "Listo" : "Pendiente";
  etiqueta.className = actividad.completado ? "estado listo" : "estado pendiente";

  const btnEliminar = document.createElement("button");
  btnEliminar.type = "button";
  btnEliminar.dataset.accion = "eliminar-actividad";
  btnEliminar.textContent = "Quitar";

  acciones.append(checkbox, etiqueta, btnEliminar);
  li.append(datos, acciones);
  return li;
}

function obtenerFiltros() {
  return {
    texto: refs.buscador.value.toLowerCase(),
    fecha: refs.filtroFecha.value,
    estado: refs.filtroEstado.value,
    orden: refs.filtroOrden.value,
  };
}

function filtroTexto(itinerario, texto) {
  if (!texto) return true;
  const campo = [
    itinerario.nombre,
    itinerario.destino,
    itinerario.hospedaje,
    itinerario.transporte,
    itinerario.notas,
    itinerario.etiquetas.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return campo.includes(texto);
}

function filtroFecha(itinerario, fecha) {
  if (!fecha) return true;
  return new Date(itinerario.fechaInicio) >= new Date(fecha);
}

function estadoItinerario(itinerario) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(itinerario.fechaInicio);
  const fin = new Date(itinerario.fechaFin);

  if (fin < hoy) return "finalizado";
  if (inicio <= hoy && fin >= hoy) return "enCurso";
  return "proximo";
}

function filtroEstado(itinerario, estado) {
  if (estado === "todos") return true;
  return estadoItinerario(itinerario) === estado;
}

function ordenarItinerarios(a, b, orden) {
  switch (orden) {
    case "fechaDesc":
      return new Date(b.fechaInicio) - new Date(a.fechaInicio);
    case "presupuesto":
      return b.presupuesto - a.presupuesto;
    case "creacion":
      return new Date(b.creadoEn) - new Date(a.creadoEn);
    case "fechaAsc":
    default:
      return new Date(a.fechaInicio) - new Date(b.fechaInicio);
  }
}

function calcularEstadoLegible(itinerario) {
  const estado = estadoItinerario(itinerario);
  if (estado === "enCurso") return "En curso";
  if (estado === "finalizado") return "Finalizado";
  return "Próximo";
}

function formatearRango(inicio, fin) {
  const intl = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${intl.format(new Date(inicio))} → ${intl.format(new Date(fin))}`;
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

function manejarClickLista(event) {
  const boton = event.target.closest("button[data-accion]");
  if (!boton) return;
  const tarjeta = boton.closest(".itinerario");
  const id = tarjeta?.dataset.id;
  if (!id) return;

  switch (boton.dataset.accion) {
    case "editar":
      iniciarEdicion(id);
      break;
    case "eliminar":
      eliminarItinerario(id);
      break;
    case "duplicar":
      duplicarItinerario(id);
      break;
    case "eliminar-actividad":
      eliminarActividad(id, boton.closest("li")?.dataset.actividadId);
      break;
  }
}

function manejarActividadSubmit(event) {
  if (!event.target.matches(".form-actividad")) return;
  event.preventDefault();
  const tarjeta = event.target.closest(".itinerario");
  const id = tarjeta?.dataset.id;
  if (!id) return;

  const titulo = event.target.titulo.value.trim();
  const horario = event.target.horario.value.trim();
  const ubicacion = event.target.ubicacion.value.trim();
  if (!titulo) return;

  itinerarios = itinerarios.map((it) =>
    it.id === id
      ? {
          ...it,
          actividades: [
            ...it.actividades,
            {
              id: generarId(),
              titulo,
              horario,
              ubicacion,
              completado: false,
              creadoEn: new Date().toISOString(),
            },
          ],
          actualizadoEn: new Date().toISOString(),
        }
      : it
  );

  event.target.reset();
  persistir();
  render();
}

function manejarActividadCheckbox(event) {
  if (
    event.target.tagName !== "INPUT" ||
    event.target.dataset.accion !== "toggle-actividad"
  )
    return;
  const tarjeta = event.target.closest(".itinerario");
  const itinerarioId = tarjeta?.dataset.id;
  const actividadId = event.target.dataset.actividadId;
  if (!itinerarioId || !actividadId) return;

  itinerarios = itinerarios.map((it) => {
    if (it.id !== itinerarioId) return it;
    return {
      ...it,
      actividades: it.actividades.map((act) =>
        act.id === actividadId
          ? { ...act, completado: event.target.checked }
          : act
      ),
    };
  });

  persistir();
  render();
}

function iniciarEdicion(id) {
  const itinerario = itinerarios.find((it) => it.id === id);
  if (!itinerario) return;
  refs.campoId.value = itinerario.id;
  refs.nombre.value = itinerario.nombre;
  refs.destino.value = itinerario.destino;
  refs.fechaInicio.value = itinerario.fechaInicio;
  refs.fechaFin.value = itinerario.fechaFin;
  refs.presupuesto.value = itinerario.presupuesto;
  refs.transporte.value = itinerario.transporte;
  refs.hospedaje.value = itinerario.hospedaje;
  refs.etiquetas.value = itinerario.etiquetas.join(", ");
  refs.notas.value = itinerario.notas;
  refs.tituloFormulario.textContent = "Editar itinerario";
  mostrarEstado("Editando: no olvides guardar los cambios.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function eliminarItinerario(id) {
  const itinerario = itinerarios.find((it) => it.id === id);
  if (!itinerario) return;
  const confirmar = window.confirm(
    `¿Eliminar definitivamente "${itinerario.nombre}"?`
  );
  if (!confirmar) return;
  itinerarios = itinerarios.filter((it) => it.id !== id);
  persistir();
  render();
  mostrarEstado("Itinerario eliminado.");
}

function duplicarItinerario(id) {
  const itinerario = itinerarios.find((it) => it.id === id);
  if (!itinerario) return;
  const copiaOriginal = clonarSeguro(itinerario);
  const copia = {
    ...copiaOriginal,
    id: generarId(),
    nombre: `${itinerario.nombre} (copia)`,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
    actividades: copiaOriginal.actividades.map((act) => ({
      ...act,
      id: generarId(),
      completado: false,
      creadoEn: new Date().toISOString(),
    })),
  };
  itinerarios = [copia, ...itinerarios];
  persistir();
  render();
  mostrarEstado("Itinerario duplicado.");
}

function eliminarActividad(itinerarioId, actividadId) {
  if (!actividadId) return;
  itinerarios = itinerarios.map((it) =>
    it.id === itinerarioId
      ? {
          ...it,
          actividades: it.actividades.filter((act) => act.id !== actividadId),
        }
      : it
  );
  persistir();
  render();
}

function actualizarResumen() {
  refs.resumenTotal.textContent = itinerarios.length;
  const hoy = new Date();
  const en30Dias = new Date();
  en30Dias.setDate(en30Dias.getDate() + 30);
  const proximos = itinerarios.filter((it) => {
    const inicio = new Date(it.fechaInicio);
    return inicio >= hoy && inicio <= en30Dias;
  }).length;
  refs.resumenProximos.textContent = proximos;
  const totalPresupuesto = itinerarios.reduce(
    (acc, it) => acc + (Number(it.presupuesto) || 0),
    0
  );
  refs.resumenPresupuesto.textContent = formatearMoneda(totalPresupuesto);
}

function exportarJSON() {
  if (!itinerarios.length) {
    mostrarEstado("No hay datos para exportar.", true);
    return;
  }
  const blob = new Blob([JSON.stringify(itinerarios, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `itinerarios-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  enlace.click();
  URL.revokeObjectURL(url);
}

function importarJSON(event) {
  const archivo = event.target.files?.[0];
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = (e) => {
    try {
      const datos = JSON.parse(e.target.result);
      if (!Array.isArray(datos)) throw new Error();
      const normalizados = datos
        .map((item) => normalizarItinerario(item))
        .filter(Boolean);
      itinerarios = [...normalizados, ...itinerarios];
      persistir();
      render();
      mostrarEstado("Datos importados correctamente.");
    } catch (error) {
      mostrarEstado("No se pudo importar el archivo.", true);
    } finally {
      refs.inputImportar.value = "";
    }
  };
  lector.readAsText(archivo);
}

function normalizarItinerario(item) {
  if (!item.nombre || !item.destino || !item.fechaInicio || !item.fechaFin) {
    return null;
  }
  return {
    id: generarId(),
    nombre: String(item.nombre),
    destino: String(item.destino),
    fechaInicio: item.fechaInicio,
    fechaFin: item.fechaFin,
    presupuesto: Number(item.presupuesto) || 0,
    transporte: item.transporte || "Avión",
    hospedaje: item.hospedaje || "",
    etiquetas: Array.isArray(item.etiquetas)
      ? item.etiquetas.map((e) => String(e))
      : [],
    notas: item.notas || "",
    actividades: Array.isArray(item.actividades)
      ? item.actividades.map((act) => ({
          id: generarId(),
          titulo: act.titulo || "Actividad",
          horario: act.horario || "",
          ubicacion: act.ubicacion || "",
          completado: Boolean(act.completado),
          creadoEn: new Date().toISOString(),
        }))
      : [],
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  };
}

function persistir() {
  localStorage.setItem(storageKey, JSON.stringify(itinerarios));
}

function cargarDesdeStorage() {
  try {
    const datos = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(datos)) {
      return datos.map((item) => ({
        actividades: [],
        etiquetas: [],
        ...item,
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
}

function generarId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return (
    Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
  );
}

function clonarSeguro(valor) {
  if (typeof structuredClone === \"function\") return structuredClone(valor);
  return JSON.parse(JSON.stringify(valor));
}
