// ==========================================
// 1. FUNGSI GLOBAL (Bisa dipakai di semua halaman)
// ==========================================
const rupiah = (value) => "Rp. " + Number(value || 0).toLocaleString("id-ID");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}

// ==========================================
// 2. JALANKAN SAAT HALAMAN SELESAI DIMUAT
// ==========================================
document.addEventListener("DOMContentLoaded", function () {

    // --- Set Nama Admin (Berlaku untuk semua halaman) ---
    const adminNameEl = document.getElementById("adminName");
    if (adminNameEl) {
        adminNameEl.textContent = sessionStorage.getItem("myshopUsername") || "Admin";
    }

    // --- Deteksi Halaman & Jalankan Fitur ---

    // A. Jika di halaman Dashboard (Deteksi ada form pencariannya)
    if (document.getElementById("searchForm") && document.getElementById("searchInput")) {
        initDashboard();
    }

    // B. Jika di halaman Kasir (Deteksi ada keranjang belanjanya)
    if (document.getElementById("addToCart") && document.getElementById("cartBody")) {
        initKasir();
    }

    // C. Jika di halaman Produk (Deteksi ada form produknya)
    if (document.getElementById("productForm") && document.getElementById("productTableBody")) {
        initProduk();
    }

    // D. Jika di halaman Riwayat (Deteksi ada tabel riwayatnya)
    if (document.getElementById("historyBody") && document.getElementById("historySearch")) {
        initRiwayat();
    }
});


// ==========================================
// 3. KUMPULAN FUNGSI MASING-MASING HALAMAN
// ==========================================

// --- LOGIKA HALAMAN DASHBOARD ---
function initDashboard() {
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const keyword = searchInput.value.trim().toLowerCase();
        const rows = document.querySelectorAll("#productTable tr");
        rows.forEach(function (row) {
            row.style.display = row.textContent.toLowerCase().includes(keyword) ? "" : "none";
        });
    });

    searchInput.addEventListener("input", function () {
        if (this.value.trim() === "") {
            document.querySelectorAll("#productTable tr").forEach(function (row) {
                row.style.display = "";
            });
        }
    });

    // Efek sidebar active
    document.querySelectorAll(".sidebar .nav-link").forEach(function (link) {
        link.addEventListener("click", function () {
            if (this.getAttribute("href").startsWith("#")) {
                document.querySelectorAll(".sidebar .nav-link").forEach(function (item) {
                    item.classList.remove("active");
                });
                this.classList.add("active");
            }
        });
    });
}

