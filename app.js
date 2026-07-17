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

      // Extraemos la URL de la primera foto del array de imágenes
      const urlFoto = 'https:' + campos.fotos[0].fields.file.url;
      
      // Formateamos las tallas (ej. S, M, L) separadas por comas
      const tallasDisponibles = campos.tallas ? campos.tallas.join(', ') : 'Única';

      // Lógica de validación de Stock
      let botonHTML = '';
      if (campos.enStock) {
        // Armamos el enlace de WhatsApp dinámico
        const mensajeWsp = `Hola CROSS, me interesa: ${campos.nombre}. ¿Tienen stock disponible?`;
        const urlWsp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeWsp)}`;
        
        botonHTML = `<a href="${urlWsp}" target="_blank" class="btn-comprar">Pedir por WhatsApp</a>`;
      } else {
        // Botón bloqueado si el booleano es false
        botonHTML = `<button class="btn-agotado" disabled>Sin Stock</button>`;
      }

      // 5. Inyectamos la estructura final al DOM (Template String)
      const articuloHTML = `
        <article class="tarjeta-prenda">
          <img src="${urlFoto}" alt="${campos.nombre}">
          <div class="info-prenda">
            <span class="categoria">${campos.categoria || 'Catálogo'}</span>
            <h2>${campos.nombre}</h2>
            <p class="precio">S/ ${campos.precio.toFixed(2)}</p>
            <p class="tallas">Tallas: ${tallasDisponibles}</p>
            ${botonHTML}
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