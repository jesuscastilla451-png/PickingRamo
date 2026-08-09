let productos = [];
let baseProductos = [];
let indice = 0;
let sectorActual = "";
let modoPendientes = false;

const baseGuardada = localStorage.getItem("baseProductos");

if(baseGuardada){
    baseProductos = JSON.parse(baseGuardada);
    document.getElementById("estadoBase").innerHTML = "✓ Base cargada";
}
const estadoBase = document.getElementById("estadoBase");

if(baseGuardada){
    estadoBase.innerHTML = "✓ Base cargada";
}

document.getElementById("archivoBase").addEventListener("change", leerBase);
document.getElementById("archivoPicking").addEventListener("change", leerPicking);
document.getElementById("btnCargarPicking").addEventListener("click", function(){

    document.getElementById("modalPicking").style.display = "flex";

});
document.getElementById("btnAceptarPicking").addEventListener("click", function(){

    cargarPickingDesdeTexto();

});

document.getElementById("btnCargarExcelPicking").addEventListener("click", function(){

    document.getElementById("archivoPicking").click();

});

document.getElementById("btnCancelarPicking").addEventListener("click", function(){

    document.getElementById("datosPicking").value = "";
    document.getElementById("modalPicking").style.display = "none";

});
document.getElementById("btnSiguiente").addEventListener("click", siguiente);
document.getElementById("btnAnterior").addEventListener("click", anterior);
document.getElementById("btnNovedad").addEventListener("click", novedad);
document.getElementById("btnPendiente").addEventListener("click", pendiente);
document.getElementById("btnGuardar").addEventListener("click", guardarExcel);
document.getElementById("btnCalcular").addEventListener("click", abrirEmpaque);
document.getElementById("btnCancelarEmpaque").addEventListener("click", cerrarEmpaque);
document.getElementById("btnAceptarEmpaque").addEventListener("click", calcularEmpaque);
document.getElementById("btnDescargarBase").addEventListener("click", descargarBase);

document.getElementById("btnAgregarReferencia").addEventListener("click", function(){

    const referencia = prompt("Ingrese la REFERENCIA nueva:");

    if(referencia === null) return;

    const ref = referencia.trim();

    if(ref === ""){
        alert("⚠️ Debe ingresar una referencia.");
        return;
    }

    agregarReferenciaABase(ref);

});

function descargarBase(){

    if(!baseProductos || baseProductos.length === 0){

        alert(
            "⚠️ No hay una Base cargada para descargar."
        );

        return;
    }

    // Crear una Base limpia con solamente las columnas necesarias
    const datosBase = baseProductos.map(producto => [

        producto["REFERENCIA"] ?? "",
        producto["PRODUCTO"] ?? "",
        producto["SECTOR"] ?? "",
        producto["ORDEN SECTOR"] ?? ""

    ]);

    // Encabezados
    datosBase.unshift([
        "REFERENCIA",
        "PRODUCTO",
        "SECTOR",
        "ORDEN SECTOR"
    ]);

    // Crear hoja de Excel
    const hoja = XLSX.utils.aoa_to_sheet(datosBase);

    // Crear libro
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Base"
    );

    // Descargar
    XLSX.writeFile(
        libro,
        "Base_Picking_Ramo.xlsx"
    );

}