// --- LOGIKA HALAMAN KASIR ---
function initKasir() {
    const defaultProducts = [
        { kode: "MRN10", nama: "Donat", kategori: "Makanan", harga: 5000, stok: 6 },
        { kode: "MNM09", nama: "Teh Pucuk", kategori: "Minuman", harga: 4000, stok: 2 }
    ];

    let products = defaultProducts;
    try {
        const savedProducts = JSON.parse(localStorage.getItem("products") || "null");
        if (Array.isArray(savedProducts) && savedProducts.length > 0) {
            products = savedProducts.map(p => ({
                kode: p.kode ?? p.kodeProduk ?? "",
                nama: p.nama ?? p.namaProduk ?? "",
                kategori: p.kategori ?? "Lainnya",
                harga: Number(p.harga) || 0,
                stok: Number(p.stok) || 0
            }));
        }
    } catch (error) {
        console.warn("Data produk tidak dapat dibaca.", error);
    }

    let cart = [];
    const productSearch = document.getElementById("productSearch");
    const quantityInput = document.getElementById("quantity");
    const productOptions = document.getElementById("productOptions");
    const productMessage = document.getElementById("productMessage");

    function findProduct(value) {
        const search = value.trim().toLowerCase();
        return products.find(p => String(p.nama).toLowerCase() === search || String(p.kode).toLowerCase() === search);
    }

    function updateProductOptions() {
        productOptions.innerHTML = products.map(p => `<option value="${escapeHTML(p.nama)}">${escapeHTML(p.kode)} - ${rupiah(p.harga)}</option>`).join("");
    }

    function updateSubtotal() {
        const product = findProduct(productSearch.value);
        const qty = Math.max(1, Number(quantityInput.value) || 1);
        document.getElementById("subtotal").textContent = product ? rupiah(product.harga * qty) : "Rp. 0";
    }

    productSearch.addEventListener("input", updateSubtotal);
    quantityInput.addEventListener("input", updateSubtotal);
    document.getElementById("plusBtn").addEventListener("click", () => { quantityInput.value = Math.max(1, Number(quantityInput.value) || 1) + 1; updateSubtotal(); });
    document.getElementById("minusBtn").addEventListener("click", () => { quantityInput.value = Math.max(1, Number(quantityInput.value) - 1); updateSubtotal(); });

    document.getElementById("addToCart").addEventListener("click", () => {
        const product = findProduct(productSearch.value);
        const qty = Math.floor(Number(quantityInput.value));

        if (!product) {
            productMessage.className = "mt-2 text-danger"; productMessage.textContent = "Produk tidak ditemukan. Pilih produk dari daftar."; return;
        }
        if (!Number.isInteger(qty) || qty < 1) {
            productMessage.className = "mt-2 text-danger"; productMessage.textContent = "Jumlah harus minimal 1."; return;
        }

        const existing = cart.find(item => item.kode === product.kode);
        const currentQty = existing ? existing.qty : 0;
        if (currentQty + qty > product.stok) {
            productMessage.className = "mt-2 text-danger"; productMessage.textContent = `Stok ${product.nama} hanya ${product.stok}.`; return;
        }

        if (existing) { existing.qty += qty; } else { cart.push({ kode: product.kode, nama: product.nama, harga: product.harga, qty: qty }); }

        productSearch.value = ""; quantityInput.value = 1;
        productMessage.className = "mt-2 text-success"; productMessage.textContent = "Produk ditambahkan ke keranjang.";
        updateSubtotal(); renderCart();
    });

    function renderCart() {
        const cartBody = document.getElementById("cartBody");
        if (cart.length === 0) {
            cartBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">Keranjang masih kosong</td></tr>`;
        } else {
            cartBody.innerHTML = cart.map((item, index) => `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${escapeHTML(item.nama)}</td>
                <td>${rupiah(item.harga)}</td>
                <td class="text-center">${item.qty}</td>
                <td>${rupiah(item.harga * item.qty)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger" data-remove="${index}" aria-label="Hapus ${escapeHTML(item.nama)}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`).join("");
        }

        const total = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
        document.getElementById("itemCount").textContent = cart.reduce((sum, item) => sum + item.qty, 0);
        document.getElementById("total").textContent = rupiah(total);
        updateChange();
    }

    document.getElementById("cartBody").addEventListener("click", event => {
        const button = event.target.closest("[data-remove]");
        if (!button) return;
        cart.splice(Number(button.dataset.remove), 1);
        renderCart();
    });

    function updateChange() {
        const total = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
        const payment = Number(document.getElementById("payment").value) || 0;
        document.getElementById("change").textContent = rupiah(Math.max(0, payment - total));
    }

    document.getElementById("payment").addEventListener("input", updateChange);

    document.getElementById("cancelBtn").addEventListener("click", () => {
        if (cart.length > 0 && !confirm("Kosongkan keranjang belanja?")) return;
        cart = []; document.getElementById("payment").value = "";
        document.getElementById("transactionMessage").textContent = ""; productMessage.textContent = "";
        renderCart();
    });

    document.getElementById("saveTransaction").addEventListener("click", () => {
        const total = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
        const payment = Number(document.getElementById("payment").value) || 0;
        const message = document.getElementById("transactionMessage");

        if (cart.length === 0) { message.className = "mt-3 text-end text-danger"; message.textContent = "Keranjang masih kosong."; return; }
        if (payment < total) { message.className = "mt-3 text-end text-danger"; message.textContent = "Uang pembayaran belum mencukupi."; return; }

        for (const item of cart) {
            const product = products.find(p => p.kode === item.kode);
            if (!product || product.stok < item.qty) {
                message.className = "mt-3 text-end text-danger"; message.textContent = `Stok ${item.nama} tidak mencukupi.`; return;
            }
        }

        cart.forEach(item => { const product = products.find(p => p.kode === item.kode); product.stok -= item.qty; });

        const transaction = { id: Date.now(), tanggal: new Date().toISOString(), items: cart.map(item => ({ ...item })), total: total, bayar: payment, kembalian: payment - total };
        const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
        transactions.push(transaction);
        localStorage.setItem("transactions", JSON.stringify(transactions));
        localStorage.setItem("products", JSON.stringify(products));

        message.className = "mt-3 text-end text-success"; message.textContent = "Transaksi berhasil disimpan.";
        cart = []; document.getElementById("payment").value = "";
        renderCart(); updateProductOptions(); productSearch.value = ""; quantityInput.value = 1; updateSubtotal();
    });

    const globalSearchForm = document.getElementById("globalSearch");
    if (globalSearchForm) {
        globalSearchForm.addEventListener("submit", event => {
            event.preventDefault();
            const query = document.getElementById("globalSearchInput").value.trim();
            if (query) {
                productSearch.value = query;
                updateSubtotal();
                productSearch.focus();
            }
        });
    }

    updateProductOptions();
    renderCart();
}

