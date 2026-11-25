// Flujo "Enviar enlace de activación" para estudiantes.
// Misma mecánica que el de empresas: se llena el formulario, se genera un
// enlace único con su mensaje, y se puede copiar, abrir en el correo o "enviar".
//
// Se necesita en estudiantes.html: un boton con id "btnInvitarEstudiante"
// y cargar este archivo con una etiqueta script al final de la pagina.

(function () {
    "use strict";

    // ---- Ajustes ------------------------------------------------------
    var DOMINIO_INSTITUCIONAL = "@unicauca.edu.co"; // "" para aceptar cualquier correo
    var PAGINA_ACTIVACION = "activar-estudiante.html";
    var PLAZO_POR_DEFECTO_DIAS = 10;
    var CLAVE_INVITACIONES = "invitaciones_estudiantes";

    var boton = document.getElementById("btnInvitarEstudiante");
    if (!boton) return;

    // ---- Utilidades ---------------------------------------------------
    function pad(n) { return String(n).padStart(2, "0"); }

    function aISO(fecha) {
        return fecha.getFullYear() + "-" + pad(fecha.getMonth() + 1) + "-" + pad(fecha.getDate());
    }

    function desdeISO(iso) {
        var p = iso.split("-");
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    function textoFecha(iso) {
        return desdeISO(iso).toLocaleDateString("es-CO", {
            day: "numeric", month: "long", year: "numeric"
        });
    }

    function plazoPorDefecto() {
        var d = new Date();
        d.setDate(d.getDate() + PLAZO_POR_DEFECTO_DIAS);
        return aISO(d);
    }

    function tokenAleatorio() {
        var bytes = new Uint8Array(16);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
        }
        return Array.prototype.map.call(bytes, function (b) {
            return pad(b.toString(16));
        }).join("");
    }

    function armarEnlace(token, correo, nombre, plazoTxt) {
        var url = new URL(PAGINA_ACTIVACION, window.location.href);
        url.searchParams.set("token", token);
        url.searchParams.set("correo", correo);
        if (nombre) url.searchParams.set("nombre", nombre);
        url.searchParams.set("plazo", plazoTxt);
        return url.toString();
    }

    function armarMensaje(nombre, enlace, plazoTxt) {
        var saludo = nombre ? "Cordial saludo, " + nombre + ":" : "Cordial saludo:";

        return saludo + "\n\n" +
            "Se ha habilitado su acceso al Sistema de Gestión de Pasantías (SGP) de la " +
            "Facultad de Ingeniería Civil de la Universidad del Cauca. Para activar su cuenta, " +
            "ingrese al siguiente enlace y complete sus datos:\n\n" +
            enlace + "\n\n" +
            "Requisitos previos del estudiante:\n" +
            "1) Estar matriculado en su programa de pregrado en SIMCA.\n" +
            "2) Tener aprobado el 80% de los créditos del programa (70% en Geotecnología).\n" +
            "3) Tener matriculado Trabajo de Grado en SIMCA para elaborar el Plan de Trabajo " +
            "(no obligatorio en Geotecnología).\n\n" +
            "Plazo para activar su cuenta: " + plazoTxt + ".\n" +
            "Dudas: pasantiasfic@unicauca.edu.co (asunto: DUDAS PASANTÍA)\n\n" +
            "Universidad del Cauca - Facultad de Ingeniería Civil";
    }

    function guardarInvitacion(registro) {
        try {
            var lista = JSON.parse(localStorage.getItem(CLAVE_INVITACIONES)) || [];
            if (!Array.isArray(lista)) lista = [];
            lista.push(registro);
            localStorage.setItem(CLAVE_INVITACIONES, JSON.stringify(lista));
            return true;
        } catch (e) {
            return false;
        }
    }

    // ---- Ventana (sin depender del JS de Bootstrap) ---------------------
    var modal = document.createElement("div");
    modal.className = "modal";
    modal.tabIndex = -1;
    modal.style.display = "none";
    modal.innerHTML =
        '<div class="modal-dialog modal-lg modal-dialog-scrollable">' +
          '<div class="modal-content">' +
            '<div class="modal-header text-white" style="background:#001a82;">' +
              '<h5 class="modal-title">Enviar enlace de activación a un estudiante</h5>' +
              '<button type="button" class="btn-close btn-close-white" id="invCerrar" aria-label="Cerrar"></button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div class="alert alert-danger py-2" id="invError" style="display:none;"></div>' +
              '<div class="alert alert-success py-2" id="invOk" style="display:none;"></div>' +
              '<div class="row g-3">' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="invCorreo">Correo del estudiante *</label>' +
                  '<input type="email" class="form-control" id="invCorreo" placeholder="estudiante@unicauca.edu.co">' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="invNombre">Nombre del estudiante</label>' +
                  '<input type="text" class="form-control" id="invNombre" placeholder="Opcional">' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="invPlazo">Plazo para activar la cuenta</label>' +
                  '<input type="date" class="form-control" id="invPlazo">' +
                '</div>' +
              '</div>' +
              '<div id="invResultado" style="display:none;">' +
                '<label class="form-label mt-3" for="invEnlace">Enlace único</label>' +
                '<div class="input-group">' +
                  '<input type="text" class="form-control" id="invEnlace" readonly>' +
                  '<button type="button" class="btn btn-outline-secondary" id="invCopiarEnlace">Copiar</button>' +
                '</div>' +
                '<label class="form-label mt-3" for="invMensaje">Mensaje</label>' +
                '<textarea class="form-control" id="invMensaje" rows="11"></textarea>' +
              '</div>' +
              '<div class="d-flex justify-content-between flex-wrap gap-2 mt-3">' +
                '<div class="d-flex flex-wrap gap-2">' +
                  '<button type="button" class="btn btn-primary" id="invGenerar">Generar enlace</button>' +
                  '<button type="button" class="btn btn-outline-primary" id="invCopiarMensaje" style="display:none;">Copiar mensaje</button>' +
                  '<button type="button" class="btn btn-success" id="invCorreoBtn" style="display:none;">Abrir en correo</button>' +
                '</div>' +
                '<button type="button" class="btn btn-secondary" id="invEnviar" disabled>Enviar</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

    var fondo = document.createElement("div");
    fondo.className = "modal-backdrop show";
    fondo.style.display = "none";

    document.body.appendChild(modal);
    document.body.appendChild(fondo);

    function $(id) { return document.getElementById(id); }

    var generado = null; // { token, correo, nombre, plazoISO }

    function mostrarError(texto) {
        $("invOk").style.display = "none";
        $("invError").textContent = texto;
        $("invError").style.display = texto ? "block" : "none";
    }

    function mostrarOk(texto) {
        $("invError").style.display = "none";
        $("invOk").textContent = texto;
        $("invOk").style.display = "block";
    }

    function reiniciar() {
        generado = null;
        $("invCorreo").value = "";
        $("invNombre").value = "";
        $("invPlazo").value = plazoPorDefecto();
        $("invPlazo").min = aISO(new Date());
        $("invEnlace").value = "";
        $("invMensaje").value = "";
        $("invResultado").style.display = "none";
        $("invCopiarMensaje").style.display = "none";
        $("invCorreoBtn").style.display = "none";
        $("invGenerar").textContent = "Generar enlace";
        $("invEnviar").disabled = true;
        $("invError").style.display = "none";
        $("invOk").style.display = "none";
    }

    function abrir() {
        reiniciar();
        modal.style.display = "block";
        modal.classList.add("show");
        fondo.style.display = "block";
        document.body.classList.add("modal-open");
        document.body.style.overflow = "hidden";
        $("invCorreo").focus();
    }

    function cerrar() {
        modal.style.display = "none";
        modal.classList.remove("show");
        fondo.style.display = "none";
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
    }

    function validar() {
        var correo = $("invCorreo").value.trim().toLowerCase();
        var plazo = $("invPlazo").value;

        if (!correo) return "Escriba el correo del estudiante.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return "El correo no tiene un formato válido.";
        if (DOMINIO_INSTITUCIONAL && !correo.endsWith(DOMINIO_INSTITUCIONAL)) {
            return "Use el correo institucional (" + DOMINIO_INSTITUCIONAL + ").";
        }
        if (!plazo) return "Seleccione el plazo para activar la cuenta.";
        if (plazo < aISO(new Date())) return "El plazo no puede ser una fecha pasada.";
        return "";
    }

    // Genera (o regenera) el enlace con un token nuevo
    function generar() {
        var error = validar();
        if (error) { mostrarError(error); return; }
        mostrarError("");

        var correo = $("invCorreo").value.trim().toLowerCase();
        var nombre = $("invNombre").value.trim();
        var plazoISO = $("invPlazo").value;
        var plazoTxt = textoFecha(plazoISO);
        var token = tokenAleatorio();

        var enlace = armarEnlace(token, correo, nombre, plazoTxt);

        generado = { token: token, correo: correo, nombre: nombre, plazoISO: plazoISO };

        $("invEnlace").value = enlace;
        $("invMensaje").value = armarMensaje(nombre, enlace, plazoTxt);
        $("invResultado").style.display = "block";
        $("invCopiarMensaje").style.display = "inline-block";
        $("invCorreoBtn").style.display = "inline-block";
        $("invGenerar").textContent = "Actualizar enlace";
        $("invEnviar").disabled = false;
    }

    function copiar(texto, botonCopia) {
        var original = botonCopia.textContent;

        function aviso() {
            botonCopia.textContent = "¡Copiado!";
            setTimeout(function () { botonCopia.textContent = original; }, 1500);
        }

        function alternativa() {
            var area = document.createElement("textarea");
            area.value = texto;
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            try { document.execCommand("copy"); aviso(); } catch (e) { /* sin acceso al portapapeles */ }
            document.body.removeChild(area);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(aviso, alternativa);
        } else {
            alternativa();
        }
    }

    function abrirCorreo() {
        if (!generado) return;
        var asunto = "Activación de su cuenta - Sistema de Gestión de Pasantías FIC";
        window.location.href = "mailto:" + encodeURIComponent(generado.correo) +
            "?subject=" + encodeURIComponent(asunto) +
            "&body=" + encodeURIComponent($("invMensaje").value);
    }

    // Sin servidor de correo, "Enviar" deja la invitación registrada
    function enviar() {
        if (!generado) return;

        var guardada = guardarInvitacion({
            token: generado.token,
            correo: generado.correo,
            nombre: generado.nombre,
            plazo: generado.plazoISO,
            fecha: new Date().toISOString(),
            estado: "Enviada"
        });

        if (guardada) {
            mostrarOk("Invitación registrada para " + generado.correo + ". " +
                "Como el prototipo no tiene servidor de correo, use «Abrir en correo» para enviarla.");
            $("invEnviar").disabled = true;
        } else {
            mostrarError("No se pudo registrar la invitación en este navegador.");
        }
    }

    // ---- Eventos --------------------------------------------------------
    boton.addEventListener("click", abrir);
    $("invCerrar").addEventListener("click", cerrar);
    $("invGenerar").addEventListener("click", generar);
    $("invCopiarEnlace").addEventListener("click", function () { copiar($("invEnlace").value, this); });
    $("invCopiarMensaje").addEventListener("click", function () { copiar($("invMensaje").value, this); });
    $("invCorreoBtn").addEventListener("click", abrirCorreo);
    $("invEnviar").addEventListener("click", enviar);

    // Clic fuera del cuadro y tecla Escape cierran la ventana
    modal.addEventListener("click", function (e) { if (e.target === modal) cerrar(); });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modal.style.display === "block") cerrar();
    });
})();