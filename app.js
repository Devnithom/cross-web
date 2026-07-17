// app.js

// 1. Configuración de Contentful (Reemplaza con tus llaves reales)
const client = contentful.createClient({
  space: 'xdg5wjjm8dve',
  accessToken: 'FaE7r13D5nX_j2-OzbEv2gF9qEEDKwPg1Es1PsGbWDk'
});

// 2. Capturamos el contenedor en el HTML
const catalogoContainer = document.getElementById('catalogo-container');

// Tu número de WhatsApp (con el código 51 de Perú añadido para la API)
const numeroWhatsApp = '51903232721';

// 3. Función principal asíncrona para obtener los datos (ahora acepta un filtro)
async function cargarCatalogo(categoriaFiltro = null) {
  try {
    // Preparamos la consulta a la base de datos
    let query = { content_type: 'prenda' }; // 'prenda' es tu Content Type
    
    // Si la función recibe una categoría, agregamos el filtro a la consulta
    if (categoriaFiltro) {
        query['fields.categoria'] = categoriaFiltro; 
    }

    // Petición a la base de datos con o sin filtro
    const response = await client.getEntries(query);

    // Limpiamos el texto de "Cargando..."
    catalogoContainer.innerHTML = '';
    const prendas = response.items;

    if (prendas.length === 0) {
      catalogoContainer.innerHTML = '<p class="cargando">Catálogo en actualización o no hay prendas en esta categoría.</p>';
      return;
    }

  // 4. Recorremos los datos y armamos la vista
    prendas.forEach(prenda => {
      const campos = prenda.fields;
      const idUnico = prenda.sys.id;
      
      // Foto 1 (Principal)
      const urlFoto = 'https:' + campos.fotos[0].fields.file.url;
      
      // Lógica para Foto 2 (Efecto Hover): Si subiste una segunda foto a Contentful, la usa. Si no, repite la primera.
      let urlFotoHover = urlFoto; 
      if (campos.fotos.length > 1) {
          urlFotoHover = 'https:' + campos.fotos[1].fields.file.url;
      }
      
      // Lógica de Tallas y Stock (Mantenemos la que ya hicimos)
      let botonesTallas = '';
      if (campos.enStock && campos.tallas && campos.tallas.length > 0) {
        campos.tallas.forEach(talla => {
            botonesTallas += `<button type="button" class="btn-talla" onclick="seleccionarTalla(event, '${idUnico}', '${talla}', '${campos.nombre}')">${talla}</button>`;
        });
      } else {
        botonesTallas = '<span style="color:#ff4444; font-size:0.9rem;">Sin stock temporalmente</span>';
      }

    // 5. Inyectamos la estructura final al DOM (Agregamos el contenedor de imágenes y enlaces)
      const articuloHTML = `
        <article class="tarjeta-prenda">
          <!-- Hacemos que al tocar la imagen nos lleve a producto.html con el ID -->
          <a href="producto.html?id=${idUnico}" class="enlace-producto">
              <div class="img-container">
                  <img src="${urlFoto}" alt="${campos.nombre}" class="img-principal">
                  <img src="${urlFotoHover}" alt="${campos.nombre} Detalle" class="img-secundaria">
              </div>
          </a>
          <div class="info-prenda">
            <span class="categoria">${campos.categoria || 'Catálogo'}</span>
            <!-- Hacemos que el título también sea clickeable -->
            <h2><a href="producto.html?id=${idUnico}" style="color:inherit; text-decoration:none;">${campos.nombre}</a></h2>
            <p class="precio">S/ ${campos.precio.toFixed(2)}</p>
            
            <div class="tallas-selector">
              <p style="font-size: 0.85rem; color: #777;">Selecciona tu talla:</p>
              <div class="botones-tallas" id="tallas-${idUnico}">
                ${botonesTallas}
              </div>
            </div>

            <a href="#" id="btn-wsp-${idUnico}" class="btn-comprar btn-bloqueado">Elige una talla para pedir</a>
          </div>
        </article>
      `;

      catalogoContainer.innerHTML += articuloHTML;
    }); 

  } catch (error) {
    console.error('Error al conectar con la API:', error);
    catalogoContainer.innerHTML = '<p class="cargando">Error al cargar el catálogo. Por favor, recarga la página.</p>';
  }
}

 