// --- LOGIKA HALAMAN PRODUK ---
function initProduk() {
    const productForm = document.getElementById("productForm");
    const tableBody = document.getElementById("productTableBody");
    const productModal = document.getElementById("productModal");
    let products = [];
    let modalInstance = bootstrap.Modal.getOrCreateInstance(productModal);

    // Didaftarkan ke 'window' agar bisa dipanggil oleh tombol di file HTML (onclick="prepareAdd()")
    window.prepareAdd = function () {
        productForm.reset();
        document.getElementById("editIndex").value = "-1";
        document.getElementById("modalTitle").textContent = "Tambah Produk";
    }

    window.editProduct = function (index) {
        const p = products[index];
        document.getElementById("editIndex").value = index;
        document.getElementById("productName").value = p.name;
        document.getElementById("productCategory").value = p.category;
        document.getElementById("productCode").value = p.code;
        document.getElementById("productPrice").value = p.price;
        document.getElementById("productStock").value = p.stock;
        document.getElementById("modalTitle").textContent = "Edit Produk";
        modalInstance.show();
    }

    window.deleteProduct = function (index) {
        if (confirm("Yakin ingin menghapus produk ini?")) { products.splice(index, 1); renderProducts(); }
    }

    function renderProducts() {
        const search = document.getElementById("productSearch").value.toLowerCase();
        const category = document.getElementById("categoryFilter").value;
        const filtered = products.filter(p => p.name.toLowerCase().includes(search) && (!category || p.category === category));
        tableBody.innerHTML = "";

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary">Tidak ada produk yang ditemukan.</td></tr>`;
            return;
        }

        filtered.forEach(p => {
            const index = products.indexOf(p);
            const row = document.createElement("tr");
            [index + 1, p.name, p.category, "Rp " + Number(p.price).toLocaleString("id-ID"), p.stock].forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });
            const actions = document.createElement("td");

            const edit = document.createElement("button");
            edit.type = "button"; edit.className = "action-btn edit-btn"; edit.innerHTML = '<i class="fa-solid fa-pen"></i>';
            edit.onclick = () => window.editProduct(index);

            const del = document.createElement("button");
            del.type = "button"; del.className = "action-btn delete-btn"; del.innerHTML = '<i class="fa-solid fa-trash"></i>';
            del.onclick = () => window.deleteProduct(index);

            actions.append(edit, del);
            row.appendChild(actions);
            tableBody.appendChild(row);
        });
    }

    productForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const editIndex = Number(document.getElementById("editIndex").value);
        const code = document.getElementById("productCode").value.trim();
        const duplicate = products.some((p, i) => p.code.toLowerCase() === code.toLowerCase() && i !== editIndex);
        if (duplicate) { alert("Kode produk sudah digunakan!"); return; }
        const product = {
            name: document.getElementById("productName").value.trim(), category: document.getElementById("productCategory").value,
            code, price: Number(document.getElementById("productPrice").value), stock: Number(document.getElementById("productStock").value)
        };
        if (editIndex >= 0) { products[editIndex] = product; } else { products.push(product); }
        renderProducts(); modalInstance.hide(); productForm.reset();
    });

    document.getElementById("productSearch").addEventListener("input", renderProducts);
    document.getElementById("categoryFilter").addEventListener("change", renderProducts);

    const globalSearchForm = document.getElementById("globalSearch");
    if (globalSearchForm) {
        globalSearchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            document.getElementById("productSearch").value = document.getElementById("globalSearchInput").value;
            renderProducts();
        });
    }

    renderProducts();
}