function leerBase(e){

    const archivo = e.target.files[0];

    if(!archivo) return;

    const lector = new FileReader();

    lector.onload = function(evt){

        const datos = new Uint8Array(evt.target.result);

        const libro = XLSX.read(datos,{type:"array"});

        const hoja = libro.Sheets[libro.SheetNames[0]];

        baseProductos = XLSX.utils.sheet_to_json(hoja);

const columnasBase = ["REFERENCIA", "PRODUCTO", "SECTOR", "ORDEN SECTOR"];

const faltantesBase = columnasBase.filter(
    columna => !Object.prototype.hasOwnProperty.call(baseProductos[0] || {}, columna)
);

if(faltantesBase.length > 0){

    alert(
        "⚠️ No se pudo cargar la Base.\n\n" +
        "Faltan estas columnas:\n\n" +
        faltantesBase.join("\n")
    );

    return;

}
// Validar referencias vacías
const referenciasVacias = baseProductos.filter(
    producto => producto["REFERENCIA"] === undefined ||
                producto["REFERENCIA"] === null ||
                producto["REFERENCIA"].toString().trim() === ""
);

if(referenciasVacias.length > 0){

    alert(
        "⚠️ No se pudo cargar la Base.\n\n" +
        "Hay " + referenciasVacias.length +
        " fila(s) sin REFERENCIA."
    );

    return;
}


// Validar referencias duplicadas
const referencias = baseProductos.map(
    producto => producto["REFERENCIA"].toString().trim()
);

const referenciasDuplicadas = referencias.filter(
    (referencia, indice) =>
        referencias.indexOf(referencia) !== indice
);

const duplicadasUnicas = [...new Set(referenciasDuplicadas)];

if(duplicadasUnicas.length > 0){

    alert(
        "⚠️ No se pudo cargar la Base.\n\n" +
        "Hay referencias duplicadas:\n\n" +
        duplicadasUnicas.join("\n")
    );

    return;
}
localStorage.setItem("baseProductos", JSON.stringify(baseProductos));

        productos = [];
        indice = 0;
        sectorActual = "";
        modoPendientes = false;

        document.getElementById("zona").innerHTML = "ZONA";
        document.getElementById("referencia").innerHTML = "";
        document.getElementById("producto").innerHTML = "CARGUE UN ARCHIVO";
        document.getElementById("unidades").innerHTML = "0";

        alert("✅ Base actualizada correctamente.");

        // Ordenar primero por sector y luego por ORDEN SECTOR
        baseProductos.sort((a, b) => {
        
            if(a["SECTOR"] != b["SECTOR"]){
                return a["SECTOR"].localeCompare(b["SECTOR"]);
            }
        
            return parseInt(a["ORDEN SECTOR"]) - parseInt(b["ORDEN SECTOR"]);
        
        });

        indice = 0;

        mostrarProducto();

    };

    lector.readAsArrayBuffer(archivo);

}
function agregarReferenciaABase(referencia){

    const referenciaExiste = baseProductos.some(producto =>
        producto["REFERENCIA"] !== undefined &&
        producto["REFERENCIA"] !== null &&
        producto["REFERENCIA"].toString().trim() === referencia.toString().trim()
    );

    if(referenciaExiste){

        alert(
            "⚠️ La referencia ya existe en la Base.\n\n" +
            "Referencia: " + referencia + "\n\n" +
            "No se puede agregar una referencia duplicada."
        );

        return false;
    }

    const productoNuevo = prompt(
        "Ingrese el nombre del producto para la referencia " + referencia + ":"
    );

    if(productoNuevo === null) return false;

    const sectorNuevo = prompt(
        "Ingrese el SECTOR para la referencia " + referencia + ":\n\n" +
        "A, B o C"
    );

    if(sectorNuevo === null) return false;

    const sector = sectorNuevo.trim().toUpperCase();

    if(sector !== "A" && sector !== "B" && sector !== "C"){

        alert(
            "⚠️ Sector incorrecto.\n\n" +
            "Debe ingresar A, B o C."
        );

        return false;
    }

    const ordenNuevoTexto = prompt(
        "Ingrese el ORDEN SECTOR para la referencia " +
        referencia + ":\n\n" +
        "Ejemplo: 14"
    );

    if(ordenNuevoTexto === null) return false;

    const ordenNuevo = parseInt(ordenNuevoTexto);

    if(isNaN(ordenNuevo) || ordenNuevo <= 0){

        alert(
            "⚠️ Orden incorrecto.\n\n" +
            "Debe ingresar un número mayor que 0."
        );

        return false;
    }

    // Desplazar órdenes dentro del mismo sector
    baseProductos.forEach(producto => {

        if(producto["SECTOR"] === sector){

            const ordenActual = parseInt(producto["ORDEN SECTOR"]);

            if(!isNaN(ordenActual) && ordenActual >= ordenNuevo){

                producto["ORDEN SECTOR"] = ordenActual + 1;

            }
        }
    });

    // Crear nuevo producto
    const nuevoProducto = {

        "REFERENCIA": referencia,
        "PRODUCTO": productoNuevo.trim(),
        "SECTOR": sector,
        "ORDEN SECTOR": ordenNuevo

    };

    baseProductos.push(nuevoProducto);

    // Ordenar Base por SECTOR y ORDEN SECTOR
    baseProductos.sort((a, b) => {

        if(a["SECTOR"] !== b["SECTOR"]){

            return a["SECTOR"].localeCompare(b["SECTOR"]);

        }

        return parseInt(a["ORDEN SECTOR"]) -
               parseInt(b["ORDEN SECTOR"]);

    });

    // Guardar Base actualizada
    localStorage.setItem(
        "baseProductos",
        JSON.stringify(baseProductos)
    );
   


    alert(
        "✅ Referencia agregada correctamente a la Base.\n\n" +
        "Referencia: " + referencia + "\n" +
        "Producto: " + productoNuevo + "\n" +
        "Sector: " + sector + "\n" +
        "Orden sector: " + ordenNuevo
    );

    return true;
}

