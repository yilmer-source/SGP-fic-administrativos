// Asignación de Tutor Docente. La registra la coordinación desde el
// expediente del estudiante, eligiendo entre los docentes de js/datos.js.
//
// Las asignaciones se guardan en localStorage (clave "asignaciones_docentes")
// y tienen prioridad sobre el docenteId que venga en js/datos.js.
// Se carga DESPUÉS de js/datos.js.

(function () {
    "use strict";

    var CLAVE = "asignaciones_docentes";
    var ROL_QUE_ASIGNA = "Coordinación";

    // ---- Utilidades ---------------------------------------------------
    function pad(n) { return String(n).padStart(2, "0"); }

    function hoyTexto() {
        var d = new Date();
        return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
    }

    function hoyISO() {
        var d = new Date();
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }

    function isoATexto(iso) {
        var p = String(iso || "").split("-");
        return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : "";
    }

    function el(tag, clase, texto) {
        var e = document.createElement(tag);
        if (clase) e.className = clase;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }

    function leer() {
        try {
            var o = JSON.parse(localStorage.getItem(CLAVE));
            return (o && typeof o === "object" && !Array.isArray(o)) ? o : {};
        } catch (e) {
            return {};
        }
    }

    function guardar(o) {
        try {
            localStorage.setItem(CLAVE, JSON.stringify(o));
            return true;
        } catch (e) {
            return false;
        }
    }

    // ---- Consultas (las usan estudiante y docente) -----------------------
    function docenteIdDe(est) {
        var a = leer()[est.codigo];
        if (a && a.docenteId !== undefined && a.docenteId !== null) return a.docenteId;
        return est.docenteId || null;
    }

    function estudiantesDeDocente(id) {
        return ESTUDIANTES.filter(function (e) {
            var d = docenteIdDe(e);
            return d !== null && String(d) === String(id);
        });
    }

    function historialDe(est) {
        var a = leer()[est.codigo];
        return (a && Array.isArray(a.historial)) ? a.historial : [];
    }

    // ---- Ventana para asignar o cambiar ----------------------------------
    function abrirVentana(est) {

        var activos = DOCENTES.filter(function (d) { return d.estado === "Activo"; });
        var actualId = docenteIdDe(est);
        var registro = leer()[est.codigo];

        var modal = el("div", "modal");
        modal.tabIndex = -1;
        modal.style.display = "block";
        modal.classList.add("show");
        modal.innerHTML =
            '<div class="modal-dialog">' +
              '<div class="modal-content">' +
                '<div class="modal-header text-white" style="background:#001a82;">' +
                  '<h5 class="modal-title">Asignar Tutor Docente</h5>' +
                  '<button type="button" class="btn-close btn-close-white" data-cerrar aria-label="Cerrar"></button>' +
                '</div>' +
                '<div class="modal-body">' +
                  '<div class="alert alert-danger py-2" data-error style="display:none;"></div>' +
                  '<p class="mb-3"><strong>Estudiante:</strong> <span data-nombre></span></p>' +
                  '<label class="form-label" for="selDocente">Docente</label>' +
                  '<select class="form-select" id="selDocente"></select>' +
                  '<div class="form-check mt-3">' +
                    '<input class="form-check-input" type="checkbox" id="chkPropuesto">' +
                    '<label class="form-check-label" for="chkPropuesto">Propuesto por el estudiante</label>' +
                  '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                  '<button type="button" class="btn btn-outline-secondary" data-cerrar>Cancelar</button>' +
                  '<button type="button" class="btn btn-primary" data-guardar>Guardar asignación</button>' +
                '</div>' +
              '</div>' +
            '</div>';

        var fondo = el("div", "modal-backdrop show");

        document.body.appendChild(modal);
        document.body.appendChild(fondo);
        document.body.classList.add("modal-open");

        modal.querySelector("[data-nombre]").textContent = est.nombre;

        var select = modal.querySelector("#selDocente");
        var error = modal.querySelector("[data-error]");

        var vacia = el("option", "", "Seleccione un docente...");
        vacia.value = "";
        select.appendChild(vacia);

        activos.forEach(function (d, i) {
            var n = estudiantesDeDocente(d.id).length;
            var op = el("option", "", d.nombre + " — " + d.cargo + " (" + n + (n === 1 ? " estudiante)" : " estudiantes)"));
            op.value = String(i);
            if (actualId !== null && String(d.id) === String(actualId)) op.selected = true;
            select.appendChild(op);
        });

        if (registro && registro.propuestoPorEstudiante) {
            modal.querySelector("#chkPropuesto").checked = true;
        }

        function cerrar() {
            document.body.removeChild(modal);
            document.body.removeChild(fondo);
            document.body.classList.remove("modal-open");
            document.removeEventListener("keydown", alEscape);
        }

        function alEscape(e) { if (e.key === "Escape") cerrar(); }

        function mostrarError(texto) {
            error.textContent = texto;
            error.style.display = "block";
        }

        modal.querySelectorAll("[data-cerrar]").forEach(function (b) {
            b.addEventListener("click", cerrar);
        });
        modal.addEventListener("click", function (e) { if (e.target === modal) cerrar(); });
        document.addEventListener("keydown", alEscape);

        modal.querySelector("[data-guardar]").addEventListener("click", function () {

            if (select.value === "") { mostrarError("Seleccione un docente."); return; }

            var nuevo = activos[Number(select.value)];

            if (actualId !== null && String(nuevo.id) === String(actualId)) {
                mostrarError(nuevo.nombre + " ya es el Tutor Docente actual.");
                return;
            }

            var todas = leer();
            var previo = todas[est.codigo] || {};
            var historial = Array.isArray(previo.historial) ? previo.historial.slice() : [];

            var anterior = (actualId !== null) ? buscarDocente(actualId) : null;

            historial.push(
                hoyTexto() + " - " +
                (anterior
                    ? "Tutor docente cambiado de " + anterior.nombre + " a " + nuevo.nombre
                    : "Tutor docente asignado: " + nuevo.nombre) +
                " (" + ROL_QUE_ASIGNA + ")."
            );

            todas[est.codigo] = {
                docenteId: nuevo.id,
                fecha: hoyISO(),
                propuestoPorEstudiante: modal.querySelector("#chkPropuesto").checked,
                historial: historial
            };

            if (!guardar(todas)) {
                mostrarError("No se pudo guardar la asignación en este navegador.");
                return;
            }

            window.location.reload();
        });
    }

    // ---- Tarjeta del expediente -------------------------------------------
    // Se dibuja dentro de <div id="tarjetaDirector"></div>
    function montar(est) {

        var cont = document.getElementById("tarjetaDirector");
        if (!cont || typeof DOCENTES === "undefined") return;

        cont.innerHTML = "";

        var tarjeta = el("div", "card mb-3");
        tarjeta.appendChild(el("div", "card-header", "Tutor Docente"));

        var cuerpo = el("div", "card-body");

        var id = docenteIdDe(est);
        var director = (id !== null) ? buscarDocente(id) : null;
        var registro = leer()[est.codigo];

        var badge = el("span", director ? "badge bg-success" : "badge bg-secondary",
                       director ? "Asignado" : "Sin asignar");
        cuerpo.appendChild(badge);

        if (director) {

            var p1 = el("p", "mt-3 mb-1");
            p1.appendChild(el("strong", "", "Nombre: "));
            var enlace = el("a", "", director.nombre);
            enlace.href = "detalle-docente.html?id=" + encodeURIComponent(director.id);
            p1.appendChild(enlace);
            cuerpo.appendChild(p1);

            var p2 = el("p", "mb-1");
            p2.appendChild(el("strong", "", "Correo: "));
            p2.appendChild(document.createTextNode(director.correo));
            cuerpo.appendChild(p2);

            var p3 = el("p", "mb-1");
            p3.appendChild(el("strong", "", "Cargo: "));
            p3.appendChild(document.createTextNode(director.cargo));
            cuerpo.appendChild(p3);

            if (registro && registro.fecha) {
                var p4 = el("p", "mb-1");
                p4.appendChild(el("strong", "", "Asignado el: "));
                p4.appendChild(document.createTextNode(isoATexto(registro.fecha)));
                cuerpo.appendChild(p4);

                var p5 = el("p", "mb-1");
                p5.appendChild(el("strong", "", "Propuesto por el estudiante: "));
                p5.appendChild(document.createTextNode(registro.propuestoPorEstudiante ? "Sí" : "No"));
                cuerpo.appendChild(p5);
            }
        } else {
            cuerpo.appendChild(el("p", "mt-3 mb-1 text-muted",
                "Este estudiante todavía no tiene Tutor Docente."));
        }

        var accion = el("div", "mt-3");

        if (est.estado === "Finalizado") {
            accion.appendChild(el("p", "small text-muted mb-0", "La práctica ya finalizó."));
        } else {
            var boton = el("button", "btn btn-primary", director ? "Cambiar tutor" : "Asignar tutor");
            boton.type = "button";
            boton.addEventListener("click", function () { abrirVentana(est); });
            accion.appendChild(boton);
        }

        cuerpo.appendChild(accion);
        tarjeta.appendChild(cuerpo);
        cont.appendChild(tarjeta);
    }

    window.Asignaciones = {
        docenteIdDe: docenteIdDe,
        estudiantesDeDocente: estudiantesDeDocente,
        historialDe: historialDe,
        montar: montar
    };
})();