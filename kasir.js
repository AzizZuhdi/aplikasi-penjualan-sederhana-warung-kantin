document.addEventListener("DOMContentLoaded", function () {
    // ===== AMBIL ELEMEN HTML =====
    const productInput = document.querySelector('input[name="produk"]');
    const qtyInput = document.querySelector('input[name="qty"]');
    const productOptions = document.getElementById("productOptions");

    const inputForm = productInput.closest("form");
    const paymentForm = document.querySelector(".cart-panel form");
    const cartBody = document.querySelector(".cart-table tbody");
    const cartTitle = document.querySelector(".cart-title");
    const subtotalText = document.querySelector(".subtotal-text span");
    const totalText = document.querySelector(".cart-summary span");
    const paymentInput = paymentForm.querySelector('input[name="bayar"]');
    const changeText = paymentForm.querySelector(".mt-2 strong");

    let cart = [];

    // ===== DATA PRODUK =====
    function getProducts() {
        try {
            const data = JSON.parse(localStorage.getItem("products") || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    function getName(p) {
        return String(p.nama ?? p.namaProduk ?? p.name ?? "");
    }

    function getCode(p) {
        return String(p.kode ?? p.kodeProduk ?? p.code ?? "");
    }

    function getPrice(p) {
        return Number(p.harga ?? p.price ?? 0);
    }

    function getStock(p) {
        return Number(p.stok ?? p.stock ?? 0);
    }

    function rupiah(number) {
        return "Rp. " + Number(number).toLocaleString("id-ID");
    }

    // ===== PESAN STOK MERAH =====
    const errorMessage = document.createElement("div");
    errorMessage.style.color = "red";
    errorMessage.style.fontWeight = "bold";
    errorMessage.style.fontSize = "13px";
    errorMessage.style.marginTop = "5px";
    errorMessage.style.display = "none";

    qtyInput.insertAdjacentElement("afterend", errorMessage);

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        qtyInput.style.borderColor = "red";
    }

    function clearError() {
        errorMessage.style.display = "none";
        qtyInput.style.borderColor = "";
    }

    // ===== MUAT PRODUK DARI HALAMAN PRODUK =====
    function loadProducts() {
        const products = getProducts();
        productOptions.innerHTML = "";

        products.forEach(function (p) {
            const nameOption = document.createElement("option");
            nameOption.value = getName(p);
            nameOption.label = "Kode: " + getCode(p);
            productOptions.appendChild(nameOption);

            // Kode produk juga bisa dicari
            const codeOption = document.createElement("option");
            codeOption.value = getCode(p);
            codeOption.label = getName(p);
            productOptions.appendChild(codeOption);
        });
    }

    function findProduct(value) {
        const search = value.trim().toLowerCase();

        return getProducts().find(function (p) {
            return (
                getName(p).toLowerCase() === search ||
                getCode(p).toLowerCase() === search
            );
        });
    }

    // Jumlah produk yang sudah ada di keranjang
    function getCartQty(product) {
        const code = getCode(product);

        return cart
            .filter(item => item.code === code)
            .reduce((sum, item) => sum + item.qty, 0);
    }

    // ===== VALIDASI QTY DAN STOK =====
    function validateStock() {
        const product = findProduct(productInput.value);
        const qty = Number(qtyInput.value);

        if (!product) {
            clearError();
            return false;
        }

        if (!Number.isInteger(qty) || qty < 1) {
            showError("JUMLAH MINIMAL 1");
            return false;
        }

        const availableStock = getStock(product) - getCartQty(product);

        if (qty > availableStock) {
            showError("JUMLAH MELEBIHI STOK");
            return false;
        }

        clearError();
        return true;
    }

    // ===== SUBTOTAL BERUBAH OTOMATIS =====
    function updateSubtotal() {
        const product = findProduct(productInput.value);
        const qty = Number(qtyInput.value);

        if (product && Number.isInteger(qty) && qty > 0) {
            subtotalText.textContent = rupiah(getPrice(product) * qty);
        } else {
            subtotalText.textContent = rupiah(0);
        }

        validateStock();
    }

    productInput.addEventListener("input", updateSubtotal);
    qtyInput.addEventListener("input", updateSubtotal);

    // ===== TAMBAH KE KERANJANG =====
    inputForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const product = findProduct(productInput.value);

        if (!product) {
            showError("PRODUK TIDAK DITEMUKAN");
            return;
        }

        if (!validateStock()) return;

        const code = getCode(product);
        const qty = Number(qtyInput.value);

        const existingItem = cart.find(item => item.code === code);

        if (existingItem) {
            existingItem.qty += qty;
        } else {
            cart.push({
                code: code,
                name: getName(product),
                price: getPrice(product),
                qty: qty
            });
        }

        renderCart();

        productInput.value = "";
        qtyInput.value = 1;
        clearError();
        updateSubtotal();
        productInput.focus();
    });

    // ===== TAMPILKAN TABEL KERANJANG =====
    function renderCart() {
        cartBody.innerHTML = "";

        if (cart.length === 0) {
            cartBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Keranjang masih kosong
                    </td>
                </tr>`;
        }

        cart.forEach(function (item, index) {
            const row = document.createElement("tr");

            [
                index + 1,
                item.name,
                rupiah(item.price),
                item.qty,
                rupiah(item.price * item.qty)
            ].forEach(function (value) {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });

            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className = "btn btn-danger btn-sm";
            deleteButton.textContent = "Hapus";

            deleteButton.addEventListener("click", function () {
                cart.splice(index, 1);
                renderCart();
                updateSubtotal();
            });

            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);
            cartBody.appendChild(row);
        });

        const total = getTotal();
        const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

        cartTitle.innerHTML =
            `Keranjang Belanja (<span>${totalQty}</span> Item)`;

        totalText.textContent = rupiah(total);
        updateChange();
    }

    function getTotal() {
        return cart.reduce(
            (sum, item) => sum + item.price * item.qty,
            0
        );
    }

    // ===== HITUNG KEMBALIAN =====
    function updateChange() {
        const bayar = Number(paymentInput.value) || 0;
        const total = getTotal();

        changeText.textContent = rupiah(Math.max(0, bayar - total));
    }

    paymentInput.addEventListener("input", updateChange);

    // ===== SIMPAN TRANSAKSI =====
    paymentForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (cart.length === 0) {
            alert("Keranjang masih kosong!");
            return;
        }

        const products = getProducts();

        // Periksa stok terbaru sebelum menyimpan
        for (const item of cart) {
            const product = products.find(
                p => getCode(p) === item.code
            );

            if (!product || getStock(product) < item.qty) {
                alert("Stok " + item.name + " tidak mencukupi!");
                return;
            }
        }

        const total = getTotal();
        const bayar = Number(paymentInput.value);

        if (!Number.isFinite(bayar) || bayar < total) {
            alert("Pembayaran kurang dari total belanja!");
            return;
        }

        // Kurangi stok produk
        cart.forEach(function (item) {
            const product = products.find(
                p => getCode(p) === item.code
            );

            if ("stok" in product) {
                product.stok = getStock(product) - item.qty;
            } else {
                product.stock = getStock(product) - item.qty;
            }
        });

        const transactions = JSON.parse(
            localStorage.getItem("transactions") || "[]"
        );

        transactions.push({
            id: "TRX-" + Date.now(),
            tanggal: new Date().toISOString(),
            items: cart.map(item => ({ ...item })),
            total: total,
            bayar: bayar,
            kembalian: bayar - total
        });

        try {
            // Simpan stok dan transaksi
            localStorage.setItem("products", JSON.stringify(products));
            localStorage.setItem("transactions", JSON.stringify(transactions));
        } catch (error) {
            alert("Gagal menyimpan transaksi!");
            return;
        }

        alert("Transaksi berhasil disimpan!");

        cart = [];
        inputForm.reset();
        paymentForm.reset();
        qtyInput.value = 1;

        loadProducts();
        renderCart();
        clearError();
        updateSubtotal();
    });

    // ===== TOMBOL BATAL =====
    const cancelButton = paymentForm.querySelector('button[type="reset"]');

    cancelButton.addEventListener("click", function (event) {
        event.preventDefault();

        cart = [];
        inputForm.reset();
        paymentForm.reset();
        qtyInput.value = 1;

        renderCart();
        clearError();
        updateSubtotal();
    });

    // ===== JALANKAN SAAT HALAMAN DIBUKA =====
    loadProducts();
    renderCart();
    updateSubtotal();
});