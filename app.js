// ==========================================
// 1. CONFIGURACIÓN DEL SISTEMA
// ==========================================
const API_CONFIG = {
    space: 'xdg5wjjm8dve',
    accessToken: 'FaE7r13D5nX_j2-OzbEv2gF9qEEDKwPg1Es1PsGbWDk'
};
const client = contentful.createClient({
    space: API_CONFIG.space,
    accessToken: API_CONFIG.accessToken
});
const NUMERO_WHATSAPP = '51903232721';

// ==========================================
// 2. CONTROLADOR DE INTERFAZ (UI)
// ==========================================
// Este módulo se encarga EXCLUSIVAMENTE de prender y apagar partes visuales
const UI = {
    elementos: {
        banner: document.getElementById('banner-promos'),
        carrusel: document.getElementById('carrusel-categorias-sec'),
        historia: document.getElementById('seccion-historia'),
        catalogoMain: document.getElementById('main-catalogo'),
        catalogoContenedor: document.getElementById('catalogo-container'),
        navMenu: document.getElementById('nav-menu'),
        enlacesMenu: document.querySelectorAll('.navegacion a')
    },

    // Vista de Inicio: Muestra banners y marketing, oculta ropa
    renderizarInicio: function() {
        if (this.elementos.banner) this.elementos.banner.style.display = 'block';
        if (this.elementos.carrusel) this.elementos.carrusel.style.display = 'block';
        if (this.elementos.historia) this.elementos.historia.style.display = 'flex';
        if (this.elementos.catalogoMain) this.elementos.catalogoMain.style.display = 'none';
    },

    // Vista de Categoría: Oculta el marketing, muestra solo el catálogo de ropa
    renderizarCategoria: function() {
        if (this.elementos.banner) this.elementos.banner.style.display = 'none';
        if (this.elementos.carrusel) this.elementos.carrusel.style.display = 'none';
        if (this.elementos.historia) this.elementos.historia.style.display = 'none';
        if (this.elementos.catalogoMain) this.elementos.catalogoMain.style.display = 'block';
        
        // Auto-scroll suave para asegurar que el catálogo esté a la vista en móviles
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    resaltarMenuActivo: function(categoriaActual) {
        this.elementos.enlacesMenu.forEach(enlace => {
            enlace.classList.remove('activo');
            const href = enlace.getAttribute('href');
            if (categoriaActual && href.includes(`categoria=${categoriaActual}`)) {
                enlace.classList.add('activo');
            } else if (!categoriaActual && (href === 'index.html' || href === '')) {
                enlace.classList.add('activo');
            }
        });
    }
};

// ==========================================
// 3. LÓGICA DE NEGOCIO (Conexión y Renderizado)
// ==========================================
async function cargarCatalogo(categoriaFiltro = null) {
    if (!UI.elementos.catalogoContenedor) return;

    try {
        let query = { content_type: 'prenda' };
        if (categoriaFiltro) query['fields.categoria'] = categoriaFiltro;

        const response = await client.getEntries(query);
        UI.elementos.catalogoContenedor.innerHTML = ''; 
        const prendas = response.items;

        if (prendas.length === 0) {
            UI.elementos.catalogoContenedor.innerHTML = '<p class="cargando">Catálogo en actualización. Preparando nuevos cortes.</p>';
            return;
        }

        prendas.forEach(prenda => {
            const campos = prenda.fields;
            const idUnico = prenda.sys.id;
            const urlFoto = 'https:' + campos.fotos[0].fields.file.url;
            
            let urlFotoHover = urlFoto; 
            if (campos.fotos.length > 1) urlFotoHover = 'https:' + campos.fotos[1].fields.file.url;
            
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
                            <div class="botones-tallas" id="tallas-${idUnico}">${botonesTallas}</div>
                        </div>
                        <a href="#" id="btn-wsp-${idUnico}" class="btn-comprar btn-bloqueado">Elige una talla para pedir</a>
                    </div>
                </article>
            `;
            UI.elementos.catalogoContenedor.innerHTML += articuloHTML;
        }); 

    } catch (error) {
        console.error('Error de API:', error);
        UI.elementos.catalogoContenedor.innerHTML = '<p class="cargando">Error al cargar el catálogo. Por favor, recarga la página.</p>';
    }
}

// ==========================================
// 4. FUNCIONES GLOBALES DE INTERACCIÓN
// ==========================================
window.seleccionarTalla = function(event, idUnico, talla, nombrePrenda) {
    const contenedorTallas = document.getElementById(`tallas-${idUnico}`);
    const botones = contenedorTallas.querySelectorAll('.btn-talla');
    botones.forEach(btn => btn.classList.remove('activa'));
    event.target.classList.add('activa');

    const btnWsp = document.getElementById(`btn-wsp-${idUnico}`);
    btnWsp.classList.remove('btn-bloqueado');
    btnWsp.innerText = `Pedir talla ${talla} por WhatsApp`;
    
    const mensaje = `Hola CROSS, me interesa la prenda: ${nombrePrenda}. Deseo pedir la talla: ${talla}. ¿Tienen stock disponible para coordinar la entrega en tienda?`;
    btnWsp.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    btnWsp.target = "_blank"; 
    btnWsp.style.pointerEvents = "auto"; 
};

// ==========================================
// 5. ENRUTADOR (ROUTER) PRINCIPAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Lógica del Menú Hamburguesa
    const btnMenu = document.getElementById('btn-menu');
    if (btnMenu && UI.elementos.navMenu) {
        btnMenu.addEventListener('click', () => {
            UI.elementos.navMenu.classList.toggle('mostrar');
        });
    }

    // Lógica de Vistas
    const detalleContainer = document.getElementById('detalle-producto');
    const urlParams = new URLSearchParams(window.location.search);
    
    if (UI.elementos.catalogoContenedor) {
        const categoriaSeleccionada = urlParams.get('categoria');

        if (categoriaSeleccionada) {
            UI.renderizarCategoria();
            cargarCatalogo(categoriaSeleccionada);
        } else {
            UI.renderizarInicio();
        }
        UI.resaltarMenuActivo(categoriaSeleccionada);
            
    } else if (detalleContainer) {
        const idProducto = urlParams.get('id');
        if (idProducto) {
            detalleContainer.innerHTML = '<p class="cargando">Cargando detalles de la prenda...</p>';
            client.getEntry(idProducto)
                .then(prenda => {
                    detalleContainer.innerHTML = '<h2>¡Conexión exitosa! Falta armar la vista individual de producto.</h2>';
                })
                .catch(error => {
                    detalleContainer.innerHTML = '<p>Error al cargar la prenda.</p>';
                });
        }
    }
});
