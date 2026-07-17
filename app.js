// ==========================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN
// ==========================================
const client = contentful.createClient({
  space: 'xdg5wjjm8dve',
  accessToken: 'FaE7r13D5nX_j2-OzbEv2gF9qEEDKwPg1Es1PsGbWDk'
});

const numeroWhatsApp = '51903232721';

// ==========================================
// 2. FUNCIÓN PRINCIPAL DEL CATÁLOGO
// ==========================================
async function cargarCatalogo(categoriaFiltro = null) {
  const catalogoContainer = document.getElementById('catalogo-container');
  if (!catalogoContainer) return;

  try {
    let query = { content_type: 'prenda' };
    
    if (categoriaFiltro) {
        query['fields.categoria'] = categoriaFiltro; 
    }

    const response = await client.getEntries(query);
    catalogoContainer.innerHTML = ''; 
    const prendas = response.items;

    if (prendas.length === 0) {
      catalogoContainer.innerHTML = '<p class="cargando">Catálogo en actualización o no hay prendas en esta categoría.</p>';
      return;
    }

    prendas.forEach(prenda => {
      const campos = prenda.fields;
      const idUnico = prenda.sys.id;
      
      const urlFoto = 'https:' + campos.fotos[0].fields.file.url;
      let urlFotoHover = urlFoto; 
      if (campos.fotos.length > 1) {
          urlFotoHover = 'https:' + campos.fotos[1].fields.file.url;
      }
      
      let botonesTallas = '';
      if (campos.enStock && campos.tallas && campos.tallas.length > 0) {
        campos.tallas.forEach(talla => {
            botonesTallas += `<button type="button" class="btn-talla" onclick="seleccionarTalla(event, '${idUnico}', '${talla}', '${campos.nombre}')">${talla}</button>`;
        });
      } else {
        botonesTallas = '<span style="color:#ff4444; font-size:0.9rem;">Sin stock temporalmente</span>';
      }

      const articuloHTML = `
        <article class="tarjeta-prenda">
          <a href="producto.html?id=${idUnico}" class="enlace-producto">
              <div class="img-container">
                  <img src="${urlFoto}" alt="${campos.nombre}" class="img-principal">
                  <img src="${urlFotoHover}" alt="${campos.nombre} Detalle" class="img-secundaria">
              </div>
          </a>
          <div class="info-prenda">
            <span class="categoria">${campos.categoria || 'Catálogo'}</span>
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
// 3. FUNCIONES GLOBALES (Tallas y WhatsApp)
// ==========================================
window.seleccionarTalla = function(event, idUnico, talla, nombrePrenda) {
    const contenedorTallas = document.getElementById(`tallas-${idUnico}`);
    const botones = contenedorTallas.querySelectorAll('.btn-talla');
    botones.forEach(btn => btn.classList.remove('activa'));

    event.target.classList.add('activa');

    const btnWsp = document.getElementById(`btn-wsp-${idUnico}`);
    btnWsp.classList.remove('btn-bloqueado');
    btnWsp.innerText = `Pedir talla ${talla} por WhatsApp`;
    
    const mensaje = `Hola CROSS, me interesa la prenda: ${nombrePrenda}. Deseo pedir la talla: ${talla}. ¿Tienen stock disponible para coordinar la entrega?`;
    btnWsp.href = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    btnWsp.target = "_blank"; 
    btnWsp.style.pointerEvents = "auto"; 
};

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

// ==========================================
// 4. ENRUTADOR Y EVENTOS DEL DOM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Activar menú hamburguesa en móviles
    const btnMenu = document.getElementById('btn-menu');
    const navMenu = document.getElementById('nav-menu');
    if (btnMenu && navMenu) {
        btnMenu.addEventListener('click', () => {
            navMenu.classList.toggle('mostrar');
        });
    }

    // Identificar la vista actual
    const catalogoContainer = document.getElementById('catalogo-container');
    const detalleContainer = document.getElementById('detalle-producto');

    if (catalogoContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const categoriaSeleccionada = urlParams.get('categoria');

        cargarCatalogo(categoriaSeleccionada);

        const enlacesMenu = document.querySelectorAll('.navegacion a');
        enlacesMenu.forEach(enlace => {
            const href = enlace.getAttribute('href');
            if (categoriaSeleccionada) {
                if (href.includes(`categoria=${categoriaSeleccionada}`)) enlace.classList.add('activo');
            } else {
                if (href === 'index.html' || href === '') enlace.classList.add('activo');
            }
        });
            
    } else if (detalleContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const idProducto = urlParams.get('id');

        if (idProducto) {
            detalleContainer.innerHTML = '<p class="cargando">Cargando detalles de la prenda...</p>';
            
            client.getEntry(idProducto)
                .then(prenda => {
                    // Esta función se completará cuando maquetemos producto.html al 100%
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

