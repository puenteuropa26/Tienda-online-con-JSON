const gridProductos = document.getElementById("product-grid");
const categoryButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sort-select");

const btnCarrito = document.getElementById("btn-carrito");
const cartCounter = document.getElementById("carrito-count");
const cartModal = document.getElementById("cart-modal");
const closeCartBtn = document.getElementById("close-cart");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalText = document.getElementById("cart-total");

let listaArmas = [];
let carrito = [];
let categoriaActual = "all";
let ordenActual = "default";

document.addEventListener("DOMContentLoaded", () => {
    cargarCatalogo();
    inicializarEventos();
});

async function cargarCatalogo() {
    try {
        const respuesta = await fetch("products.json");
        listaArmas = await respuesta.json();
        filtrarYRenderizar();
    } catch (error) {
        console.error("Error al cargar el JSON:", error);
        gridProductos.innerHTML = "<p style='color: #ff4655;'>Error al cargar el arsenal.</p>";
    }
}

function inicializarEventos() {
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            categoryButtons.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            categoriaActual = e.target.getAttribute("data-category");
            filtrarYRenderizar();
        });
    });

    sortSelect.addEventListener("change", (e) => {
        ordenActual = e.target.value;
        filtrarYRenderizar();
    });

    if (btnCarrito) {
        btnCarrito.addEventListener("click", () => {
            if (cartModal) cartModal.style.display = "flex";
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener("click", () => {
            if (cartModal) cartModal.style.display = "none";
        });
    }
}

function filtrarYRenderizar() {
    let armasFiltradas = listaArmas.filter(arma => {
        if (categoriaActual === "all") return true;
        return arma.category.toLowerCase() === categoriaActual.toLowerCase();
    });

    if (ordenActual === "name-asc") {
        armasFiltradas.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderizarArmas(armasFiltradas);
}

function renderizarArmas(armas) {
    gridProductos.innerHTML = "";

    if (armas.length === 0) {
        gridProductos.innerHTML = "<p style='color: #8b9bb4;'>No hay armas disponibles en esta categoría.</p>";
        return;
    }

    armas.forEach(arma => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "weapon-card";

        const hayStock = arma.stock > 0;
        const textoStock = hayStock ? `STOCK: ${arma.stock} UDS` : "SIN STOCK";
        const colorStock = hayStock ? "#8b9bb4" : "#ff4655";
        const textoBoton = hayStock ? "AÑADIR" : "AGOTADO";
        const estadoBoton = hayStock ? "" : "disabled style='background-color: #3a4755; color: #768089; cursor: not-allowed; border-color: #3a4755;'";

        tarjeta.innerHTML = `
            <div class="card-header">
                <span class="weapon-category">${arma.category}</span>
                <span class="weapon-desc-short" style="color: ${colorStock}; font-weight: bold;">${textoStock}</span>
            </div>
            <div class="weapon-img-container">
                <img src="${arma.image}" alt="${arma.name}" class="weapon-img" style="${hayStock ? '' : 'opacity: 0.4;'}">
            </div>
            <h3 class="weapon-name">${arma.name}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                <span style="color: #ff4655; font-weight: bold; font-size: 18px;">${arma.price} VP</span>
                <button class="filter-btn btn-add" data-id="${arma.id}" ${estadoBoton}>${textoBoton}</button>
            </div>
        `;

        gridProductos.appendChild(tarjeta);
    });

    document.querySelectorAll(".btn-add:not([disabled])").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.target.getAttribute("data-id"));
            agregarAlCarrito(id);
        });
    });
}

function agregarAlCarrito(id) {
    const arma = listaArmas.find(a => a.id === id);
    const itemEnCarrito = carrito.find(item => item.id === id);

    if (itemEnCarrito) {
        if (itemEnCarrito.cantidad < arma.stock) {
            itemEnCarrito.cantidad++;
        } else {
            alert(`No puedes añadir más unidades. Máximo stock disponible: ${arma.stock}`);
        }
    } else {
        carrito.push({ ...arma, cantidad: 1 });
    }

    actualizarCarrito();
}

function actualizarCarrito() {
    const totalCantidad = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    if (cartCounter) cartCounter.textContent = totalCantidad;

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = "";
    let totalVP = 0;

    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = "<p style='color: #768089; text-align: center;'>El carrito está vacío.</p>";
    } else {
        carrito.forEach(item => {
            totalVP += item.price * item.cantidad;

            const row = document.createElement("div");
            row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #2b3b4c; color: white;";
            row.innerHTML = `
                <div>
                    <strong>${item.name}</strong>
                    <div style="font-size: 12px; color: #ff4655;">${item.price} VP x ${item.cantidad}</div>
                </div>
                <div>
                    <button onclick="cambiarCantidad(${item.id}, -1)" style="background:#1f2b37; color:white; border:1px solid #ff4655; padding: 2px 8px; cursor:pointer;">-</button>
                    <span style="margin: 0 8px;">${item.cantidad}</span>
                    <button onclick="cambiarCantidad(${item.id}, 1)" style="background:#1f2b37; color:white; border:1px solid #ff4655; padding: 2px 8px; cursor:pointer;">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(row);
        });
    }

    if (cartTotalText) cartTotalText.textContent = `${totalVP} VP`;
}

window.cambiarCantidad = function(id, cambio) {
    const item = carrito.find(i => i.id === id);
    const arma = listaArmas.find(a => a.id === id);

    if (item) {
        if (cambio > 0 && item.cantidad >= arma.stock) {
            alert(`No puedes añadir más unidades. Máximo stock disponible: ${arma.stock}`);
            return;
        }

        item.cantidad += cambio;

        if (item.cantidad <= 0) {
            carrito = carrito.filter(i => i.id !== id);
        }
    }
    actualizarCarrito();
};