// --- LOGIKA HALAMAN RIWAYAT ---
function initRiwayat() {
    function getTransactions() {
        try {
            const data = JSON.parse(localStorage.getItem("transactions") || "[]");
            return Array.isArray(data) ? data : [];
        } catch { return []; }
    }

    let transactions = getTransactions();
    let selectedTransaction = null;

    const historyBody = document.getElementById("historyBody");
    const historySearch = document.getElementById("historySearch");
    const dateFilter = document.getElementById("dateFilter");

    function getDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(value) {
        const date = getDate(value);
        if (!date) return "-";
        return date.toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    function matchesDate(transaction) {
        const date = getDate(transaction.tanggal);
        if (!date) return dateFilter.value === "all";
        const now = new Date();

        if (dateFilter.value === "today") { return date.toDateString() === now.toDateString(); }
        if (dateFilter.value === "week") {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            return date >= sevenDaysAgo && date <= now;
        }
        if (dateFilter.value === "month") { return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }
        return true;
    }

    function renderHistory() {
        transactions = getTransactions();
        const query = historySearch.value.trim().toLowerCase();

        const filtered = transactions.filter(transaction => {
            const number = String(transaction.id ?? "");
            const date = formatDate(transaction.tanggal);
            const items = (transaction.items || []).map(item => item.nama).join(" ");
            const matchesSearch = number.toLowerCase().includes(query) || date.toLowerCase().includes(query) || items.toLowerCase().includes(query);
            return matchesSearch && matchesDate(transaction);
        });

        if (filtered.length === 0) {
            historyBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Belum ada transaksi yang ditemukan.</td></tr>`; return;
        }

        historyBody.innerHTML = filtered.map((transaction, index) => `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td>TRX-${escapeHTML(transaction.id)}</td>
            <td>${escapeHTML(formatDate(transaction.tanggal))}</td>
            <td>${rupiah(transaction.total)}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-primary" data-detail="${escapeHTML(transaction.id)}">
                    <i class="fa-solid fa-eye me-1"></i>Detail
                </button>
            </td>
        </tr>
        `).join("");
    }

    function showDetail(transaction) {
        selectedTransaction = transaction;
        document.getElementById("detailNumber").textContent = "TRX-" + transaction.id;
        document.getElementById("detailDate").textContent = formatDate(transaction.tanggal);

        const items = transaction.items || [];
        const detailBody = document.getElementById("detailBody");

        if (items.length === 0) {
            detailBody.innerHTML = `<tr><td colspan="3">Tidak ada detail item.</td></tr>`;
        } else {
            detailBody.innerHTML = items.map(item => `
            <tr>
                <td>${escapeHTML(item.nama)}</td>
                <td class="text-center">${Number(item.qty) || 0}</td>
                <td>${rupiah((Number(item.harga) || 0) * (Number(item.qty) || 0))}</td>
            </tr>
        `).join("");
        }

        document.getElementById("detailTotal").textContent = rupiah(transaction.total);
        document.getElementById("detailPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    historyBody.addEventListener("click", event => {
        const button = event.target.closest("[data-detail]");
        if (!button) return;
        const transaction = getTransactions().find(item => String(item.id) === button.dataset.detail);
        if (transaction) showDetail(transaction);
    });

    document.getElementById("filterButton").addEventListener("click", () => { renderHistory(); });
    historySearch.addEventListener("input", renderHistory);
    dateFilter.addEventListener("change", renderHistory);

    const globalSearchForm = document.getElementById("globalSearch");
    if (globalSearchForm) {
        globalSearchForm.addEventListener("submit", event => {
            event.preventDefault();
            historySearch.value = document.getElementById("globalSearchInput").value;
            renderHistory();
        });
    }

    document.getElementById("backButton").addEventListener("click", () => {
        document.getElementById("detailNumber").textContent = "Pilih transaksi";
        document.getElementById("detailDate").textContent = "-";
        document.getElementById("detailBody").innerHTML = `<tr><td colspan="3" class="text-center">Belum ada transaksi dipilih</td></tr>`;
        document.getElementById("detailTotal").textContent = "Rp. 0";
        selectedTransaction = null;
    });

    window.addEventListener("storage", event => {
        if (event.key === "transactions") renderHistory();
    });

    renderHistory();
}