// ==========================================
// ENRUTADOR (ROUTER) DE LA APLICACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Identificamos en qué página estamos
    const catalogoContainer = document.getElementById('catalogo-container');
    const detalleContainer = document.getElementById('detalle-producto');

    if (catalogoContainer) {
        // Leemos la URL para saber si el cliente hizo clic en una categoría del menú
        const urlParams = new URLSearchParams(window.location.search);
        const categoriaSeleccionada = urlParams.get('categoria');

        // Disparamos tu función asíncrona enviando la categoría (si existe) o en blanco (si es el inicio)
        cargarCatalogo(categoriaSeleccionada);

        // Resaltar la pestaña actual en el menú
        const enlacesMenu = document.querySelectorAll('.navegacion a');
        enlacesMenu.forEach(enlace => {
            const href = enlace.getAttribute('href');
            if (categoriaSeleccionada) {
                if (href.includes(`categoria=${categoriaSeleccionada}`)) enlace.classList.add('activo');
            } else {
                if (href === 'index.html') enlace.classList.add('activo');
            }
        });

      
            
    } else if (detalleContainer) {
        // Estamos en producto.html -> Leemos la URL ... (mantén esta parte intacta)
        // Estamos en producto.html -> Leemos la URL
        const urlParams = new URLSearchParams(window.location.search);
        const idProducto = urlParams.get('id');

        if (idProducto) {
            detalleContainer.innerHTML = '<p class="cargando">Cargando detalles de la prenda...</p>';
            
            // Traemos solo 1 producto por su ID
            client.getEntry(idProducto)
                .then(prenda => {
                    // Por ahora solo mostraremos este texto para confirmar que la conexión fue exitosa
                    detalleContainer.innerHTML = '<h2>¡Conexión exitosa! Falta armar el diseño de esta vista.</h2>';
                })
                .catch(error => {
                    detalleContainer.innerHTML = '<p>Error al cargar la prenda.</p>';
                    console.error("Error:", error);
                });
        } else {
            detalleContainer.innerHTML = '<p>No se especificó ningún producto.</p>';
        }
    }
});

// Función global para manejar el clic en las tallas
window.seleccionarTalla = function(event, idUnico, talla, nombrePrenda) {
    // 1. Quitar el color blanco de cualquier otro botón de talla en este producto
    const contenedorTallas = document.getElementById(`tallas-${idUnico}`);
    const botones = contenedorTallas.querySelectorAll('.btn-talla');
    botones.forEach(btn => btn.classList.remove('activa'));

    // 2. Pintar de blanco el botón que el cliente acaba de tocar
    event.target.classList.add('activa');

    // 3. Desbloquear el botón de WhatsApp
    const btnWsp = document.getElementById(`btn-wsp-${idUnico}`);
    btnWsp.classList.remove('btn-bloqueado');
    btnWsp.innerText = `Pedir talla ${talla} por WhatsApp`;
    
    // 4. Armar el mensaje dinámico para enviarte
    const mensaje = `Hola CROSS, me interesa la prenda: ${nombrePrenda}. Deseo pedir la talla: ${talla}. ¿Tienen stock disponible para coordinar la entrega?`;
    btnWsp.href = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    btnWsp.target = "_blank"; // Para que abra en una pestaña nueva
    
    // 5. Reactivar el enlace
    btnWsp.style.pointerEvents = "auto"; 
};

