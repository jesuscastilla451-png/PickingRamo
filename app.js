let pickings=[], pickingActualIndex=-1, productos=[], baseProductos=[], indice=0, sectorActual="", modoPendientes=false;

const BASE_KEY="baseProductos";
const PICKINGS_KEY="pickingCola";
const ACTIVE_PICKING_KEY="pickingActivo";
const APP_NAME_KEY="pickingAppName";

const $=id=>document.getElementById(id);

function esc(v){
    return String(v??"")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function ordenarBase(){
    baseProductos.sort((a,b)=>
        String(a.SECTOR).localeCompare(String(b.SECTOR)) ||
        Number(a["ORDEN SECTOR"])-Number(b["ORDEN SECTOR"])
    );
}

function ordenarPicking(a){
    a.sort((x,y)=>
        String(x.SECTOR).localeCompare(String(y.SECTOR)) ||
        Number(x["ORDEN SECTOR"])-Number(y["ORDEN SECTOR"])
    );
}

function guardarCola(){
    localStorage.setItem(PICKINGS_KEY,JSON.stringify(pickings));
}

function sync(){
    if(pickingActualIndex>=0 && pickings[pickingActualIndex]){
        pickings[pickingActualIndex].productos=productos;
        pickings[pickingActualIndex].indice=indice;
        pickings[pickingActualIndex].sectorActual=sectorActual;
        pickings[pickingActualIndex].modoPendientes=modoPendientes;

        guardarCola();
    }
}

function estado(p){
    let a=p.productos||[];
    let pend=a.filter(x=>x.PENDIENTE).length;

    return a.length &&
           a.every(x=>x.ESTADO==="OK"||x.ESTADO==="NOVEDAD") &&
           pend===0
        ? "TERMINADO"
        : pend
        ? "PENDIENTES"
        : "EN PROCESO";
}

function actualizar(){

    /*
       =====================================================
       PICKING ACTIVO
       =====================================================
    */

    let p=
        pickings[pickingActualIndex];


    /*
       =====================================================
       NO HAY PICKING ACTIVO
       =====================================================
    */

    if(!p){

        $("estadoPickings").textContent="";
        $("pickingActualNombre").textContent="";
        $("pickingActualNombre").style.display="none";

        return;
    }


    /*
       =====================================================
       PICKING MODERNO
       =====================================================

       AQUÍ TENEMOS DOS NIVELES:

       PICKING = CONDUCTOR

       ACTIVO = PEDIDO DEL CONDUCTOR


       Ejemplo:

       Picking 1 → Rogelio → 3 pedidos

       Activo 1 de 3
       Activo 2 de 3
       Activo 3 de 3


       Luego:

       Picking 2 → José → 1 pedido

       Activo 1 de 1
    */

    if(
        p.tipo==="MODERNO_CONDUCTOR"
    ){

        /*
           Buscar el padre MODERNO.
        */

        let padre=
            pickings.find(
                x=>
                    x.tipo==="MODERNO" &&
                    x.nombre===p.padre
            );


        if(
            !padre ||
            !padre.moderno ||
            !padre.moderno.conductores
        ){

            $("estadoPickings").textContent=
                "📂 Picking: ? | Activo: ?";

            $("pickingActualNombre").textContent="";
            $("pickingActualNombre").style.display="none";

            return;
        }


        /*
           =================================================
           OBTENER TODOS LOS CONDUCTORES
           =================================================
        */

        let conductores=
            Object.values(
                padre.moderno.conductores
            );


        /*
           =================================================
           BUSCAR EL CONDUCTOR ACTUAL
           =================================================

           El conductor determina el número de PICKING.
        */

        let posicionConductor=
            conductores.findIndex(
                c=>
                    String(c.nombre)
                        .trim()
                        .toUpperCase()===
                    String(p.conductor)
                        .trim()
                        .toUpperCase()
            );


        /*
           =================================================
           OBTENER LOS PEDIDOS DEL CONDUCTOR
           =================================================
        */

        let conductorActual=
            posicionConductor>=0
            ?conductores[posicionConductor]
            :null;


        let pedidos=
            conductorActual &&
            conductorActual.pedidos
            ?Object.values(
                conductorActual.pedidos
            )
            :[];


        /*
           =================================================
           BUSCAR EL PEDIDO ACTUAL
           =================================================

           El pedido determina:

           Activo X de Y
        */

        let posicionPedido=
            pedidos.findIndex(
                pedido=>
                    String(pedido.id)===
                    String(p.pedidoId)
            );


        /*
           =================================================
           MOSTRAR CONTADOR MODERNO
           =================================================
        */

        if(
            posicionConductor>=0 &&
            posicionPedido>=0
        ){

            $("estadoPickings").textContent=
                `📂 Picking: ${posicionConductor+1} | Activo: ${posicionPedido+1} de ${pedidos.length}`;

        }else{

            $("estadoPickings").textContent=
                `📂 Picking: ${posicionConductor+1} | Activo: 0 de ${pedidos.length}`;

        }


        $("pickingActualNombre").textContent="";
        $("pickingActualNombre").style.display="none";

        return;
    }


    /*
       =====================================================
       PICKING NORMAL
       =====================================================

       Esta parte NO cambia la lógica de Tradicional /
       Picking por Zona.
    */

    let pickingsNormales=
        pickings.filter(
            x=>
                x.tipo!=="MODERNO" &&
                x.tipo!=="MODERNO_CONDUCTOR"
        );


    let total=
        pickingsNormales.length;


    if(!total){

        $("estadoPickings").textContent="";
        $("pickingActualNombre").textContent="";
        $("pickingActualNombre").style.display="none";

        return;
    }


    let posicion=
        pickingsNormales.indexOf(p);


    if(posicion>=0){

        $("estadoPickings").textContent=
            `📂 Pickings: ${total} | Activo: ${posicion+1} de ${total}`;

    }else{

        $("estadoPickings").textContent=
            `📂 Pickings: ${total} | Activo: 0 de ${total}`;

    }


    $("pickingActualNombre").textContent="";
    $("pickingActualNombre").style.display="none";
}

function cargarEn(i){

    if(!pickings[i]) return;

    sync();

    pickingActualIndex=i;

    localStorage.setItem(
        ACTIVE_PICKING_KEY,
        String(i)
    );

    let p=pickings[i];

    productos=p.productos||[];
    indice=p.indice||0;
    sectorActual=p.sectorActual||"";
    modoPendientes=!!p.modoPendientes;

    if(indice>=productos.length){
        indice=Math.max(0,productos.length-1);
    }

    mostrar();
}

function mostrar(){

    let pa=pickings[pickingActualIndex];

    if($("modernoInfo")){

        $("modernoInfo").style.display=
            (pa&&pa.tipo==="MODERNO_CONDUCTOR")
            ?"block"
            :"none";

        if(pa&&pa.tipo==="MODERNO_CONDUCTOR"){
            $("modernoInfo").textContent=
                "🚚 "+pa.conductor+
                " | Cliente: "+
                (productos[indice]?.CLIENTE||"");
        }
    }

    if(!productos.length){

        $("zona").textContent="ZONA";
        $("referencia").textContent="";
        $("producto").textContent="CARGUE UN PICKING";
        $("unidades").textContent="0";
        $("progreso").textContent="0 de 0";

        document.body.style.background="white";

        actualizar();

        return;
    }

    indice=Math.max(
        0,
        Math.min(indice,productos.length-1)
    );

    $("zona").textContent=productos[indice].ZONA||"";
    $("referencia").textContent="REF: "+(productos[indice].REFERENCIA||"");
    $("producto").textContent=productos[indice].PRODUCTO||"";
    $("unidades").textContent=productos[indice].UNIDADES||"0";

    $("progreso").textContent=
        `${indice+1} de ${productos.length}`;

    document.body.style.background=
        productos[indice].ESTADO==="OK"
        ?" #d4edda".trim()
        :"white";

    pintarSectorActivo();
    actualizar();
    sync();
}

function validar(a){

    let f=[
        "ZONA",
        "REFERENCIA",
        "UNIDADES"
    ].filter(c=>!Object.hasOwn(a[0]||{},c));

    if(f.length){

        alert(
            "⚠️ Faltan columnas:\n\n"+
            f.join("\n")
        );

        return false;
    }

    let v=a.filter(p=>
        !String(p.ZONA??"").trim() ||
        !String(p.REFERENCIA??"").trim() ||
        !String(p.UNIDADES??"").trim()
    );

    if(v.length){

        alert(
            "⚠️ Hay "+
            v.length+
            " fila(s) con datos vacíos."
        );

        return false;
    }

    let u=a.filter(p=>
        isNaN(p.UNIDADES) ||
        Number(p.UNIDADES)<=0
    );

    if(u.length){

        alert(
            "⚠️ Hay "+
            u.length+
            " fila(s) con UNIDADES incorrectas."
        );

        return false;
    }

    return true;
}

function unirBase(a){

    for(let i=0;i<a.length;i++){

        let r=String(a[i].REFERENCIA).trim();

        let f=baseProductos.find(
            x=>String(x.REFERENCIA).trim()===r
        );

        if(!f){

            if(!confirm(
                "⚠️ La referencia "+
                r+
                " no existe en la Base.\n\n"+
                "¿Desea agregarla a la Base?"
            )){
                return false;
            }

            abrirNueva(r,true);

            return false;
        }

        a[i].PRODUCTO=f.PRODUCTO;
        a[i].SECTOR=f.SECTOR;
        a[i]["ORDEN SECTOR"]=f["ORDEN SECTOR"];
    }

    ordenarPicking(a);

    return true;
}

function guardarNueva(){

    let r=$("txtNuevaReferencia").value.trim();
    let pr=$("txtNuevoProducto").value.trim();
    let s=$("selNuevoSector").value;
    let o=parseInt($("txtNuevoOrden").value);

    if(!r||!pr){

        alert(
            "⚠️ Complete REFERENCIA y PRODUCTO."
        );

        return;
    }

    if(!s||isNaN(o)||o<=0){

        alert(
            "⚠️ Seleccione sector y un orden válido."
        );

        return;
    }

    if(baseProductos.some(
        x=>String(x.REFERENCIA).trim()===r
    )){

        alert(
            "⚠️ La referencia ya existe."
        );

        return;
    }

    baseProductos.forEach(x=>{

        if(
            String(x.SECTOR).toUpperCase()===s &&
            Number(x["ORDEN SECTOR"])>=o
        ){
            x["ORDEN SECTOR"]=
                Number(x["ORDEN SECTOR"])+1;
        }

    });

    baseProductos.push({
        REFERENCIA:r,
        PRODUCTO:pr,
        SECTOR:s,
        "ORDEN SECTOR":o
    });

    ordenarBase();

    localStorage.setItem(
        BASE_KEY,
        JSON.stringify(baseProductos)
    );

    $("modalAgregarReferencia").style.display="none";

    alert(
        "✅ Referencia agregada correctamente."
    );

    if(
        $("modalAgregarReferencia").dataset.desdePicking==="1"
    ){
        continuarCargaPendiente(r);
    }
}

let cargaPendiente=null;
let colaCarga=[];

function continuarCargaPendiente(ref){

    if(!cargaPendiente) return;

    let f=baseProductos.find(
        x=>String(x.REFERENCIA).trim()===ref
    );

    if(f){

        cargaPendiente.a[cargaPendiente.i].PRODUCTO=f.PRODUCTO;
        cargaPendiente.a[cargaPendiente.i].SECTOR=f.SECTOR;
        cargaPendiente.a[cargaPendiente.i]["ORDEN SECTOR"]=
            f["ORDEN SECTOR"];
    }

    cargaPendiente.i++;

    procesarReferenciasPendientes();
}

function procesarReferenciasPendientes(){

    if(!cargaPendiente) return;

    let c=cargaPendiente;

    if(c.i>=c.a.length){

        finalizarCargaActual();

        if(pickingActualIndex<0 && pickings.length){

            cargarEn(pickings.length-1);

        }else{

            actualizar();

        }

        return;
    }

    let i=c.i;

    let r=String(
        c.a[i].REFERENCIA
    ).trim();

    let f=baseProductos.find(
        x=>String(x.REFERENCIA).trim()===r
    );

    if(f){

        c.a[i].PRODUCTO=f.PRODUCTO;
        c.a[i].SECTOR=f.SECTOR;
        c.a[i]["ORDEN SECTOR"]=f["ORDEN SECTOR"];

        c.i++;

        procesarReferenciasPendientes();

        return;
    }

    cargaPendiente.i=i;

    abrirNueva(r,true);
}

function abrirNueva(r="",desde=false){

    $("txtNuevaReferencia").value=r;
    $("txtNuevoProducto").value="";
    $("selNuevoSector").value="";
    $("txtNuevoOrden").value="";

    $("referenciaNuevaInfo").innerHTML=
        r
        ?"⚠️ Referencia nueva: <strong>"+
            esc(r)+
            "</strong>"
        :"Agregue una referencia a la Base.";

    $("modalAgregarReferencia").dataset.desdePicking=
        desde?"1":"0";

    $("modalAgregarReferencia").style.display="flex";

    
}

function mostrarBase(){

    let f=$("buscarBase").value
        .toLowerCase()
        .trim();

    let rows=baseProductos
        .filter(p=>
            !f ||
            [
                p.SECTOR,
                p["ORDEN SECTOR"],
                p.REFERENCIA,
                p.PRODUCTO
            ]
            .join(" ")
            .toLowerCase()
            .includes(f)
        )
        .map(p=>
            `<tr>
                <td>${esc(p.SECTOR)}</td>
                <td>${esc(p["ORDEN SECTOR"])}</td>
                <td>${esc(p.REFERENCIA)}</td>
                <td>${esc(p.PRODUCTO)}</td>
            </tr>`
        )
        .join("");

    $("tablaBase").innerHTML=
        `<table>
            <thead>
                <tr>
                    <th>Sector</th>
                    <th>Orden</th>
                    <th>Referencia</th>
                    <th>Producto</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function abrirBase(){

    if(!baseProductos.length){

        alert(
            "⚠️ No hay Base cargada."
        );

        return;
    }

    $("buscarBase").value="";
    mostrarBase();
    $("modalBase").style.display="flex";
    $("modalBase").style.zIndex="10001";
}

function textoDatos(t){

    let a=t.trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .map(x=>{

            let c=x.split("\t");

            return {
                ZONA:(c[0]||"").trim(),
                REFERENCIA:(c[1]||"").trim(),
                UNIDADES:(c[2]||"").trim()
            };
        });

    if(
        a[0] &&
        a[0].ZONA.toUpperCase()==="ZONA" &&
        a[0].REFERENCIA.toUpperCase()==="REFERENCIA"
    ){
        a.shift();
    }

    return a;
}

function bloque(){

    let d=document.createElement("div");

    d.className="bloque-picking";

    d.innerHTML=
        `<strong>📋 Picking</strong>
        <input
            class="nombre-bloque"
            placeholder="Nombre del Picking (opcional)"
        >
        <textarea
            class="datos-bloque"
            placeholder="ZONA\tREFERENCIA\tUNIDADES"
        ></textarea>
        <button
            type="button"
            class="quitar"
        >🗑️ Quitar</button>`;

    d.querySelector(".quitar").onclick=()=>d.remove();

    $("listaBloquesPicking").appendChild(d);
}

function abrirCarga(){

    $("listaBloquesPicking").innerHTML="";

    bloque();

    $("modalPicking").style.display="flex";
}

function iniciarColaCarga(){

    if(cargaPendiente || !colaCarga.length){
        return;
    }

    cargaPendiente=colaCarga.shift();

    procesarReferenciasPendientes();
}

function finalizarCargaActual(){

    if(!cargaPendiente) return;

    let c=cargaPendiente;

    ordenarPicking(c.a);

    pickings.push({

        nombre:c.nombre,

        productos:c.a,

        indice:0,

        sectorActual:"",

        modoPendientes:false,

        creado:new Date().toLocaleString()
    });

    guardarCola();

    cargaPendiente=null;

    iniciarColaCarga();

    actualizar();
}

function cargarBloques(){

    let bloques=[
        ...document.querySelectorAll(
            ".bloque-picking"
        )
    ];

    let trabajos=[];

    for(let x of bloques){

        let t=x.querySelector(
            ".datos-bloque"
        ).value.trim();

        if(!t) continue;

        let a=textoDatos(t);

        if(!validar(a)){
            return;
        }

        let nombre=
            x.querySelector(
                ".nombre-bloque"
            ).value.trim() ||
            "Picking "+
            (pickings.length+
             trabajos.length+
             1);

        trabajos.push({
            a:a,
            nombre:nombre,
            i:0
        });
    }

    if(!trabajos.length){

        alert(
            "⚠️ Agrega datos a uno o más Pickings."
        );

        return;
    }

    colaCarga.push(...trabajos);

    $("modalPicking").style.display="none";

    iniciarColaCarga();
}

function leerExcel(files){

    let archivos=[...files];

    if(!archivos.length) return;

    let pendientes=archivos.length;

    archivos.forEach(file=>{

        let r=new FileReader();

        r.onload=e=>{

            try{

                let libro=XLSX.read(
                    new Uint8Array(
                        e.target.result
                    ),
                    {type:"array"}
                );

                let a=XLSX.utils.sheet_to_json(
                    libro.Sheets[
                        libro.SheetNames[0]
                    ]
                );

                if(validar(a)){

                    colaCarga.push({

                        a:a,

                        nombre:file.name.replace(
                            /\.(xlsx|xls)$/i,
                            ""
                        ),

                        i:0
                    });
                }

            }catch(err){

                alert(
                    "❌ No se pudo leer: "+
                    file.name
                );
            }

            pendientes--;

            if(pendientes===0){

                $("modalPicking").style.display="none";

                iniciarColaCarga();
            }
        };

        r.readAsArrayBuffer(file);
    });

    $("archivoPicking").value="";
}

function listaPickings(selector=false){

    let c=$(
        selector
        ?"listaElegirPicking"
        :"listaPickings"
    );

    c.innerHTML="";

    if(!pickings.length){

        c.innerHTML=
            "<p>No hay Pickings cargados.</p>";

        return;
    }

    /*
       =====================================================
       FUNCIÓN PARA MOSTRAR UN PICKING NORMAL
       =====================================================
    */

    function mostrarPickingNormal(p,i){

        let e=estado(p);

        let d=document.createElement("div");

        d.className=
            "tarjeta-picking "+
            (i===pickingActualIndex
                ?"activo "
                :"")+
            (e==="TERMINADO"
                ?"terminado"
                :"");

        d.innerHTML=
            `<strong>
                ${i+1}. ${esc(p.nombre)}
            </strong>
            <br>
            <span class="${
                e==="TERMINADO"
                ?"estado-verde"
                :e==="PENDIENTES"
                ?"estado-amarillo"
                :"estado-azul"
            }">${e}</span>
            <br>
            Referencias: ${p.productos.length}
            |
            Pendientes:
            ${p.productos.filter(
                x=>x.PENDIENTE
            ).length}`;

        let b=document.createElement("button");

        b.textContent=
            i===pickingActualIndex
            ?"ACTIVO"
            :"ABRIR";

        b.disabled=
            i===pickingActualIndex;

        b.onclick=()=>{

            cargarEn(i);

            if(selector){

                $("modalElegirPicking")
                    .style.display="none";

            }else{

                $("modalListaPickings")
                    .style.display="none";
            }
        };

        d.appendChild(b);

        c.appendChild(d);
    }


    /*
       =====================================================
       PICKINGS NORMALES
       =====================================================
    */

    pickings.forEach((p,i)=>{

        /*
           El Picking Moderno tipo MODERNO es solamente
           el padre/contendedor.

           No lo mostramos como Picking independiente.
        */

           if(
            p.tipo==="MODERNO" ||
            p.tipo==="MODERNO_CONDUCTOR"
        ){
        
            return;
        }

        /*
           Los Pickings Moderno - CONDUCTOR son pedidos
           individuales y sí se pueden mostrar.
        */

        mostrarPickingNormal(p,i);

    });


    /*
       =====================================================
       PICKING MODERNO
       =====================================================
    */

    let padresModernos=
        pickings.filter(
            p=>p.tipo==="MODERNO"
        );

    padresModernos.forEach(parent=>{

        let moderno=
            parent.moderno;

        if(!moderno ||
           !moderno.conductores){

            return;
        }

        /*
           Encabezado del bloque Moderno
        */

        let titulo=document.createElement(
            "div"
        );

        titulo.style.marginTop="12px";

        titulo.innerHTML=
            "<h3>🚚 Picking Moderno</h3>";

        c.appendChild(titulo);


        /*
           Cada conductor
        */

        Object.values(
            moderno.conductores
        ).forEach(conductor=>{

            let pedidos=
                Object.values(
                    conductor.pedidos||{}
                );

            if(!pedidos.length){
                return;
            }

            let bloqueConductor=
                document.createElement(
                    "div"
                );

            bloqueConductor.className=
                "tarjeta-picking";

            /*
               Contar estado de los pedidos
            */

            let terminados=0;

            let enProceso=0;

            let pendientes=0;

            pedidos.forEach(pedido=>{

                let hijo=
                    pickings.find(
                        x=>
                            x.tipo===
                                "MODERNO_CONDUCTOR" &&
                            x.padre===
                                parent.nombre &&
                            x.conductor===
                                conductor.nombre &&
                            x.pedidoId===
                                pedido.id
                    );

                if(!hijo){

                    pendientes++;

                    return;
                }

                let ep=
                    estado(hijo);

                if(ep==="TERMINADO"){

                    terminados++;

                }else{

                    enProceso++;
                }

            });

            let estadoConductor=
                terminados===pedidos.length
                ?"TERMINADO"
                :enProceso>0
                ?"EN PROCESO"
                :"PENDIENTE";

            bloqueConductor.innerHTML=
                `<strong>
                    🚚 ${esc(conductor.nombre)}
                </strong>
                <br>
                <span class="${
                    estadoConductor==="TERMINADO"
                    ?"estado-verde"
                    :estadoConductor==="PENDIENTE"
                    ?"estado-amarillo"
                    :"estado-azul"
                }">
                    ${estadoConductor}
                </span>
                <br>
                Pedidos: ${pedidos.length}
                |
                Terminados: ${terminados}
                |
                Pendientes: ${pendientes}`;

            /*
               =============================================
               MOSTRAR CADA PEDIDO
               =============================================
            */

            pedidos.forEach((pedido,numero)=>{

                let hijo=
                    pickings.find(
                        x=>
                            x.tipo===
                                "MODERNO_CONDUCTOR" &&
                            x.padre===
                                parent.nombre &&
                            x.conductor===
                                conductor.nombre &&
                            x.pedidoId===
                                pedido.id
                    );

                let estadoPedido=
                    hijo
                    ?estado(hijo)
                    :"PENDIENTE";

                let cantidad=
                    hijo
                    ?hijo.productos.length
                    :pedido.filas.length;

                let pendientesPedido=
                    hijo
                    ?hijo.productos.filter(
                        x=>x.PENDIENTE
                    ).length
                    :cantidad;

                let pedidoDiv=
                    document.createElement(
                        "div"
                    );

                pedidoDiv.style.border=
                    "1px solid #ccc";

                pedidoDiv.style.borderRadius=
                    "8px";

                pedidoDiv.style.padding=
                    "8px";

                pedidoDiv.style.margin=
                    "8px 0";

                pedidoDiv.style.position=
                    "relative";
                
                pedidoDiv.style.paddingBottom=
                    "45px";
                
                pedidoDiv.style.boxSizing=
                    "border-box";

                pedidoDiv.innerHTML=
                    `<strong>
                        ${numero+1}.
                        ${esc(pedido.nombre)}
                    </strong>
                    <br>
                    <small>
                        📄 Hoja:
                        ${esc(pedido.hoja||"-")}
                        |
                        Columna:
                        ${esc(pedido.columna||"-")}
                    </small>
                    <br>
                    📦 Referencias:
                    ${cantidad}
                    |
                    Pendientes:
                    ${pendientesPedido}
                    <br>
                    <span class="${
                        estadoPedido==="TERMINADO"
                        ?"estado-verde"
                        :estadoPedido==="PENDIENTE"
                        ?"estado-amarillo"
                        :"estado-azul"
                    }">
                        ${estadoPedido}
                    </span>`;

                /*
                   ==========================================
                   BOTÓN
                   ==========================================
                */

                let b=
                    document.createElement(
                        "button"
                    );

                if(estadoPedido==="TERMINADO"){

                    b.textContent=
                        "✅ TERMINADO";

                    b.disabled=true;

                }else if(hijo){

                    b.textContent=
                        hijo.productos.length &&
                        hijo.indice<
                        hijo.productos.length
                        ?"▶ CONTINUAR"
                        :"ABRIR";

                    b.onclick=()=>{

                        let indice=
                            pickings.indexOf(
                                hijo
                            );

                        if(indice<0){
                            return;
                        }

                        cargarEn(indice);

                        if(selector){

                            $("modalElegirPicking")
                                .style.display="none";

                        }else{

                            $("modalListaPickings")
                                .style.display="none";
                        }
                    };

                }else{

                    /*
                       El pedido todavía no ha sido
                       creado como Picking individual.

                       Lo iniciamos directamente.
                    */

                    b.textContent=
                        "▶ TRABAJAR PEDIDO";

                    b.onclick=()=>{

                        trabajarModerno(
                            conductor.nombre,
                            pedido.id
                        );

                        if(selector){

                            $("modalElegirPicking")
                                .style.display="none";

                        }else{

                            $("modalListaPickings")
                                .style.display="none";
                        }
                    };
                }
                 b.style.position="absolute";
                 b.style.bottom="8px";
                 b.style.right="8px";

                pedidoDiv.appendChild(b);

                bloqueConductor.appendChild(
                    pedidoDiv
                );

            });

            c.appendChild(
                bloqueConductor
            );

        });

    });

}

function siguiente(){

    if(!productos.length) return;

    if(
        modoPendientes &&
        productos[indice].PENDIENTE
    ){

        productos[indice].PENDIENTE="";

    }else if(productos[indice].PENDIENTE){

        productos[indice].PENDIENTE="";
    }

    productos[indice].ESTADO="OK";

    productos[indice].FECHA=
        new Date().toLocaleString();

    productos[indice].USUARIO="Jesus";

    avanzar();
}

function avanzar(){

    if(modoPendientes){

        let siguientePendiente=
            productos.findIndex(
                (p,i)=>
                    i!==indice &&
                    p.PENDIENTE
            );

        if(siguientePendiente>=0){

            indice=siguientePendiente;

            mostrar();

            return;
        }

        modoPendientes=false;

        alert(
            "✅ Todos los pendientes fueron resueltos."
        );

        finalizar();

        return;
    }

    if(sectorActual===""){

        if(indice<productos.length-1){

            indice++;

            mostrar();

        }else{

            let pendientes=
                contarPendientes();

            if(pendientes>0){

                modoPendientes=true;

                alert(
                    "⚠️ Todos los productos fueron recorridos.\n\n"+
                    "Quedan "+
                    pendientes+
                    " referencia(s) pendientes.\n\n"+
                    "Vamos a resolverlas ahora."
                );

                irAPendientes();

            }else{

                finalizar();
            }
        }

        return;
    }

    let ordenActual=
        Number(
            productos[indice]["ORDEN SECTOR"]
        );

    let siguienteIndice=-1;
    let menorOrden=Infinity;

    productos.forEach((p,i)=>{

        let orden=
            Number(p["ORDEN SECTOR"]);

        if(
            p.SECTOR===sectorActual &&
            p.ESTADO!=="OK" &&
            p.ESTADO!=="NOVEDAD" &&
            !p.PENDIENTE &&
            orden>ordenActual &&
            orden<menorOrden
        ){

            menorOrden=orden;
            siguienteIndice=i;
        }
    });

    if(siguienteIndice>=0){

        indice=siguienteIndice;

        mostrar();

        return;
    }

    let pendientes=
        contarPendientes();

    if(pendientes>0){

        alert(
            "✅ Sector "+
            sectorActual+
            " terminado.\n\n"+
            "⚠️ Aún quedan "+
            pendientes+
            " referencia(s) pendientes en el Picking.\n\n"+
            "Puedes continuar con otro sector."
        );

    }else{

        alert(
            "✅ Sector "+
            sectorActual+
            " terminado."
        );
    }

    let quedanNormales=
        productos.some(p=>
            p.ESTADO!=="OK" &&
            p.ESTADO!=="NOVEDAD" &&
            !p.PENDIENTE
        );

    if(quedanNormales){
        return;
    }

    pendientes=contarPendientes();

    if(pendientes>0){

        modoPendientes=true;

        alert(
            "⚠️ TODOS LOS SECTORES HAN TERMINADO.\n\n"+
            "Quedan "+
            pendientes+
            " referencia(s) pendientes.\n\n"+
            "Ahora vamos a resolverlas."
        );

        irAPendientes();

    }else{

        finalizar();
    }
}

function finalizar(){

    let pendientes=
        contarPendientes();

    if(pendientes>0){

        alert(
            "⚠️ PICKING INCOMPLETO\n\n"+
            "Quedan "+
            pendientes+
            " referencia(s) pendientes.\n\n"+
            "No se puede dar por terminado hasta resolverlas."
        );

        irAPendientes();

        return;
    }

    if(
        productos.length &&
        productos.every(
            p=>p.ESTADO==="OK"||
               p.ESTADO==="NOVEDAD"
        )
    ){

        /*
           =====================================================
           GUARDAR CAMBIOS DEL PEDIDO ACTUAL
           =====================================================
        */

        sync();


        /*
           =====================================================
           PICKING MODERNO - PEDIDO INDIVIDUAL
           =====================================================
        */

        let pickingActual=
            pickings[pickingActualIndex];


        if(
            pickingActual &&
            pickingActual.tipo===
            "MODERNO_CONDUCTOR"
        ){

            /*
               Buscar el Picking Moderno padre.
            */

            let padre=
                pickings.find(
                    p=>
                        p.tipo==="MODERNO" &&
                        p.nombre===
                        pickingActual.padre
                );


            /*
               Si encontramos el padre, revisamos
               TODOS los pedidos de este conductor.
            */

            if(padre){

                let pedidosConductor=[];

                if(
                    padre.moderno &&
                    padre.moderno.conductores &&
                    padre.moderno.conductores[
                        pickingActual.conductor
                    ] &&
                    padre.moderno.conductores[
                        pickingActual.conductor
                    ].pedidos
                ){

                    pedidosConductor=
                        Object.values(
                            padre.moderno.conductores[
                                pickingActual.conductor
                            ].pedidos
                        );
                }


                /*
                   Buscar los pedidos individuales
                   que ya fueron creados.
                */

                let hijosConductor=
                    pickings.filter(
                        p=>
                            p.tipo===
                            "MODERNO_CONDUCTOR" &&
                            p.padre===
                            padre.nombre &&
                            p.conductor===
                            pickingActual.conductor
                    );


                /*
                   =================================================
                   COMPROBAR SI YA TERMINÓ TODO EL CONDUCTOR
                   =================================================
                */

                let todosTerminados=
                    pedidosConductor.length>0 &&
                    pedidosConductor.every(
                        pedido=>{

                            let hijo=
                                hijosConductor.find(
                                    p=>
                                        String(
                                            p.pedidoId
                                        )===
                                        String(
                                            pedido.id
                                        )
                                );

                            if(!hijo){

                                return false;
                            }

                            return(
                                hijo.productos &&
                                hijo.productos.length>0 &&
                                hijo.productos.every(
                                    p=>
                                        p.ESTADO==="OK" ||
                                        p.ESTADO==="NOVEDAD"
                                )
                            );

                        }
                    );


                /*
                   =================================================
                   TODAVÍA FALTAN PEDIDOS DEL CONDUCTOR
                   =================================================
                */

                   if(!todosTerminados){

                    /*
                       =====================================================
                       EL PEDIDO ACTUAL TERMINÓ
                       PERO TODAVÍA QUEDAN PEDIDOS DEL CONDUCTOR
                       =====================================================
                    */
                
                    /*
                       Actualizar completamente la ventana
                       de Pickings Cargados.
                    */
                
                    listaPickings();
                
                
                    /*
                       Asegurarnos de que cualquier otra ventana
                       de selección quede cerrada.
                    */
                
                    if($("modalElegirPicking")){
                
                        $("modalElegirPicking")
                            .style.display="none";
                    }
                
                    if($("modalConductoresModerno")){
                
                        $("modalConductoresModerno")
                            .style.display="none";
                    }
                
                
                    /*
                       Abrir automáticamente Pickings Cargados.
                    */
                
                    if($("modalListaPickings")){
                
                        $("modalListaPickings")
                            .style.display="flex";
                
                        $("modalListaPickings")
                            .style.zIndex="10000";
                    }
                
                    return;
                }


                /*
                   =================================================
                   TODOS LOS PEDIDOS DEL CONDUCTOR TERMINADOS
                   =================================================

                   Aquí NO mostramos todavía el mensaje
                   "Picking terminado".

                   Llamamos directamente a guardar(),
                   que creará el Excel con TODOS los
                   pedidos de este conductor.
                */

                guardar();

                return;
            }

        }


        /*
           =====================================================
           PICKING NORMAL
           =====================================================
        */

        alert(
            "🎉 Picking terminado.\n\n"+
            "No quedan referencias pendientes."
        );

        listaPickings(true);

        $("modalElegirPicking")
            .style.display="flex";

    }else{

        alert(
            "☑ Llegaste al final. "+
            "Revisa las referencias que falten."
        );
    }
}

function anterior(){

    if(!productos.length) return;

    if(sectorActual===""){

        if(indice>0){
            indice--;
        }

    }else{

        let o=
            Number(
                productos[indice]["ORDEN SECTOR"]
            );

        let s=-1;
        let m=-1;

        productos.forEach((p,i)=>{

            let q=
                Number(p["ORDEN SECTOR"]);

            if(
                p.SECTOR===sectorActual &&
                q<o &&
                q>m
            ){

                m=q;
                s=i;
            }
        });

        if(s>=0){

            indice=s;

        }else{

            alert(
                "⏮ Ya estás en el primer producto del sector."
            );
        }
    }

    mostrar();
}

function novedad(){

    if(!productos.length) return;

    let t=prompt(
        "Escriba la novedad:"
    );

    if(!t||!t.trim()) return;

    productos[indice].ESTADO="NOVEDAD";

    productos[indice].NOVEDAD=
        t.trim();

    productos[indice].FECHA=
        new Date().toLocaleString();

    productos[indice].USUARIO="Jesus";

    avanzar();
}

function pendiente(){

    if(!productos.length) return;

    let t=prompt(
        "Motivo del pendiente:\n\n"+
        "1. Pasillo bloqueado\n"+
        "2. Reabastecimiento\n"+
        "3. Esperando montacargas\n"+
        "4. Esperando escalera\n"+
        "5. Volver después\n"+
        "6. Otro..."
    );

    if(!t||!t.trim()) return;

    productos[indice].PENDIENTE=
        t.trim();

    productos[indice].FECHA=
        new Date().toLocaleString();

    productos[indice].USUARIO="Jesus";

    if(modoPendientes){

        let otra=
            productos.findIndex(
                (p,i)=>
                    i!==indice &&
                    p.PENDIENTE
            );

        if(otra>=0){

            indice=otra;

            mostrar();

        }else{

            alert(
                "⚠️ Esta referencia sigue pendiente.\n\n"+
                "No hay otra referencia pendiente para continuar.\n\n"+
                "Debes resolver esta referencia antes de finalizar el Picking."
            );
        }

        return;
    }

    avanzar();
}

function contarPendientes(){

    return productos.filter(
        x=>x.PENDIENTE
    ).length;
}

function irAPendientes(){

    let i=
        productos.findIndex(
            x=>x.PENDIENTE
        );

    if(i>=0){

        modoPendientes=true;

        indice=i;

        mostrar();

        return true;
    }

    return false;
}

function guardar(){

    if(!productos.length){

        return alert(
            "No hay datos para guardar."
        );
    }

    if(contarPendientes()){

        return alert(
            "⚠️ Resuelve los pendientes antes de guardar."
        );
    }

    if(
        !productos.every(
            p=>p.ESTADO==="OK" ||
               p.ESTADO==="NOVEDAD"
        )
    ){

        return alert(
            "⚠️ El Picking todavía no está terminado."
        );
    }


    /*
       =====================================================
       IDENTIFICAR PICKING ACTUAL
       =====================================================
    */

    let indiceGuardado=
        pickingActualIndex;

    let pickingActual=
        pickings[indiceGuardado];

    if(!pickingActual){

        return alert(
            "⚠️ No se encontró el Picking actual."
        );
    }


    /*
       =====================================================
       MODERNO - PEDIDOS POR CONDUCTOR
       =====================================================
    */

    if(
        pickingActual.tipo===
        "MODERNO_CONDUCTOR"
    ){

        /*
           Guardamos primero el estado actual
           dentro de su pedido.
        */

        pickingActual.productos=
            JSON.parse(
                JSON.stringify(
                    productos
                )
            );

        pickingActual.indice=
            indice;

        pickingActual.sectorActual=
            sectorActual;

        pickingActual.modoPendientes=
            false;

        guardarCola();


        /*
           Buscar el Picking Moderno padre.
        */

        let padre=
            pickings.find(
                p=>
                    p.tipo==="MODERNO" &&
                    p.nombre===
                    pickingActual.padre
            );

        if(!padre){

            return alert(
                "⚠️ No se encontró el Picking Moderno padre."
            );
        }


        /*
           =================================================
           BUSCAR TODOS LOS PEDIDOS DEL CONDUCTOR
           =================================================
        */

        let pedidosConductor=[];

        if(
            padre.moderno &&
            padre.moderno.conductores &&
            padre.moderno.conductores[
                pickingActual.conductor
            ] &&
            padre.moderno.conductores[
                pickingActual.conductor
            ].pedidos
        ){

            pedidosConductor=
                Object.values(
                    padre.moderno.conductores[
                        pickingActual.conductor
                    ].pedidos
                );
        }


        /*
           =================================================
           BUSCAR LOS PICKINGS INDIVIDUALES
           DEL CONDUCTOR
           =================================================
        */

        let hijosConductor=
            pickings.filter(
                p=>
                    p.tipo===
                    "MODERNO_CONDUCTOR" &&
                    p.padre===
                    padre.nombre &&
                    p.conductor===
                    pickingActual.conductor
            );


        /*
           =================================================
           COMPROBAR QUE TODOS LOS PEDIDOS
           YA HAYAN SIDO CREADOS Y TERMINADOS
           =================================================
        */

        let faltantes=[];

        pedidosConductor.forEach(
            pedido=>{

                let hijo=
                    hijosConductor.find(
                        p=>
                            String(
                                p.pedidoId
                            )===
                            String(
                                pedido.id
                            )
                    );

                if(!hijo){

                    faltantes.push(
                        pedido.nombre
                    );

                    return;
                }

                let terminado=
                    hijo.productos &&
                    hijo.productos.length>0 &&
                    hijo.productos.every(
                        p=>
                            p.ESTADO==="OK" ||
                            p.ESTADO==="NOVEDAD"
                    );

                if(!terminado){

                    faltantes.push(
                        pedido.nombre
                    );
                }

            }
        );


        /*
           =================================================
           TODAVÍA FALTAN PEDIDOS DEL CONDUCTOR
           =================================================
        */

        if(faltantes.length){

            alert(
                "✅ Pedido terminado correctamente.\n\n"+
                "📁 Pedido: "+
                (
                    pickingActual.cliente ||
                    pickingActual.nombre
                        .replace(
                            "Moderno - "+
                            pickingActual.conductor+
                            " - ",
                            ""
                        )
                )+
                "\n\n"+
                "🚚 Conductor: "+
                pickingActual.conductor+
                "\n\n"+
                "📊 Este pedido ha quedado TERMINADO.\n\n"+
                "⏳ Todavía faltan "+
                faltantes.length+
                " pedido(s) por terminar de "+
                pickingActual.conductor+
                ".\n\n"+
                "Continúa con los pedidos pendientes."
            );


            /*
               Volvemos a mostrar Pickings cargados.
            */

            listaPickings();

            return;
        }


        /*
           =================================================
           TODOS LOS PEDIDOS DEL CONDUCTOR TERMINADOS
           =================================================
        */

        /*
           Crear un solo Excel para el conductor.
           Cada pedido tendrá su propia hoja.
        */

        let libro=
            XLSX.utils.book_new();


        hijosConductor.forEach(
            (pedido,indexPedido)=>{

                let nombreHoja=
                    pedido.cliente ||
                    pedido.nombre
                        .replace(
                            "Moderno - "+
                            pedido.conductor+
                            " - ",
                            ""
                        );

                /*
                   Excel limita los nombres de hoja
                   a 31 caracteres.
                */

                nombreHoja=
                    String(
                        nombreHoja
                    )
                    .replace(
                        /[\\\/\?\*\[\]:]/g,
                        "_"
                    )
                    .substring(
                        0,
                        31
                    );

                /*
                   Evitar nombres de hoja repetidos.
                */

                let nombreOriginal=
                    nombreHoja;

                let contadorHoja=2;

                while(
                    libro.SheetNames.includes(
                        nombreHoja
                    )
                ){

                    nombreHoja=
                        (
                            nombreOriginal
                            .substring(
                                0,
                                27
                            )+
                            "_"+
                            contadorHoja
                        );

                    contadorHoja++;
                }


                let hoja=
                    XLSX.utils.json_to_sheet(
                        pedido.productos
                    );

                XLSX.utils.book_append_sheet(
                    libro,
                    hoja,
                    nombreHoja
                );

            }
        );


        /*
           Nombre del archivo.
        */

        let nombreArchivo=
            "Moderno - "+
            pickingActual.conductor+
            " - Finalizado";


        nombreArchivo=
            nombreArchivo
                .replace(
                    /[\\/:*?"<>|]/g,
                    "_"
                );


        XLSX.writeFile(
            libro,
            nombreArchivo+
            ".xlsx"
        );


        /*
           =================================================
           MARCAR TODOS LOS PEDIDOS DEL CONDUCTOR
           COMO GUARDADOS
           =================================================
        */

        hijosConductor.forEach(
            pedido=>{

                pedido.guardado=true;

                pedido.modoPendientes=
                    false;

            }
        );


        /*
           El padre también queda actualizado.
        */

        guardarCola();


/*
   =================================================
   FINALIZAR GUARDADO DEL CONDUCTOR
   =================================================
*/

alert(
    "🎉 Pedidos guardados correctamente.\n\n"+
    "🚚 Conductor: "+
    pickingActual.conductor+
    "\n\n"+
    "📊 Pedidos guardados: "+
    hijosConductor.length+
    " de "+
    pedidosConductor.length+
    "\n\n"+
    "📁 Se creó un solo Excel con todos "+
    "los pedidos del conductor.\n\n"+
    "Ahora puedes continuar con los demás Pickings."
);


/*
   =================================================
   CERRAR CUALQUIER VENTANA DE TRABAJO
   =================================================
*/

if($("modalListaPickings")){

    $("modalListaPickings")
        .style.display="none";

}

if($("modalElegirPicking")){

    $("modalElegirPicking")
        .style.display="none";

}

if($("modalConductoresModerno")){

    $("modalConductoresModerno")
        .style.display="none";

}


/*
   =================================================
   MOSTRAR PICKINGS CARGADOS
   =================================================
*/

listaPickings();

$("modalListaPickings")
    .style.display="flex";


return;

}
    /*
       =====================================================
       PICKINGS NORMALES
       =====================================================
    */

    /*
       Crear Excel del Picking normal.
    */

    let h=
        XLSX.utils.json_to_sheet(
            productos
        );

    let l=
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        l,
        h,
        "Lista"
    );


    let n=
        (
            pickingActual.nombre ||
            "Picking"
        )
        .replace(
            /[\\/:*?"<>|]/g,
            "_"
        );


    XLSX.writeFile(
        l,
        n+
        " - Finalizado.xlsx"
    );


    /*
       Guardar estado del Picking.
    */

    pickingActual.guardado=
        true;

    pickingActual.productos=
        productos;

    pickingActual.indice=
        indice;

    pickingActual.sectorActual=
        sectorActual;

    pickingActual.modoPendientes=
        false;


    guardarCola();


    /*
       Contamos solamente Pickings reales.
       El padre MODERNO NO cuenta como zona.
    */

    let pickingsReales=
        pickings.filter(
            p=>
                p.tipo!=="MODERNO"
        );


    let totalPickings=
        pickingsReales.length;


    let totalGuardados=
        pickingsReales.filter(
            p=>
                p.guardado===true
        ).length;


    /*
       =====================================================
       TODAVÍA FALTAN PICKINGS NORMALES
       =====================================================
    */

    if(
        totalGuardados<
        totalPickings
    ){

        let siguiente=
            pickings.findIndex(
                p=>
                    p.tipo!=="MODERNO" &&
                    p.guardado!==true
            );


        alert(
            "✅ Excel guardado correctamente.\n\n"+
            "📁 Zona guardada: "+
            pickingActual.nombre+
            "\n\n"+
            "📊 Progreso de guardado:\n"+
            totalGuardados+
            " de "+
            totalPickings+
            " zonas.\n\n"+
            "⚠️ Todavía faltan "+
            (
                totalPickings-
                totalGuardados
            )+
            " zona(s) por guardar.\n\n"+
            "La información NO se ha borrado."
        );


        if(siguiente>=0){

            cargarEn(
                siguiente
            );

        }

        return;
    }


    /*
       =====================================================
       TODAS LAS ZONAS NORMALES GUARDADAS
       =====================================================
    */

    alert(
        "🎉 TODAS LAS ZONAS HAN SIDO GUARDADAS.\n\n"+
        "Se guardaron correctamente "+
        totalGuardados+
        " de "+
        totalPickings+
        " zonas.\n\n"+
        "Ahora se limpiará la cola de Pickings."
    );


    /*
       Limpiar todo.
    */

    pickings=[];

    pickingActualIndex=-1;

    productos=[];

    indice=0;

    sectorActual="";

    modoPendientes=false;

    cargaPendiente=null;

    colaCarga=[];

    modernoTrabajo=null;

    modernoConductores={};


    localStorage.removeItem(
        PICKINGS_KEY
    );


    /*
       Limpiar pantalla.
    */

    $("zona").textContent=
        "ZONA";

    $("referencia").textContent=
        "";

    $("producto").textContent=
        "CARGUE UN PICKING";

    $("unidades").textContent=
        "0";

    $("progreso").textContent=
        "0 de 0";

    document.body.style.background=
        "white";

    actualizar();

    pintarSectorActivo();

}

/* =========================================================
   FINALIZAR JORNADA
   ========================================================= */

   function todosLosPickingsTerminados(){

    let pickingsReales=
        pickings.filter(
            p=>p.tipo!=="MODERNO"
        );

    if(!pickingsReales.length){
        return false;
    }

    return pickingsReales.every(
        p=>estado(p)==="TERMINADO"
    );
}

function finalizarJornada(){

    /*
       Antes de finalizar la jornada sincronizamos
       el Picking activo para asegurarnos de no perder
       ningún cambio reciente.
    */

    sync();

    if(!pickings.length){

        alert(
            "ℹ️ No hay Pickings cargados para finalizar."
        );

        return;
    }

    let pickingsReales=
    pickings.filter(
        p=>
            p.tipo!=="MODERNO" &&
            p.tipo!=="MODERNO_CONDUCTOR"
    );

let incompletos=
    pickingsReales.filter(
        p=>estado(p)!=="TERMINADO"
    );

if(incompletos.length){

    alert(
        "⚠️ NO SE PUEDE FINALIZAR LA JORNADA\n\n"+
        "Todavía hay "+
        incompletos.length+
        " Picking(s) sin terminar:\n\n"+
        incompletos
            .map(p=>"• "+p.nombre+" — "+estado(p))
            .join("\n")+
        "\n\n"+
        "Debes terminar todos los Pickings antes de finalizar la jornada."
    );

    return;
}

let sinGuardar=
    pickingsReales.filter(
        p=>p.guardado!==true
    );

if(sinGuardar.length){

    alert(
        "⚠️ NO SE PUEDE FINALIZAR LA JORNADA\n\n"+
        "Hay "+
        sinGuardar.length+
        " Picking(s) terminados que todavía NO han sido guardados:\n\n"+
        sinGuardar
            .map(p=>"• "+p.nombre)
            .join("\n")+
        "\n\n"+
        "Debes presionar GUARDAR en todos los Pickings antes de finalizar la jornada."
    );

    return;
}

    if(incompletos.length){

        alert(
            "⚠️ NO SE PUEDE FINALIZAR LA JORNADA\n\n"+
            "Todavía hay "+
            incompletos.length+
            " Picking(s) sin terminar:\n\n"+
            incompletos
                .map(p=>"• "+p.nombre+" — "+estado(p))
                .join("\n")+
            "\n\n"+
            "Debes terminar todos los Pickings antes de finalizar la jornada."
        );

        return;
    }

    let confirmar=confirm(
        "⚠️ FINALIZAR JORNADA\n\n"+
        "Todos los Pickings están terminados.\n\n"+
        "Al continuar se eliminará la cola de Pickings "+
        "guardada en esta computadora.\n\n"+
        "La BASE DE PRODUCTOS NO será eliminada.\n\n"+
        "¿Desea finalizar la jornada?"
    );

    if(!confirmar){
        return;
    }

    /*
       Limpiamos únicamente la información de la jornada.
       La Base de Productos y el nombre de la aplicación
       permanecen intactos.
    */

    pickings=[];

    pickingActualIndex=-1;

    productos=[];

    indice=0;

    sectorActual="";

    modoPendientes=false;

    cargaPendiente=null;

    colaCarga=[];

    modernoTrabajo=null;

    modernoConductores={};

    localStorage.removeItem(
        PICKINGS_KEY
    );
    
    localStorage.removeItem(
        ACTIVE_PICKING_KEY
    );

    /*
       Limpiar posibles modales abiertos.
    */

    [
        "modalElegirPicking",
        "modalListaPickings",
        "modalPicking",
        "modalAgregarReferencia",
        "modalBase",
        "modalEmpaque",
        "modalModerno",
        "modalOrdenModerno",
        "modalConductoresModerno"
    ].forEach(id=>{

        if($(id)){
            $(id).style.display="none";
        }
    });

    /*
       Dejamos la pantalla en estado inicial.
    */

       $("zona").textContent="ZONA";
       $("referencia").textContent="";
       $("producto").textContent="CARGUE UN PICKING";
       $("unidades").textContent="0";
       $("progreso").textContent="0 de 0";
       
       /*
          Limpiar también la información visual
          del Picking Moderno.
       */
       
       if($("modernoInfo")){
       
           $("modernoInfo").textContent="";
           $("modernoInfo").style.display="none";
       
       }
       
       document.body.style.background="white";

    actualizar();

    pintarSectorActivo();

    alert(
        "🎉 JORNADA FINALIZADA\n\n"+
        "Todos los Pickings fueron cerrados correctamente.\n\n"+
        "La cola de Pickings ha sido limpiada.\n"+
        "La Base de Productos permanece guardada."
    );
}

/* =========================================================
   BOTÓN FINALIZAR JORNADA
   ========================================================= */

   function crearMenuPrincipal(){

    // Si ya existe, no lo volvemos a crear
    if($("menuPrincipal")){
        return;
    }

    // Ocultar los botones originales que ahora estarán dentro del menú
    [
        "btnDescargarBase",
        "btnCargarPicking",
        "btnAdministrarPickings",
        "btnCargarModerno",
        "btnAgregarReferencia",
        "btnCambiarNombre"
    ].forEach(id=>{
        if($(id)){
            $(id).style.display="none";
        }
    });

    // Ocultar el elemento visual asociado a Actualizar Base
    if($("archivoBase")){
        let padre=$("archivoBase").parentElement;

        if(padre){
            padre.style.display="none";
        }
    }

    // Contenedor principal
    let menu=document.createElement("div");
    menu.id="menuPrincipal";

    menu.style.position="relative";
    menu.style.display="inline-block";
    menu.style.margin="10px auto";

    // Botón principal
let boton=document.createElement("button");

boton.type="button";
boton.id="btnAbrirMenu";
boton.textContent="☰ MENÚ";

boton.style.fontSize="18px";
boton.style.fontWeight="bold";
boton.style.padding="8px 18px";
boton.style.borderRadius="8px";
boton.style.border="1px solid #ccc";
boton.style.background="#f1f1f1";
boton.style.cursor="pointer";
boton.style.boxSizing="border-box";

    // Contenedor de opciones
    let opciones=document.createElement("div");

    opciones.id="opcionesMenu";

    opciones.style.display="none";
    opciones.style.position="absolute";
    opciones.style.top="100%";
    opciones.style.left="0";
    opciones.style.transform="none";
    opciones.style.marginTop="6px";
    opciones.style.background="white";
    opciones.style.border="1px solid #ccc";
    opciones.style.borderRadius="10px";
    opciones.style.boxShadow="0 5px 15px rgba(0,0,0,.25)";
    opciones.style.padding="8px";
    opciones.style.zIndex="9999";
    opciones.style.width="280px";
    opciones.style.maxWidth="calc(100vw - 20px)";
    opciones.style.boxSizing="border-box";

    function crearOpcion(texto,accion){

        let b=document.createElement("button");

        b.type="button";
        b.textContent=texto;

        b.style.display="block";
        b.style.width="100%";
        b.style.padding="10px 14px";
        b.style.margin="3px 0";
        b.style.textAlign="left";
        b.style.fontSize="15px";
        b.style.fontWeight="bold";
        b.style.border="none";
        b.style.borderRadius="7px";
        b.style.background="white";
        b.style.cursor="pointer";

        b.onmouseenter=()=>{
            b.style.background="#e9e9e9";
        };

        b.onmouseleave=()=>{
            b.style.background="white";
        };

        b.onclick=()=>{
            opciones.style.display="none";
            accion();
        };

        opciones.appendChild(b);
    }

    // =====================================================
    // ORDEN DEL MENÚ
    // =====================================================

    crearOpcion(
        "📚 Actualizar Base",
        ()=>{
            if($("archivoBase")){
                $("archivoBase").click();
            }
        }
    );

    crearOpcion(
        "⬇️ Descargar Base",
        ()=>{
            descargarBase();
        }
    );

    crearOpcion(
    "📋 Picking Tradicional / Zonas",
    ()=>{
        abrirCarga();
    }
);

crearOpcion(
    "🚚 Picking Moderno",
    ()=>{
        abrirModerno();
    }
);

crearOpcion(
    "📂 Pickings Cargados",
    ()=>{
        listaPickings();
        $("modalListaPickings").style.display="flex";
    }
);

    // Debajo de Picking Moderno
    crearOpcion(
        "➕ Agregar Referencia",
        ()=>{
            abrirNueva();
        }
    );

    crearOpcion(
        "✏️ Editar Nombre",
        ()=>{
            nombre();
        }
    );

    crearOpcion(
        "🧹 Finalizar",
        ()=>{
            finalizarJornada();
        }
    );

    // Abrir / cerrar menú
    boton.onclick=(e)=>{

        e.stopPropagation();

        opciones.style.display=
            opciones.style.display==="none"
            ?"block"
            :"none";
    };

    // Evitar que al hacer clic dentro se cierre
    opciones.onclick=e=>{
        e.stopPropagation();
    };

    // Cerrar al hacer clic fuera
    document.addEventListener("click",()=>{

        opciones.style.display="none";

    });

    menu.appendChild(boton);
    menu.appendChild(opciones);

    // =====================================================
    // COLOCAR EL MENÚ DEBAJO DEL TÍTULO PICKING
    // =====================================================

    let titulo=$("tituloAplicacion");

    if(titulo && titulo.parentNode){

        titulo.parentNode.insertBefore(
            menu,
            titulo.nextSibling
        );

    }else{

        document.body.insertBefore(
            menu,
            document.body.firstChild
        );
    }
}

/* =========================================================
   FUNCIONES GENERALES
   ========================================================= */

function cambiarSector(s){

    if(!productos.length) return;

    let i=-1;
    let m=Infinity;

    productos.forEach((p,j)=>{

        if(
            p.SECTOR===s &&
            p.ESTADO!=="OK" &&
            p.ESTADO!=="NOVEDAD" &&
            !p.PENDIENTE &&
            Number(p["ORDEN SECTOR"])<m
        ){

            m=
                Number(
                    p["ORDEN SECTOR"]
                );

            i=j;
        }
    });

    if(i<0){

        return alert(
            "✅ El Sector "+
            s+
            " ya fue terminado."
        );
    }

    sectorActual=s;

    indice=i;

    mostrar();
}

function pintarSectorActivo(){

    ["A","B","C"].forEach(s=>{

        if($("btn"+s)){

            $("btn"+s).style.background=
                "#d9d9d9";

            $("btn"+s).style.color=
                "black";
        }
    });

    if(sectorActual && $("btn"+sectorActual)){

        $("btn"+sectorActual).style.background=
            "#28a745";

        $("btn"+sectorActual).style.color=
            "white";
    }
}

function calcular(){

    let e=
        parseInt(
            $("txtEmpaque").value
        );

    if(isNaN(e)||e<=0){

        return alert(
            "Ingrese una cantidad válida."
        );
    }

    let u=
        parseInt(
            productos[indice].UNIDADES
        );

    let c=Math.floor(u/e);

    let s=u%e;

    let r=
        (c
            ?"📦 "+c+" caja(s)<br>"
            :"")+
        (s
            ?"➕ "+s+" unidad(es)"
            :"");

    $("resultadoEmpaque").innerHTML=
        r||"0";
}

function nombre(){

    let n=prompt(
        "Nombre de la aplicación:",
        localStorage.getItem(
            APP_NAME_KEY
        )||"PICKING"
    );

    if(n&&n.trim()){

        localStorage.setItem(
            APP_NAME_KEY,
            n.trim()
        );

        $("tituloAplicacion").textContent=
            n.trim();

        document.title=
            n.trim();
    }
}

function cargarBase(e){

    let f=e.target.files[0];

    if(!f) return;

    let r=new FileReader();

    r.onload=x=>{

        let l=XLSX.read(
            new Uint8Array(
                x.target.result
            ),
            {type:"array"}
        );

        let a=
            XLSX.utils.sheet_to_json(
                l.Sheets[
                    l.SheetNames[0]
                ]
            );

        let req=[
            "REFERENCIA",
            "PRODUCTO",
            "SECTOR",
            "ORDEN SECTOR"
        ];

        let bad=
            req.filter(
                c=>!Object.hasOwn(
                    a[0]||{},
                    c
                )
            );

        if(bad.length){

            return alert(
                "⚠️ Faltan columnas:\n"+
                bad.join("\n")
            );
        }

        let refs=
            a.map(
                x=>String(
                    x.REFERENCIA
                ).trim()
            );

        let dup=[
            ...new Set(
                refs.filter(
                    (v,i)=>
                        refs.indexOf(v)!==i
                )
            )
        ];

        if(dup.length){

            return alert(
                "⚠️ Referencias duplicadas:\n"+
                dup.join("\n")
            );
        }

        baseProductos=a;

        ordenarBase();

        localStorage.setItem(
            BASE_KEY,
            JSON.stringify(
                baseProductos
            )
        );

        $("estadoBase").textContent=
            "✓ Base cargada";

        alert(
            "✅ Base actualizada correctamente"
        );
    };

    r.readAsArrayBuffer(f);
}

function descargarBase(){

    if(!baseProductos.length){

        return alert(
            "⚠️ No hay Base cargada."
        );
    }

    let a=[
        [
            "REFERENCIA",
            "PRODUCTO",
            "SECTOR",
            "ORDEN SECTOR"
        ],
        ...baseProductos.map(
            p=>[
                p.REFERENCIA,
                p.PRODUCTO,
                p.SECTOR,
                p["ORDEN SECTOR"]
            ]
        )
    ];

    let h=
        XLSX.utils.aoa_to_sheet(a);

    let l=
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        l,
        h,
        "Base"
    );

    XLSX.writeFile(
        l,
        "Base_Picking.xlsx"
    );
}

/* =========================================================
   PICKING MODERNO
   ========================================================= */

let modernoTrabajo=null;
let modernoConductores={};

function normalizar(v){

    return String(v??"")
        .trim()
        .replace(/\s+/g," ")
        .toUpperCase();
}

function parsearModerno(texto){
    let a=texto.trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .map(line=>{
            let c=line.split("\t").map(x=>x.trim());

            return {
                CLIENTE:c[0]||"",
                CONDUCTOR:c[1]||"",
                REFERENCIA:c[2]||"",
                UNIDADES:c[3]||"",
                COLUMNA:c[4]||"",
                HOJA:c[5]||""
            };
        });

    if(
        a[0] &&
        normalizar(a[0].CLIENTE)==="CLIENTE" &&
        normalizar(a[0].CONDUCTOR)==="CONDUCTOR"
    ){
        a.shift();
    }

    return a;
}


/* =========================================================
   LEER UNA HOJA REAL DE PICKING MODERNO
   ========================================================= */

function leerHojaModerna(hoja,nombreHoja){

    let matriz=XLSX.utils.sheet_to_json(
        hoja,
        {
            header:1,
            defval:""
        }
    );

    if(!matriz.length){
        return [];
    }

    /*
       Buscar fila de REFERENCIA
    */

    let filaReferencia=-1;
    let columnaReferencia=-1;
    let filaConductor=-1;

    for(let i=0;i<matriz.length;i++){

        for(let j=0;j<matriz[i].length;j++){

            let valor=normalizar(matriz[i][j]);

            if(valor==="REFERENCIA"){
                filaReferencia=i;
                columnaReferencia=j;
                break;
            }
        }

        if(filaReferencia>=0) break;
    }

    if(filaReferencia<0){
        return [];
    }

    /*
       Normalmente CONDUCTOR está
       inmediatamente encima de la fila
       de clientes.
    */

    for(let i=filaReferencia-1;i>=0;i--){

        let encontrado=false;

        for(let j=0;j<matriz[i].length;j++){

            if(
                normalizar(matriz[i][j])==="CONDUCTOR"
            ){
                filaConductor=i;
                encontrado=true;
                break;
            }
        }

        if(encontrado) break;
    }

    if(filaConductor<0){

        throw new Error(
            "No se encontró la fila CONDUCTOR en la hoja "+nombreHoja
        );
    }

    /*
       Identificar columnas de clientes.
       La fila REFERENCIA contiene:
       REFERENCIA | PRODUCTO | CLIENTES...
    */

    let columnas=[];

    for(
        let col=columnaReferencia+1;
        col<matriz[filaReferencia].length;
        col++
    ){

        let cliente=String(
            matriz[filaReferencia][col]??""
        ).trim();

        if(!cliente) continue;

        /*
           Buscar conductor de esta columna.
           Si la celda está vacía porque Excel
           usa celdas combinadas, heredamos
           el último conductor encontrado.
        */

        let conductor="";

        for(let c=col;c>=0;c--){

            let v=String(
                matriz[filaConductor]?.[c]??""
            ).trim();

            if(v){
                conductor=v;
                break;
            }
        }

        if(!conductor) continue;

        columnas.push({
            columna:col,
            cliente:cliente,
            conductor:conductor
        });
    }

    /*
       Convertir cada cantidad encontrada
       en un registro normalizado.
    */

    let registros=[];

    for(
        let fila=filaReferencia+1;
        fila<matriz.length;
        fila++
    ){

        let referencia=String(
            matriz[fila]?.[columnaReferencia]??""
        ).trim();

        if(!referencia) continue;

        /*
           Ignorar filas como:
           Total general
           Totales
           etc.
        */

        if(
            normalizar(referencia).includes("TOTAL")
        ){
            continue;
        }

        columnas.forEach(col=>{

            let cantidad=
                matriz[fila]?.[col.columna];

            if(
                cantidad==="" ||
                cantidad===null ||
                cantidad===undefined
            ){
                return;
            }

            let numero=Number(
                String(cantidad)
                    .replace(/,/g,"")
                    .trim()
            );

            if(
                isNaN(numero) ||
                numero<=0
            ){
                return;
            }

            registros.push({

                CLIENTE:col.cliente,
            
                CONDUCTOR:normalizar(
                    col.conductor
                ),
            
                REFERENCIA:referencia,
            
                UNIDADES:numero,
            
                HOJA:nombreHoja,
            
                COLUMNA:col.columna
            });

        });
    }

    return registros;
}


function validarModerno(a){

    if(!a.length){

        alert(
            "⚠️ No se encontraron datos válidos de Picking Moderno."
        );

        return false;
    }

    let malos=a.filter(x=>
        !String(x.CLIENTE||"").trim() ||
        !String(x.CONDUCTOR||"").trim() ||
        !String(x.REFERENCIA||"").trim() ||
        isNaN(Number(x.UNIDADES)) ||
        Number(x.UNIDADES)<=0
    );

    if(malos.length){

        alert(
            "⚠️ Se encontraron "+
            malos.length+
            " registro(s) incompleto(s) en Picking Moderno."
        );

        return false;
    }

    return true;
}

function agregarHojaModerna(){

    let d=document.createElement("div");

    d.className="bloque-moderno";

    d.innerHTML=
        '<strong>📄 Hoja</strong>'+
        '<input class="nombre-hoja" placeholder="Nombre de hoja (opcional)">'+
        '<textarea class="datos-hoja" placeholder="CLIENTE\tCONDUCTOR\tREFERENCIA\tUNIDADES"></textarea>'+
        '<button type="button" class="quitar-hoja">🗑️ Quitar</button>';

    d.querySelector(
        ".quitar-hoja"
    ).onclick=()=>d.remove();

    $("listaBloquesModerno")
        .appendChild(d);
}

function abrirModerno(){

    $("listaBloquesModerno")
        .innerHTML="";

    agregarHojaModerna();

    $("modalModerno")
        .style.display="flex";
}

function organizarModerno(){

    let bloques=[
        ...document.querySelectorAll(
            ".bloque-moderno"
        )
    ];

    let todas=[];

    for(let b of bloques){

        let t=
            b.querySelector(
                ".datos-hoja"
            ).value.trim();

        if(!t) continue;

        let a=
            parsearModerno(t);

        if(!validarModerno(a)){
            return;
        }

        todas.push(...a);
    }

    if(!todas.length){

        alert(
            "⚠️ Agrega uno o más Pickings Modernos."
        );

        return;
    }

    /*
       Comprobar referencias contra la Base.
    */

    let referencias=[];
    let vistas=new Set();

    todas.forEach(f=>{

        let r=
            String(
                f.REFERENCIA
            ).trim();

        if(!vistas.has(r)){

            vistas.add(r);

            let bp=
                baseProductos.find(
                    p=>
                        String(
                            p.REFERENCIA
                        ).trim()===r
                );

            referencias.push({

                REFERENCIA:r,

                PRODUCTO:
                    bp?.PRODUCTO||"",

                SECTOR:
                    bp?.SECTOR||"",

                "ORDEN SECTOR":
                    bp?.["ORDEN SECTOR"]??""

            });

        }

    });

    /*
       Orden real de Picking:
       A → B → C → ORDEN SECTOR
    */

    referencias.sort((a,b)=>{

        let sectorA=
            String(
                a.SECTOR||""
            ).toUpperCase();

        let sectorB=
            String(
                b.SECTOR||""
            ).toUpperCase();

        let ordenA=
            Number(
                a["ORDEN SECTOR"]
            );

        let ordenB=
            Number(
                b["ORDEN SECTOR"]
            );

        return(
            sectorA.localeCompare(sectorB)||
            ordenA-ordenB
        );

    });

    modernoTrabajo={

        filas:todas,

        referencias:referencias,

        orden:
            referencias.map(
                x=>x.REFERENCIA
            )

    };

    $("modalModerno")
        .style.display="none";

    mostrarOrdenModerno();

    $("modalOrdenModerno")
        .style.display="flex";
}

function mostrarOrdenModerno(){

    let c=$("listaOrdenModerno");

    c.innerHTML="";

    modernoTrabajo.orden.forEach(
        (r,i)=>{

            let p=
                modernoTrabajo.referencias.find(
                    x=>x.REFERENCIA===r
                );

            let d=document.createElement(
                "div"
            );

            d.className="orden-moderno";

            d.innerHTML=
                '<strong>'+
                (i+1)+
                '</strong>'+
                '<div class="datos">'+
                '<strong>'+
                esc(r)+
                '</strong><br>'+
                esc(
                    p?.PRODUCTO||
                    "⚠️ No está en la Base"
                )+
                '</div>';

            let u=
                document.createElement(
                    "button"
                );

            u.textContent="⬆️";
            u.disabled=i===0;

            u.onclick=()=>{

                [
                    modernoTrabajo.orden[i-1],
                    modernoTrabajo.orden[i]
                ]=[
                    modernoTrabajo.orden[i],
                    modernoTrabajo.orden[i-1]
                ];

                mostrarOrdenModerno();
            };

            let dwn=
                document.createElement(
                    "button"
                );

            dwn.textContent="⬇️";

            dwn.disabled=
                i===modernoTrabajo.orden.length-1;

            dwn.onclick=()=>{

                [
                    modernoTrabajo.orden[i+1],
                    modernoTrabajo.orden[i]
                ]=[
                    modernoTrabajo.orden[i],
                    modernoTrabajo.orden[i+1]
                ];

                mostrarOrdenModerno();
            };

            d.append(u,dwn);

            c.appendChild(d);
        }
    );
}

function confirmarModerno(){

    let faltantes=
        modernoTrabajo.referencias.filter(
            x=>!x.PRODUCTO
        );

    if(faltantes.length){

        alert(
            "⚠️ Estas referencias no están en la Base:\n\n"+
            faltantes
                .map(x=>x.REFERENCIA)
                .join("\n")+
            "\n\nAgrégalas a la Base y vuelve a cargar."
        );

        return;
    }

    modernoTrabajo.referencias.forEach(
        x=>
            x.ORDEN_MODERNO=
                modernoTrabajo.orden.indexOf(
                    x.REFERENCIA
                )+1
    );

    /*
       =====================================================
       AGRUPAR POR CONDUCTOR + PEDIDO
       =====================================================

       IMPORTANTE:
       Un pedido está identificado por:

       HOJA + COLUMNA

       NO por el nombre del cliente.

       Así:
       G + EMPAQUETADOS EL TRECE
       H + EMPAQUETADOS EL TRECE

       son dos pedidos diferentes.
    */

    let grupos={};

    modernoTrabajo.filas.forEach(f=>{

        let c=
            String(
                f.CONDUCTOR
            )
            .trim()
            .toUpperCase();

        let cl=
            String(
                f.CLIENTE
            )
            .trim();

        let hoja=
            String(
                f.HOJA||""
            )
            .trim();

        let columna=
            String(
                f.COLUMNA??""
            )
            .trim();

        /*
           Identificador único del pedido.

           La columna empieza en 0 porque viene
           directamente de JavaScript/XLSX.
        */

        let pedidoId=
            hoja+
            "__"+
            columna;

        if(!grupos[c]){

            grupos[c]={
                nombre:c,
                pedidos:{}
            };
        }

        if(!grupos[c].pedidos[pedidoId]){

            grupos[c].pedidos[pedidoId]={

                id:pedidoId,

                nombre:cl,

                hoja:hoja,

                columna:columna,

                filas:[]
            };
        }

        grupos[c]
            .pedidos[pedidoId]
            .filas
            .push(f);

    });

    modernoConductores=grupos;

    modernoTrabajo.conductores=grupos;

    /*
       =====================================================
       CREAR REGISTROS DEL PICKING
       =====================================================
    */

    let registros=[];

    Object.values(grupos).forEach(c=>

        Object.values(c.pedidos).forEach(pedido=>

            pedido.filas.forEach(f=>{

                let bp=
                    baseProductos.find(
                        p=>
                            String(
                                p.REFERENCIA
                            ).trim()===
                            String(
                                f.REFERENCIA
                            ).trim()
                    );

                registros.push({

                    TIPO:"MODERNO",

                    CONDUCTOR:c.nombre,

                    CLIENTE:
                        pedido.nombre,

                    PEDIDO_ID:
                        pedido.id,

                    PEDIDO_HOJA:
                        pedido.hoja,

                    PEDIDO_COLUMNA:
                        pedido.columna,

                    REFERENCIA:
                        String(
                            f.REFERENCIA
                        ).trim(),

                    PRODUCTO:
                        bp.PRODUCTO,

                    UNIDADES:
                        Number(
                            f.UNIDADES
                        ),

                    ORDEN_MODERNO:
                        modernoTrabajo.orden.indexOf(
                            String(
                                f.REFERENCIA
                            ).trim()
                        )+1,

                    ESTADO:"PENDIENTE"
                });

            })

        )

    );

    /*
       =====================================================
       CREAR PICKING PADRE
       =====================================================
    */

    let parent={

        nombre:
            "Picking Moderno "+
            (pickings.length+1),

        tipo:"MODERNO",

        productos:registros,

        indice:0,

        moderno:modernoTrabajo,

        creado:
            new Date().toLocaleString()
    };

    pickings.push(parent);

    guardarCola();

    $("modalOrdenModerno")
        .style.display="none";

    mostrarConductoresModerno();

    $("modalConductoresModerno")
        .style.display="flex";
}

function mostrarConductoresModerno(){

    let c=$("listaConductoresModerno");

    c.innerHTML="";

    Object.values(
        modernoConductores
    ).forEach(g=>{

        let d=document.createElement(
            "div"
        );

        d.className="conductor-card";

        let pedidos=
            Object.values(
                g.pedidos
            );

        d.innerHTML=
            '<h3>🚚 '+
            esc(g.nombre)+
            '</h3>'+
            '<span class="badge">'+
            pedidos.length+
            ' pedido(s)</span>';

        /*
           Mostrar cada pedido por separado.
        */

        pedidos.forEach((pedido,i)=>{

            let referencias=
                pedido.filas.length;

            /*
               Convertir número de columna
               a letra de Excel.

               0 = A
               1 = B
               2 = C
               etc.
            */

            let numeroColumna=
                Number(
                    pedido.columna
                );

            let letraColumna="";

            if(!isNaN(numeroColumna)){

                let n=
                    numeroColumna+1;

                while(n>0){

                    let resto=
                        (n-1)%26;

                    letraColumna=
                        String.fromCharCode(
                            65+resto
                        )+
                        letraColumna;

                    n=
                        Math.floor(
                            (n-1)/26
                        );
                }
            }

            let pedidoDiv=
                document.createElement(
                    "div"
                );

            pedidoDiv.className=
                "pedido-moderno";

            pedidoDiv.style.border=
                "1px solid #ccc";

            pedidoDiv.style.borderRadius=
                "8px";

            pedidoDiv.style.padding=
                "10px";

            pedidoDiv.style.margin=
                "8px 0";

            pedidoDiv.innerHTML=
                '<strong>'+
                (i+1)+
                '. '+
                esc(pedido.nombre)+
                '</strong>'+
                '<br>'+
                '<small>'+
                '📄 Hoja: '+
                esc(pedido.hoja||"-")+
                ' | Columna: '+
                esc(letraColumna||pedido.columna)+
                '</small>'+
                '<br>'+
                '📦 Referencias: '+
                referencias;

            let b=
                document.createElement(
                    "button"
                );

            b.textContent=
                "🎯 Trabajar pedido";

            b.onclick=()=>
                trabajarModerno(
                    g.nombre,
                    pedido.id
                );

            pedidoDiv.appendChild(b);

            d.appendChild(pedidoDiv);
        });

        c.appendChild(d);
    });
}

function trabajarModerno(
    conductor,
    pedidoId
){

    /*
       =====================================================
       BUSCAR EL PICKING MODERNO PADRE
       =====================================================

       Ya no dependemos de modernoTrabajo ni de
       modernoConductores.

       La información real está guardada dentro
       del Picking Moderno padre.
    */

    let padre=
        pickings.find(
            p=>
                p.tipo==="MODERNO"
        );

    if(!padre){

        alert(
            "⚠️ No se encontró el Picking Moderno."
        );

        return;
    }


    /*
       =====================================================
       BUSCAR EL CONDUCTOR
       =====================================================
    */

    let conductores=
        padre.moderno &&
        padre.moderno.conductores
        ?padre.moderno.conductores
        :{};

    let claveConductor=
        Object.keys(conductores).find(
            k=>
                String(k)
                    .trim()
                    .toUpperCase()===
                String(conductor)
                    .trim()
                    .toUpperCase()
        );

    if(!claveConductor){

        alert(
            "⚠️ No se encontró el conductor:\n\n"+
            conductor
        );

        return;
    }


    /*
       =====================================================
       BUSCAR EL PEDIDO SELECCIONADO
       =====================================================
    */

    let pedidos=
        conductores[claveConductor].pedidos||{};

    let pedido=
        pedidos[
            pedidoId
        ];

    if(!pedido){

        /*
           Por seguridad, comparar también como texto.
        */

        pedido=
            Object.values(pedidos).find(
                p=>
                    String(p.id)===
                    String(pedidoId)
            );
    }

    if(!pedido){

        alert(
            "⚠️ No se encontró el pedido seleccionado."
        );

        return;
    }


    /*
       =====================================================
       OBTENER LAS REFERENCIAS DE ESTE PEDIDO
       =====================================================

       NO usamos otro pedido.

       Buscamos exclusivamente por:
       CONDUCTOR + PEDIDO_ID
    */

    let filas=
        (padre.productos||[]).filter(
            x=>
                String(x.CONDUCTOR)
                    .trim()
                    .toUpperCase()===
                String(conductor)
                    .trim()
                    .toUpperCase() &&
                String(x.PEDIDO_ID)===
                String(pedido.id)
        );


    if(!filas.length){

        alert(
            "⚠️ El pedido fue encontrado, "+
            "pero no tiene referencias para trabajar."
        );

        return;
    }


    /*
       =====================================================
       BUSCAR SI EL PEDIDO YA EXISTE
       =====================================================
    */

    let idx=
        pickings.findIndex(
            p=>
                p.tipo==="MODERNO_CONDUCTOR" &&
                p.padre===padre.nombre &&
                String(p.conductor)
                    .trim()
                    .toUpperCase()===
                String(conductor)
                    .trim()
                    .toUpperCase() &&
                String(p.pedidoId)===
                String(pedido.id)
        );


    /*
       =====================================================
       SI NO EXISTE, CREARLO
       =====================================================
    */

    if(idx<0){

        let nuevoPicking={

            nombre:
                "Moderno - "+
                conductor+
                " - "+
                pedido.nombre,

            tipo:
                "MODERNO_CONDUCTOR",

            conductor:
                conductor,

            pedidoId:
                pedido.id,

            cliente:
                pedido.nombre,

            hoja:
                pedido.hoja,

            columna:
                pedido.columna,

            padre:
                padre.nombre,

            productos:
                JSON.parse(
                    JSON.stringify(
                        filas
                    )
                ),

            indice:0,

            sectorActual:"",

            modoPendientes:false,

            guardado:false,

            creado:
                new Date().toLocaleString()
        };

        pickings.push(
            nuevoPicking
        );

        idx=
            pickings.length-1;

        guardarCola();

    }else{

        /*
           =================================================
           EL PEDIDO YA EXISTE
           =================================================

           No reemplazamos sus productos porque puede
           tener avance guardado.

           Simplemente continuamos con ese Picking.
        */

        if(
            !pickings[idx].productos ||
            !pickings[idx].productos.length
        ){

            pickings[idx].productos=
                JSON.parse(
                    JSON.stringify(
                        filas
                    )
                );
        }

        guardarCola();
    }


    /*
       =====================================================
       CERRAR VENTANAS
       =====================================================
    */

    if($("modalConductoresModerno")){

        $("modalConductoresModerno")
            .style.display="none";
    }

    if($("modalListaPickings")){

        $("modalListaPickings")
            .style.display="none";
    }

    if($("modalElegirPicking")){

        $("modalElegirPicking")
            .style.display="none";
    }


    /*
       =====================================================
       CARGAR EL PEDIDO SELECCIONADO
       =====================================================
    */

    cargarEn(idx);
}

function iniciar(){

    let b=
        localStorage.getItem(
            BASE_KEY
        );

    if(b){

        baseProductos=
            JSON.parse(b);

        ordenarBase();

        $("estadoBase").textContent=
            "✓ Base cargada";
    }

    let q=
        localStorage.getItem(
            PICKINGS_KEY
        );

    if(q){

        try{

            pickings=
                JSON.parse(q);

        }catch(e){

            pickings=[];
        }
    }

    let n=
        localStorage.getItem(
            APP_NAME_KEY
        )||
        "PICKING";

    $("tituloAplicacion")
        .textContent=n;

    document.title=n;

    /*
       IMPORTANTE:
       Al iniciar NO borramos la cola.
       Si existen Pickings, recuperamos
       el primero como activo.
    */

       if(pickings.length){

        let activo=
            parseInt(
                localStorage.getItem(
                    ACTIVE_PICKING_KEY
                )
            );
    
        if(
            isNaN(activo) ||
            activo<0 ||
            activo>=pickings.length
        ){
            activo=0;
        }
    
        cargarEn(activo);
    
    }else{
    
        mostrar();
    }
}

/* =========================================================
   EVENTOS
   ========================================================= */

$("archivoBase").onchange=
    cargarBase;

$("btnDescargarBase").onclick=
    descargarBase;

$("btnCargarPicking").onclick=
    abrirCarga;

$("btnNuevoBloque").onclick=
    bloque;

$("btnCargarExcelPicking").onclick=
    ()=>$("archivoPicking").click();

$("archivoPicking").onchange=
    e=>leerExcel(
        e.target.files
    );

$("btnAceptarPicking").onclick=
    cargarBloques;

$("btnCancelarPicking").onclick=
    ()=>
        $("modalPicking")
        .style.display="none";

$("btnAdministrarPickings").onclick=
    ()=>{
        listaPickings();
        $("modalListaPickings")
            .style.display="flex";
    };

$("btnCerrarListaPickings").onclick=
    ()=>
        $("modalListaPickings")
        .style.display="none";

$("btnCerrarElegirPicking").onclick=
    ()=>
        $("modalElegirPicking")
        .style.display="none";

$("btnAnterior").onclick=
    anterior;

$("btnSiguiente").onclick=
    siguiente;

$("btnNovedad").onclick=
    novedad;

$("btnPendiente").onclick=
    pendiente;

$("btnGuardar").onclick=
    guardar;

$("btnCalcular").onclick=
    ()=>{
        $("modalEmpaque")
            .style.display="flex";

        $("txtEmpaque").value="";

        $("resultadoEmpaque")
            .innerHTML="";
    };

$("btnCancelarEmpaque").onclick=
    ()=>
        $("modalEmpaque")
        .style.display="none";

$("btnAceptarEmpaque").onclick=
    calcular;

$("btnAgregarReferencia").onclick=
    ()=>abrirNueva();

$("btnVerBaseAgregar").onclick=
    abrirBase;

$("btnGuardarReferencia").onclick=
    guardarNueva;

$("btnCancelarAgregarReferencia").onclick=
    ()=>
        $("modalAgregarReferencia")
        .style.display="none";

$("buscarBase").oninput=
    mostrarBase;

$("btnCerrarBase").onclick=
    ()=>
        $("modalBase")
        .style.display="none";

$("btnCambiarNombre").onclick=
    nombre;

/* PICKING MODERNO */

$("btnCargarModerno").onclick=
    abrirModerno;

$("btnNuevoBloqueModerno").onclick=
    agregarHojaModerna;

$("btnCargarExcelModerno").onclick=
    ()=>$("archivoModerno").click();

    $("archivoModerno").onchange=e=>{

        [...e.target.files].forEach(file=>{
    
            let r=new FileReader();
    
            r.onload=ev=>{
    
                try{
    
                    let libro=XLSX.read(
                        new Uint8Array(
                            ev.target.result
                        ),
                        {
                            type:"array"
                        }
                    );
    
                    /*
                       IMPORTANTE:
                       Ahora recorremos TODAS las hojas.
                    */
    
                    let todas=[];
    
                    libro.SheetNames.forEach(nombreHoja=>{
    
                        let hoja=
                            libro.Sheets[nombreHoja];
    
                        let registros=
                            leerHojaModerna(
                                hoja,
                                nombreHoja
                            );
    
                        todas.push(
                            ...registros
                        );
    
                    });
    
                    if(!todas.length){
    
                        alert(
                            "⚠️ No se encontraron datos de Picking Moderno en "+
                            file.name+
                            "."
                        );
    
                        return;
                    }
    
                    /*
                       Crear bloque visual.
                       El textarea queda con el formato
                       normalizado para poder revisarlo.
                    */
    
                    let d=
                        document.createElement("div");
    
                    d.className=
                        "bloque-moderno";
    
                    d.innerHTML=
                        '<strong>📄 '+
                        esc(file.name)+
                        '</strong>'+
                        '<textarea class="datos-hoja"></textarea>'+
                        '<button type="button" class="quitar-hoja">'+
                        '🗑️ Quitar'+
                        '</button>';
    
                        d.querySelector(
                            ".datos-hoja"
                        ).value=
                        todas.map(x=>[
                            x.CLIENTE,
                            x.CONDUCTOR,
                            x.REFERENCIA,
                            x.UNIDADES,
                            x.COLUMNA,
                            x.HOJA
                        ].join("\t")).join("\n");
    
                    d.querySelector(
                        ".quitar-hoja"
                    ).onclick=
                        ()=>d.remove();
    
                    $("listaBloquesModerno")
                        .appendChild(d);
    
                    alert(
                        "✅ Excel leído correctamente.\n\n"+
                        "Archivo: "+
                        file.name+
                        "\n"+
                        "Hojas leídas: "+
                        libro.SheetNames.length+
                        "\n"+
                        "Registros encontrados: "+
                        todas.length
                    );
    
                }catch(err){
    
                    console.error(err);
    
                    alert(
                        "❌ No se pudo leer "+
                        file.name+
                        ".\n\n"+
                        err.message
                    );
                }
    
            };
    
            r.readAsArrayBuffer(file);
    
        });
    
        e.target.value="";
    };

$("btnAceptarModerno").onclick=
    organizarModerno;

$("btnCancelarModerno").onclick=
    ()=>
        $("modalModerno")
        .style.display="none";

$("btnConfirmarOrdenModerno").onclick=
    confirmarModerno;

$("btnCancelarOrdenModerno").onclick=
    ()=>
        $("modalOrdenModerno")
        .style.display="none";

$("btnCerrarConductoresModerno").onclick=
    ()=>
        $("modalConductoresModerno")
        .style.display="none";

/*
   Antes de cerrar o actualizar la página,
   guardamos el Picking activo.
*/

window.onbeforeunload=sync;

/*
   Iniciar aplicación.
*/

iniciar();
crearMenuPrincipal();