function leerPicking(e){

    const archivo = e.target.files[0];

    if(!archivo) return;

    const lector = new FileReader();

    lector.onload = function(evt){

        const datos = new Uint8Array(evt.target.result);

        const libro = XLSX.read(datos,{type:"array"});

        const hoja = libro.Sheets[libro.SheetNames[0]];

        productos = XLSX.utils.sheet_to_json(hoja);

// Validar columnas obligatorias del Picking
const columnasPicking = ["ZONA", "REFERENCIA", "UNIDADES"];

const faltantesPicking = columnasPicking.filter(
    columna => !Object.prototype.hasOwnProperty.call(productos[0] || {}, columna)
);

if(faltantesPicking.length > 0){

    alert(
        "⚠️ No se pudo cargar el Picking.\n\n" +
        "Faltan estas columnas:\n\n" +
        faltantesPicking.join("\n")
    );

    return;
}
// Validar datos vacíos del Picking

const filasVaciasPicking = productos.filter((producto) =>
    producto["ZONA"] === undefined ||
    producto["ZONA"] === null ||
    producto["ZONA"].toString().trim() === "" ||

    producto["REFERENCIA"] === undefined ||
    producto["REFERENCIA"] === null ||
    producto["REFERENCIA"].toString().trim() === "" ||

    producto["UNIDADES"] === undefined ||
    producto["UNIDADES"] === null ||
    producto["UNIDADES"].toString().trim() === ""
);

if(filasVaciasPicking.length > 0){

    alert(
        "⚠️ No se pudo cargar el Picking.\n\n" +
        "Hay " + filasVaciasPicking.length +
        " fila(s) con datos vacíos.\n\n" +
        "Verifique las columnas:\n" +
        "ZONA\n" +
        "REFERENCIA\n" +
        "UNIDADES"
    );

    return;
}
// Validar que UNIDADES sea un número válido

const unidadesIncorrectas = productos.filter(producto => {

    const unidades = producto["UNIDADES"];

    return isNaN(unidades) || Number(unidades) <= 0;

});

if(unidadesIncorrectas.length > 0){

    alert(
        "⚠️ No se pudo cargar el Picking.\n\n" +
        "Hay " + unidadesIncorrectas.length +
        " fila(s) con UNIDADES incorrectas.\n\n" +
        "Las unidades deben ser números mayores que 0."
    );

    return;
}

// Unir Picking con la Base y validar referencias
const baseValida = unirBaseConPicking();

if(!baseValida){

    return;
}

alert("✅ Picking cargado correctamente.");

productos.sort((a, b) => {

    if(a["SECTOR"] != b["SECTOR"]){
        return a["SECTOR"].localeCompare(b["SECTOR"]);
    }

    return parseInt(a["ORDEN SECTOR"]) - parseInt(b["ORDEN SECTOR"]);

});

indice = 0;

mostrarProducto();

    };

    document.getElementById("modalPicking").style.display = "none";

    lector.readAsArrayBuffer(archivo);

}

