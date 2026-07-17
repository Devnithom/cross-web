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

// 3. Función principal asíncrona para obtener los datos
async function cargarCatalogo() {
  try {
    // Petición a la base de datos
    const response = await client.getEntries({
      content_type: 'prenda' // El ID exacto que definimos en el Content Model
    });

    // Limpiamos el texto de "Cargando..."
    catalogoContainer.innerHTML = '';
    const prendas = response.items;

    if (prendas.length === 0) {
      catalogoContainer.innerHTML = '<p class="cargando">Catálogo en actualización.</p>';
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

      // 5. Inyectamos la estructura final al DOM (Agregamos el contenedor de imágenes)
      const articuloHTML = `
        <article class="tarjeta-prenda">
          <div class="img-container">
              <img src="${urlFoto}" alt="${campos.nombre}" class="img-principal">
              <img src="${urlFotoHover}" alt="${campos.nombre} Detalle" class="img-secundaria">
          </div>
          <div class="info-prenda">
            <span class="categoria">${campos.categoria || 'Catálogo'}</span>
            <h2>${campos.nombre}</h2>
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

// 6. Ejecución
cargarCatalogo();

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