/*
 * Botón "Enviar enlace de registro" para empresas.html
 *
 * Uso en empresas.html:
 *   <button id="btnInvitarEmpresa" class="btn btn-primary">Enviar enlace de registro</button>
 *   ...
 *   <script src="js/enviar-enlace.js"></script>   (antes de </body>)
 *
 * Flujo: la empresa escribió por correo -> la Unidad de Pasantías le envía este enlace ->
 * la empresa abre subir-documentos.html, diligencia sus datos y carga los documentos.
 *
 * SIMULACIÓN: el enlace se genera en el navegador y no se valida en ningún servidor;
 * el correo se abre en el programa de correo del usuario, no sale solo.
 * Con backend: el token debe generarse, guardarse y validarse en el servidor.
 */

(function () {

    const boton = document.getElementById("btnInvitarEmpresa");
    if (!boton) return;

    const CORREO_UNIDAD = "pasantiasfic@unicauca.edu.co";

    function generarToken() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, function (b) {
            return b.toString(16).padStart(2, "0");
        }).join("");
    }

    function fechaISO(fecha) {
        return fecha.toISOString().slice(0, 10);
    }

    function formatoFecha(fecha) {
        return fecha.toLocaleDateString("es-CO", {
            day: "numeric", month: "long", year: "numeric"
        });
    }

    function construirEnlace(token, correo, plazoTexto) {
        const url = new URL("subir-documentos.html", window.location.href);
        url.searchParams.set("token", token);
        url.searchParams.set("correo", correo);
        url.searchParams.set("plazo", plazoTexto);
        return url.toString();
    }

    function construirMensaje(contacto, enlace, plazoTexto) {
        return "Cordial saludo" + (contacto ? ", " + contacto : "") + ":\n\n" +
            "Recibimos su solicitud para participar como entidad receptora de pasantías de la " +
            "Facultad de Ingeniería Civil de la Universidad del Cauca. Para iniciar el registro, " +
            "ingrese al siguiente enlace, diligencie los datos de la empresa y cargue los " +
            "documentos requeridos:\n\n" +
            enlace + "\n\n" +
            "Documentos requeridos (en PDF):\n" +
            "1) Cámara de Comercio (persona jurídica) o RUT actualizado (persona natural).\n" +
            "2) Documento de representación legal.\n" +
            "3) Supervisor designado, con nombre y cédula.\n" +
            "4) Compromiso de afiliación ARL del estudiante al nivel de riesgo correspondiente.\n" +
            "5) Certificado SST.\n\n" +
            "Plazo para completar el registro: " + plazoTexto + ".\n" +
            "Dudas: " + CORREO_UNIDAD + "\n\n" +
            "Universidad del Cauca - Facultad de Ingeniería Civil";
    }

    function crearModal() {

        const fondo = document.createElement("div");
        fondo.style.cssText =
            "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;" +
            "display:flex;align-items:center;justify-content:center;padding:15px;";

        fondo.innerHTML =
            '<div class="card" style="width:100%;max-width:680px;max-height:90vh;overflow:auto;">' +
              '<div class="card-header d-flex justify-content-between align-items-center">' +
                '<span>Enviar enlace de registro a una empresa</span>' +
                '<button type="button" class="btn-close" aria-label="Cerrar" data-cerrar></button>' +
              '</div>' +
              '<div class="card-body">' +
                '<div class="row g-3 mb-3">' +
                  '<div class="col-md-6">' +
                    '<label class="form-label">Correo de la empresa *</label>' +
                    '<input type="email" class="form-control" id="invCorreo" placeholder="contacto@empresa.com">' +
                  '</div>' +
                  '<div class="col-md-6">' +
                    '<label class="form-label">Nombre del contacto o la empresa</label>' +
                    '<input type="text" class="form-control" id="invContacto" placeholder="Opcional">' +
                  '</div>' +
                  '<div class="col-md-6">' +
                    '<label class="form-label">Plazo para completar el registro</label>' +
                    '<input type="date" class="form-control" id="invPlazo">' +
                  '</div>' +
                '</div>' +
                '<div id="invError" class="alert alert-danger py-2" style="display:none;"></div>' +
                '<div id="invResultado" style="display:none;">' +
                  '<div class="mb-3">' +
                    '<label class="form-label">Enlace único</label>' +
                    '<div class="input-group">' +
                      '<input type="text" class="form-control" id="invUrl" readonly>' +
                      '<button class="btn btn-outline-secondary" type="button" id="btnCopiarEnlace">Copiar</button>' +
                    '</div>' +
                  '</div>' +
                  '<div class="mb-3">' +
                    '<label class="form-label">Mensaje</label>' +
                    '<textarea class="form-control" id="invMensaje" rows="12"></textarea>' +
                  '</div>' +
                  '<div id="invAviso" class="alert alert-success py-2" style="display:none;"></div>' +
                '</div>' +
                '<div class="d-flex flex-wrap gap-2">' +
                  '<button type="button" class="btn btn-primary" id="btnGenerar">Generar enlace</button>' +
                  '<button type="button" class="btn btn-outline-primary" id="btnCopiarMensaje" style="display:none;">Copiar mensaje</button>' +
                  '<button type="button" class="btn btn-success" id="btnAbrirCorreo" style="display:none;">Abrir en correo</button>' +
                  '<button type="button" class="btn btn-secondary ms-auto" data-cerrar>Enviar</button>' +
                '</div>' +
              '</div>' +
            '</div>';

        document.body.appendChild(fondo);
        return fondo;
    }

    boton.addEventListener("click", function () {

        const modal = crearModal();
        const $ = function (id) { return modal.querySelector("#" + id); };

        const porDefecto = new Date();
        porDefecto.setDate(porDefecto.getDate() + 10);
        $("invPlazo").value = fechaISO(porDefecto);

        let token = null;

        function avisar(texto) {
            $("invAviso").textContent = texto;
            $("invAviso").style.display = "block";
        }

        function copiar(texto, mensaje) {
            navigator.clipboard.writeText(texto).then(
                function () { avisar(mensaje); },
                function () { avisar("No se pudo copiar automáticamente. Selecciónelo y cópielo a mano."); }
            );
        }

        function generar() {

            const correo = $("invCorreo").value.trim();
            const contacto = $("invContacto").value.trim();
            const fecha = new Date($("invPlazo").value + "T12:00:00");
            const error = $("invError");

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                error.textContent = "Escriba un correo válido para la empresa.";
                error.style.display = "block";
                return;
            }

            error.style.display = "none";

            if (!token) token = generarToken();

            const plazoTexto = isNaN(fecha) ? "por definir" : formatoFecha(fecha);
            const enlace = construirEnlace(token, correo, plazoTexto);

            $("invUrl").value = enlace;
            $("invMensaje").value = construirMensaje(contacto, enlace, plazoTexto);
            $("invResultado").style.display = "block";
            $("btnCopiarMensaje").style.display = "inline-block";
            $("btnAbrirCorreo").style.display = "inline-block";
            $("btnGenerar").textContent = "Actualizar enlace";

            // Registro de la invitación (simulación)
            try {
                const lista = JSON.parse(localStorage.getItem("invitaciones_empresas") || "[]");
                const i = lista.findIndex(function (x) { return x.token === token; });
                const registro = { token: token, correo: correo, contacto: contacto,
                                   plazo: plazoTexto, fecha: new Date().toISOString() };
                if (i >= 0) lista[i] = registro; else lista.push(registro);
                localStorage.setItem("invitaciones_empresas", JSON.stringify(lista));
            } catch (e) {}
        }

        $("btnGenerar").addEventListener("click", generar);

        $("btnCopiarEnlace").addEventListener("click", function () {
            copiar($("invUrl").value, "Enlace copiado.");
        });

        $("btnCopiarMensaje").addEventListener("click", function () {
            copiar($("invMensaje").value, "Mensaje copiado.");
        });

        $("btnAbrirCorreo").addEventListener("click", function () {
            const asunto = "Registro de su empresa – Pasantías FIC, Universidad del Cauca";
            window.location.href = "mailto:" + encodeURIComponent($("invCorreo").value.trim()) +
                "?subject=" + encodeURIComponent(asunto) +
                "&body=" + encodeURIComponent($("invMensaje").value);
        });

        modal.querySelectorAll("[data-cerrar]").forEach(function (b) {
            b.addEventListener("click", function () { modal.remove(); });
        });

        modal.addEventListener("click", function (e) {
            if (e.target === modal) modal.remove();
        });
    });

})();