// ==========================================
// VISTA DE DETALLE DE PRODUCTO
// ==========================================
function cargarVistaDetalle(prenda) {
    const campos = prenda.fields;
    const urlFotoPrincipal = 'https:' + campos.fotos[0].fields.file.url;
    
    // 1. Armar la galería de imágenes secundaria si existen más fotos
    let galeriaHTML = `<img src="${urlFotoPrincipal}" alt="${campos.nombre}" class="foto-principal-detalle" id="foto-visor">`;
    
    if (campos.fotos.length > 1) {
        galeriaHTML += '<div class="miniaturas">';
        campos.fotos.forEach(foto => {
             const urlMini = 'https:' + foto.fields.file.url;
             // Al hacer clic en la miniatura, reemplaza la foto principal
             galeriaHTML += `<img src="${urlMini}" class="miniatura" onclick="document.getElementById('foto-visor').src='${urlMini}'">`;
        });
        galeriaHTML += '</div>';
    }

    // 2. Lógica de tallas
    let botonesTallas = '';
    if (campos.enStock && campos.tallas) {
        campos.tallas.forEach(talla => {
            botonesTallas += `<button type="button" class="btn-talla" onclick="seleccionarTallaDetalle(event, '${talla}', '${campos.nombre}')">${talla}</button>`;
        });
    } else {
        botonesTallas = '<span style="color:#ff4444; font-weight:bold;">Agotado temporalmente</span>';
    }

    // Lógica para asignar la tabla de medidas correcta según la categoría
    // Convertimos la categoría a minúsculas por seguridad (ej. "Poleras" -> "poleras")
    const categoriaFormateada = (campos.categoria || 'default').toLowerCase().trim();
    const rutaTablaMedidas = `img/tabla-${categoriaFormateada}.jpg`;

    // 3. Estructura HTML inyectada (Reemplazando la tabla HTML por tu imagen dinámica)
    const htmlDetalle = `
        <div class="producto-detalle-grid">
            <div class="galeria-contenedor">
                ${galeriaHTML}
            </div>
            
            <div class="info-detalle-contenedor">
                <span class="categoria">${campos.categoria || 'Catálogo'}</span>
                <h1 class="titulo-detalle">${campos.nombre}</h1>
                <p class="precio-detalle">S/ ${campos.precio.toFixed(2)}</p>
                
                <div class="descripcion-prenda">
                    <p>Prendas de alto gramaje con acabados premium. Nuestro algodón reactivo 20/1 no encoge. Revisa la guía de tallas para asegurar tu fit estructurado perfecto.</p>
                </div>
                
                <div class="tallas-selector">
                    <p style="font-weight: bold; margin-bottom: 0.5rem;">Selecciona tu talla:</p>
                    <div class="botones-tallas" id="tallas-detalle">
                        ${botonesTallas}
                    </div>
                </div>
                
                <a href="#" id="btn-wsp-detalle" class="btn-comprar btn-bloqueado">Elige una talla para pedir</a>

                <!-- Tabla de Medidas (Imagen Dinámica) -->
                <div class="tabla-medidas">
                    <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Guía de Tallas</h3>
                    <!-- El onerror evita que salga un cuadro roto si olvidaste subir la imagen a la carpeta -->
                    <img src="${rutaTablaMedidas}" alt="Medidas de ${campos.categoria}" style="width: 100%; height: auto; border-radius: 6px;" onerror="this.style.display='none'">
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('detalle-producto').innerHTML = htmlDetalle;
}

// 4. Lógica del botón WhatsApp para la vista de detalle
window.seleccionarTallaDetalle = function(event, talla, nombrePrenda) {
    const botones = document.querySelectorAll('#tallas-detalle .btn-talla');
    botones.forEach(btn => btn.classList.remove('activa'));
    event.target.classList.add('activa');

    const btnWsp = document.getElementById('btn-wsp-detalle');
    btnWsp.classList.remove('btn-bloqueado');
    btnWsp.innerText = `Pedir talla ${talla} por WhatsApp`;
    
    const mensaje = `Hola CROSS, me interesa la prenda: ${nombrePrenda}. Deseo pedir la talla: ${talla}.`;
    btnWsp.href = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    btnWsp.target = "_blank";
    btnWsp.style.pointerEvents = "auto";
};