function cargarPickingDesdeTexto(){

    const texto = document.getElementById("datosPicking").value.trim();

    if(!texto){

        alert(
            "⚠️ No se pudo cargar el Picking.\n\n" +
            "Pegue primero los datos de ZONA, REFERENCIA y UNIDADES."
        );

        return;
    }

    // Separar las filas pegadas desde Excel
    const filas = texto.split(/\r?\n/).filter(fila => fila.trim() !== "");

    if(filas.length === 0){

        alert("⚠️ No hay datos para cargar.");

        return;
    }

    // Convertir las filas en productos
    productos = filas.map(fila => {

        const columnas = fila.split("\t");

        return {
            "ZONA": columnas[0] ? columnas[0].trim() : "",
            "REFERENCIA": columnas[1] ? columnas[1].trim() : "",
            "UNIDADES": columnas[2] ? columnas[2].trim() : ""
        };

    });

    // Si la primera fila contiene los encabezados, eliminarla
    const primeraFila = productos[0];

    if(
        primeraFila["ZONA"].toUpperCase() === "ZONA" &&
        primeraFila["REFERENCIA"].toUpperCase() === "REFERENCIA" &&
        primeraFila["UNIDADES"].toUpperCase() === "UNIDADES"
    ){

        productos.shift();
    }

    if(productos.length === 0){

        alert(
            "⚠️ No se encontraron registros para cargar."
        );

        return;
    }

    // Validar datos vacíos
    const filasVaciasPicking = productos.filter(producto =>
        producto["ZONA"] === "" ||
        producto["REFERENCIA"] === "" ||
        producto["UNIDADES"] === ""
    );

    if(filasVaciasPicking.length > 0){

        alert(
            "⚠️ No se pudo cargar el Picking.\n\n" +
            "Hay " + filasVaciasPicking.length +
            " fila(s) con datos vacíos.\n\n" +
            "Verifique las columnas:\n" +
            "ZONA\n" +
            "REFERENCIA\n" +
            "UNIDADES"
        );

        return;
    }

    // Validar unidades
    const unidadesIncorrectas = productos.filter(producto => {

        const unidades = producto["UNIDADES"];

        return isNaN(unidades) || Number(unidades) <= 0;

    });

    if(unidadesIncorrectas.length > 0){

        alert(
            "⚠️ No se pudo cargar el Picking.\n\n" +
            "Hay " + unidadesIncorrectas.length +
            " fila(s) con UNIDADES incorrectas.\n\n" +
            "Las unidades deben ser números mayores que 0."
        );

        return;
    }

    // Unir con la Base y validar referencias
    const baseValida = unirBaseConPicking();

    if(!baseValida){

        return;
    }

    // Cerrar la ventana
    document.getElementById("datosPicking").value = "";
    document.getElementById("modalPicking").style.display = "none";

}

function unirBaseConPicking(){

    for(let i = 0; i < productos.length; i++){

        let referencia = productos[i]["REFERENCIA"];

        let encontrado = baseProductos.find(
            x => x["REFERENCIA"] == referencia
        );

        if(encontrado){

            productos[i]["PRODUCTO"] = encontrado["PRODUCTO"];
            productos[i]["SECTOR"] = encontrado["SECTOR"];
            productos[i]["ORDEN SECTOR"] = encontrado["ORDEN SECTOR"];

        }else{

            const agregar = confirm(
                "⚠️ La referencia " + referencia +
                " no existe en la Base.\n\n" +
                "¿Desea agregarla a la Base?"
            );

            if(!agregar){

                alert(
                    "❌ El Picking no puede continuar.\n\n" +
                    "La referencia " + referencia +
                    " no existe en la Base."
                );

                return false;
            }

            const agregada = agregarReferenciaABase(referencia);

            if(!agregada){

                return false;
            }

            // Buscar nuevamente la referencia después de agregarla
            encontrado = baseProductos.find(
                x => x["REFERENCIA"] == referencia
            );

            if(encontrado){

                productos[i]["PRODUCTO"] = encontrado["PRODUCTO"];
                productos[i]["SECTOR"] = encontrado["SECTOR"];
                productos[i]["ORDEN SECTOR"] = encontrado["ORDEN SECTOR"];

            }else{

                alert(
                    "❌ No se pudo encontrar la referencia recién agregada."
                );

                return false;
            }
        }
    }
    // Volver a sincronizar todo el Picking con la Base actualizada
for(let i = 0; i < productos.length; i++){

    let referencia = productos[i]["REFERENCIA"];

    let encontrado = baseProductos.find(
        x => x["REFERENCIA"] == referencia
    );

    if(encontrado){

        productos[i]["PRODUCTO"] = encontrado["PRODUCTO"];
        productos[i]["SECTOR"] = encontrado["SECTOR"];
        productos[i]["ORDEN SECTOR"] = encontrado["ORDEN SECTOR"];

    }
}
  // Ordenar el Picking por SECTOR y luego por ORDEN SECTOR
    productos.sort((a, b) => {

        if(a["SECTOR"] != b["SECTOR"]){
            return a["SECTOR"].localeCompare(b["SECTOR"]);
        }

        return Number(a["ORDEN SECTOR"]) -
               Number(b["ORDEN SECTOR"]);
    });

    // Reiniciar la posición después de ordenar
    indice = 0;

    // Mostrar nuevamente el primer producto
    mostrarProducto();

    return true;
}

