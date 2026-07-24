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
                    botonesTallas += `<button type="button" class="btn-talla" onclick="seleccionarTalla(event, '${idUnico}', '${talla}', '${campos.nombre}', '${campos.categoria || 'Prenda'}')">${talla}</button>`;
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
window.seleccionarTalla = function(event, idUnico, talla, nombrePrenda, categoriaPrenda) {
    const contenedorTallas = document.getElementById(`tallas-${idUnico}`);
    const botones = contenedorTallas.querySelectorAll('.btn-talla');
    botones.forEach(btn => btn.classList.remove('activa'));
    event.target.classList.add('activa');

    const btnWsp = document.getElementById(`btn-wsp-${idUnico}`);
    btnWsp.classList.remove('btn-bloqueado');
    btnWsp.innerText = `Pedir talla ${talla} por WhatsApp`;
    
    // Formateamos la categoría para que resalte (ej. POLERAS)
    const tipo = (categoriaPrenda || 'PRENDA').toUpperCase();
    
    // El mensaje ahora es completamente específico
    const mensaje = `Hola CROSS, me interesa la siguiente prenda: ${tipo} ${nombrePrenda}. Deseo pedir la talla: ${talla}. ¿Tienen stock disponible para coordinar la entrega`;
    
    btnWsp.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    btnWsp.target = "_blank"; 
    btnWsp.style.pointerEvents = "auto"; 
};

// ==========================================
// 5. RENDERIZADO VISTA INDIVIDUAL (PDP)
// ==========================================
function renderizarVistaDetalle(prenda) {
    const contenedor = document.getElementById('detalle-producto');
    const campos = prenda.fields;
    const idUnico = prenda.sys.id;
    const categoriaFormateada = (campos.categoria || 'prenda').toLowerCase().trim();
    
    // Armar el carrusel de imágenes de la prenda
    let galeriaHTML = '';
    campos.fotos.forEach(foto => {
        galeriaHTML += `<img src="https:${foto.fields.file.url}" alt="${campos.nombre}">`;
    });

    // Armar botones de tallas
    let botonesTallas = '';
    if (campos.enStock && campos.tallas && campos.tallas.length > 0) {
        campos.tallas.forEach(talla => {
            botonesTallas += `<button type="button" class="btn-talla" onclick="seleccionarTalla(event, '${idUnico}', '${talla}', '${campos.nombre}', '${categoriaFormateada}')">${talla}</button>`;
        });
    } else {
        botonesTallas = '<span style="color:#ff4444; font-weight:bold;">Agotado temporalmente</span>';
    }

    const html = `
        <div class="pdp-contenedor">
            <div class="pdp-galeria">
                ${galeriaHTML}
            </div>
            
            <div class="pdp-info">
                <h1>${campos.nombre}</h1>
                <p class="pdp-precio">S/ ${campos.precio.toFixed(2)}</p>
                
                <div class="pdp-tallas-header">
                    <span style="font-size: 0.9rem; color: #555;">Selecciona tu talla:</span>
                    <button class="btn-guia-tallas" onclick="abrirModalTallas()">📏 Guía de Tallas</button>
                </div>
                
                <div class="botones-tallas" id="tallas-${idUnico}" style="margin-bottom: 2rem;">
                    ${botonesTallas}
                </div>
                
                <a href="#" id="btn-wsp-${idUnico}" class="btn-comprar btn-bloqueado" style="width: 100%; padding: 1rem; font-size: 1.1rem;">Elige una talla</a>
            </div>
        </div>

        <!-- Componente Modal de Tallas Oculto -->
        <div class="modal-overlay" id="modal-tallas">
            <div class="modal-contenido">
                <button class="btn-cerrar-modal" onclick="cerrarModalTallas()">✕</button>
                <h3 style="text-align: center;">Medidas de ${categoriaFormateada.toUpperCase()}</h3>
                <!-- Carga la imagen dinámicamente según la categoría de la prenda actual -->
                <img src="img/tabla-${categoriaFormateada}.jpg" alt="Guía de tallas" onerror="this.onerror=null; this.src='img/logo-cross.png';">
            </div>
        </div>
    `;
    
    contenedor.innerHTML = html;
}

// Funciones para controlar el Modal
window.abrirModalTallas = () => document.getElementById('modal-tallas').classList.add('activo');
window.cerrarModalTallas = () => document.getElementById('modal-tallas').classList.remove('activo');

// Cerrar modal tocando fuera de la caja blanca
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-tallas');
    if (e.target === modal) cerrarModalTallas();
});

// ==========================================
// 6. ENRUTADOR (ROUTER) PRINCIPAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    const btnMenu = document.getElementById('btn-menu');
    if (btnMenu && UI.elementos.navMenu) {
        btnMenu.addEventListener('click', () => UI.elementos.navMenu.classList.toggle('mostrar'));
    }

    const detalleContainer = document.getElementById('detalle-producto');
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaSeleccionada = urlParams.get('categoria');
    
    if (UI.elementos.catalogoContenedor) {
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
            detalleContainer.innerHTML = '<p class="cargando" style="margin-top: 5rem;">Cargando detalles...</p>';
            client.getEntry(idProducto)
                .then(prenda => renderizarVistaDetalle(prenda))
                .catch(error => {
                    detalleContainer.innerHTML = '<p class="cargando">Error al cargar la prenda. Intenta nuevamente.</p>';
                });
        }
    }
});