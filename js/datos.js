// ---------------------------------------------------------------
// Datos de ejemplo compartidos por docente.html, detalle-docente.html
// y detalle-estudiante.html.
// Un docente se identifica por "id"; un estudiante por "codigo".
// El N° de estudiantes de cada docente se calcula con "docenteId".
// ---------------------------------------------------------------

const DOCENTES = [

    {
        id: 1,
        nombre: "Juan Pérez",
        codigo: "DOC-001",
        correo: "juan.perez@unicauca.edu.co",
        cargo: "Profesor Titular",
        estado: "Activo",
        historial: [
            "05/02/2026 - Asignado como tutor docente de Camila Ortiz.",
            "31/08/2026 - Cierre de la práctica de Camila Ortiz.",
            "01/09/2026 - Asignado como tutor docente de Laura Mejía.",
            "15/09/2026 - Primera visita de seguimiento a Constructora Andina."
        ],
        observaciones: [
            { fecha: "20/09/2026", texto: "Excelente disposición para el acompañamiento de los estudiantes." },
            { fecha: "05/09/2026", texto: "Entrega los informes de seguimiento a tiempo." }
        ]
    },

    {
        id: 2,
        nombre: "Claudia Ramírez",
        codigo: "DOC-002",
        correo: "claudia.ramirez@unicauca.edu.co",
        cargo: "Profesora Asociada",
        estado: "Activo",
        historial: [
            "01/08/2026 - Vinculada como docente tutora del programa.",
            "03/11/2026 - Asignada como tutora docente de Andrés Peña."
        ],
        observaciones: []
    },

    {
        id: 3,
        nombre: "Hernán Salazar",
        codigo: "DOC-003",
        correo: "hernan.salazar@unicauca.edu.co",
        cargo: "Docente Catedrático",
        estado: "Inactivo",
        historial: [
            "01/03/2025 - Vinculado como docente tutor del programa.",
            "30/06/2026 - Retirado temporalmente del programa de prácticas."
        ],
        observaciones: [
            { fecha: "30/06/2026", texto: "Inactivo por licencia académica. Sin estudiantes asignados." }
        ]
    }

];

const ESTUDIANTES = [

    {
        codigo: "10456789",
        nombre: "Laura Mejía",
        programa: "Ingeniería Civil",
        estado: "En práctica",
        empresa: "Constructora Andina",
        supervisor: "Carlos Gómez",
        docenteId: 1,
        inicio: "01/09/2026",
        fin: "28/02/2027",
        pasos: ["✅", "✅", "✅", "🟡", "⬜", "⬜"],
        novedades: [],
        historial: [
            "15/08/2026 - Solicitud de práctica registrada.",
            "20/08/2026 - Carta de presentación emitida.",
            "01/09/2026 - Empresa asignada.",
            "03/09/2026 - ARL validada.",
            "10/09/2026 - En espera de resolución."
        ]
    },

    {
        codigo: "10478123",
        nombre: "Andrés Peña",
        programa: "Ingeniería Civil",
        estado: "Buscando práctica",
        empresa: "No asignada",
        supervisor: "—",
        docenteId: 2,
        inicio: "Por definir",
        fin: "Por definir",
        pasos: ["🟡", "⬜", "⬜", "⬜", "⬜", "⬜"],
        novedades: [],
        historial: [
            "28/10/2026 - Solicitud de práctica registrada.",
            "03/11/2026 - Tutor docente asignado.",
            "03/11/2026 - En espera de carta de presentación."
        ]
    },

    {
        codigo: "10412345",
        nombre: "Camila Ortiz",
        programa: "Ingeniería Civil",
        estado: "Finalizado",
        empresa: "Ingeniería y Obras del Sur",
        supervisor: "Martha Rojas",
        docenteId: 1,
        inicio: "01/03/2026",
        fin: "31/08/2026",
        pasos: ["✅", "✅", "✅", "✅", "✅", "✅"],
        novedades: [],
        historial: [
            "10/02/2026 - Solicitud de práctica registrada.",
            "15/02/2026 - Carta de presentación emitida.",
            "01/03/2026 - Empresa asignada e inicio de práctica.",
            "31/08/2026 - Informe final entregado.",
            "15/09/2026 - Certificación emitida."
        ]
    }

];

const CLASE_ESTADO_ESTUDIANTE = {
    "En práctica":       "badge bg-success",
    "Buscando práctica": "badge bg-warning text-dark",
    "Finalizado":        "badge bg-secondary"
};

const CLASE_ESTADO_DOCENTE = {
    "Activo":   "badge bg-success",
    "Inactivo": "badge bg-secondary"
};

function buscarDocente(id){
    return DOCENTES.find(function(d){ return d.id === id; }) || null;
}

function buscarEstudiante(codigo){
    return ESTUDIANTES.find(function(e){ return e.codigo === codigo; }) || null;
}

function estudiantesDeDocente(id){
    return ESTUDIANTES.filter(function(e){ return e.docenteId === id; });
}