function mostrarProducto(){

    if(productos.length==0) return;

    document.getElementById("zona").innerHTML = productos[indice]["ZONA"];

    document.getElementById("referencia").innerHTML =
"REF: " + productos[indice]["REFERENCIA"];

    document.getElementById("producto").innerHTML = productos[indice]["PRODUCTO"];

    document.getElementById("unidades").innerHTML = productos[indice]["UNIDADES"];

    document.getElementById("progreso").innerHTML = (indice + 1) + " de " + productos.length;

    if(productos[indice]["ESTADO"]=="OK"){

        document.body.style.background="#d4edda";

    }else{

        document.body.style.background="white";

    }
    pintarSectorActivo();
}
function avanzarAlSiguiente(){

    if(modoPendientes){

        for(let i=0; i<productos.length; i++){
    
            if(productos[i]["PENDIENTE"]){
    
                indice = i;
    
                mostrarProducto();
    
                return;
    
            }
    
        }
    
        modoPendientes = false;
    
        alert("🎉 Todos los pendientes fueron resueltos.\n\nPicking finalizado.");
    
        return;
    
    }

    if(sectorActual==""){

        if(indice < productos.length-1){

            indice++;

            mostrarProducto();

        }else{

            alert("✅ Picking terminado.");

        }

        return;

    }

    let ordenActual = parseInt(productos[indice]["ORDEN SECTOR"]);

    let siguiente = -1;
    let menorOrden = Infinity;
    
    for(let i=0; i<productos.length; i++){
    
        if(productos[i]["SECTOR"] != sectorActual)
            continue;
    
        // Saltar productos terminados
        if(productos[i]["ESTADO"] == "OK")
            continue;
    
        // Saltar los que fueron reportados como pendientes
        if(productos[i]["PENDIENTE"])
            continue;
    
        let orden = parseInt(productos[i]["ORDEN SECTOR"]);
    
        if(orden > ordenActual && orden < menorOrden){
    
            menorOrden = orden;
            siguiente = i;
    
        }
    
    }


    if(siguiente != -1){

        indice = siguiente;
        mostrarProducto();
    
    }else{
    
        let pendientes = contarPendientes();
    
        if(pendientes > 0){
    
            if(confirm(
                "⚠ Hay " + pendientes +
                " referencias pendientes.\n\n¿Desea resolverlas ahora?"
            )){
    
                irAPendientes();
    
            }else{
    
                alert("☑ Sector terminado.");
    
            }
    
        }else{
    
            alert("🎉 Sector terminado.\nNo quedan pendientes.");
    
        }
    
    }
}

function siguiente(){

    if(productos.length==0) return;

    // Si era un pendiente, lo elimina
    if(productos[indice]["PENDIENTE"]){

        productos[indice]["PENDIENTE"] = "";

    }

    productos[indice]["ESTADO"] = "OK";
    productos[indice]["FECHA"] = new Date().toLocaleString();
    productos[indice]["USUARIO"] = "Jesus";

    avanzarAlSiguiente();

}
function anterior(){

    if(productos.length==0) return;

    // Si no hay sector seleccionado, funciona normal
    if(sectorActual==""){

        if(indice > 0){
            indice--;
        }

        mostrarProducto();
        return;
    }

    let ordenActual = parseInt(productos[indice]["ORDEN SECTOR"]);

    let anterior = -1;
    let mayorOrden = -1;

    for(let i=0; i<productos.length; i++){

        if(productos[i]["SECTOR"] != sectorActual)
            continue;

        let orden = parseInt(productos[i]["ORDEN SECTOR"]);

        if(orden < ordenActual && orden > mayorOrden){

            mayorOrden = orden;
            anterior = i;

        }

    }

    if(anterior != -1){

        indice = anterior;
        mostrarProducto();

    }else{

        alert("⏮ Ya estás en el primer producto del sector.");

    }

}
function novedad(){

    if(productos.length==0) return;

    let texto = prompt("Escriba la novedad:");

    if(texto==null) return;

    if(texto.trim()=="") return;

    productos[indice]["ESTADO"] = "NOVEDAD";
    productos[indice]["NOVEDAD"] = texto;
    productos[indice]["FECHA"] = new Date().toLocaleString();
    productos[indice]["USUARIO"] = "Jesus";

    avanzarAlSiguiente();

}
function pendiente(){

    if(productos.length==0) return;

    let motivo = prompt(
`Motivo del pendiente:

1. Pasillo bloqueado
2. Reabastecimiento
3. Esperando montacargas
4. Esperando escalera
5. Volver después
6. Otro...`
    );

    if(motivo==null) return;

    if(motivo.trim()=="") return;

    
    productos[indice]["PENDIENTE"] = motivo;
    productos[indice]["FECHA"] = new Date().toLocaleString();
    productos[indice]["USUARIO"] = "Jesus";

    avanzarAlSiguiente();

}
function contarPendientes(){

    let cantidad = 0;

    for(let i=0; i<productos.length; i++){

        if(productos[i]["PENDIENTE"]){

            cantidad++;

        }

    }

    return cantidad;

}
function irAPendientes(){

    for(let i=0; i<productos.length; i++){

        if(productos[i]["PENDIENTE"]){

            modoPendientes = true;

indice = i;

mostrarProducto();

return true;

        }

    }

    return false;

}
function guardarExcel(){

    if(productos.length==0){

        alert("No hay datos para guardar.");

        return;

    }
    let pendientes = contarPendientes();

if(pendientes > 0){

    if(confirm("⚠ Hay " + pendientes + " referencias pendientes.\n\n¿Desea resolverlas antes de guardar?")){

        irAPendientes();
        return;

    }else{

        alert("El archivo NO se guardó.\n\nPrimero debe resolver los pendientes.");
        return;

    }

}

    const hoja = XLSX.utils.json_to_sheet(productos);

    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hoja, "Lista");

    XLSX.writeFile(libro, "Picking Ramo Finalizado.xlsx");

    alert("Excel guardado correctamente.");

}
function cambiarSector(sector){

    if(productos.length==0) return;

    // Buscar el primer producto pendiente del sector,
    // respetando el ORDEN SECTOR
    let candidato = -1;
    let menorOrden = Infinity;

    for(let i=0; i<productos.length; i++){

        if(
            productos[i]["SECTOR"] == sector &&
            productos[i]["ESTADO"] != "OK" &&
            !productos[i]["PENDIENTE"]
        ){

            let orden = parseInt(productos[i]["ORDEN SECTOR"]);

            if(orden < menorOrden){

                menorOrden = orden;
                candidato = i;

            }

        }

    }

    if(candidato >= 0){

        sectorActual = sector;
        pintarSectorActivo();
indice = candidato;

mostrarProducto();

    }else{

        alert("✅ El Sector " + sector + " ya fue terminado.");

    }

}
function pintarSectorActivo(){

    document.getElementById("btnA").style.background="#d9d9d9";
    document.getElementById("btnB").style.background="#d9d9d9";
    document.getElementById("btnC").style.background="#d9d9d9";

    document.getElementById("btnA").style.color="black";
    document.getElementById("btnB").style.color="black";
    document.getElementById("btnC").style.color="black";

    if(sectorActual!=""){

        let boton = document.getElementById("btn"+sectorActual);

        boton.style.background="#28a745";
        boton.style.color="white";

    }

}
function abrirEmpaque(){

    document.getElementById("modalEmpaque").style.display = "flex";

    document.getElementById("txtEmpaque").value = "";

    document.getElementById("resultadoEmpaque").innerHTML = "";

    document.getElementById("txtEmpaque").focus();

}

function cerrarEmpaque(){

    document.getElementById("modalEmpaque").style.display = "none";

    document.getElementById("txtEmpaque").value = "";

    document.getElementById("resultadoEmpaque").innerHTML = "";

}
function calcularEmpaque(){

    let empaque = parseInt(document.getElementById("txtEmpaque").value);

    if(isNaN(empaque) || empaque <= 0){

        alert("Ingrese una cantidad válida.");

        return;

    }

    let unidades = parseInt(productos[indice]["UNIDADES"]);

    let cajas = Math.floor(unidades / empaque);

    let sobrantes = unidades % empaque;

    let resultado = "";

    if(cajas > 0){

        resultado += "📦 " + cajas + " caja(s)<br>";

    }

    if(sobrantes > 0){

        resultado += "➕ " + sobrantes + " unidad(es)";

    }

    if(cajas == 0 && sobrantes == 0){

        resultado = "0";

    }

    document.getElementById("resultadoEmpaque").innerHTML = resultado;

}