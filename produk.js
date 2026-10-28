document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("productForm");
    const tableBody = document.getElementById("productTableBody");

    const nama = document.getElementById("productName");
    const kategori = document.getElementById("productCategory");
    const kode = document.getElementById("productCode");
    const harga = document.getElementById("productPrice");
    const stok = document.getElementById("productStock");

    // Ambil data produk yang sudah tersimpan
    let products = JSON.parse(localStorage.getItem("products") || "[]");

    function formatRupiah(angka) {
        return "Rp. " + Number(angka).toLocaleString("id-ID");
    }

  
    function tampilkanProduk() {
        tableBody.innerHTML = "";

        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        Belum ada data produk
                    </td>
                </tr>`;
            return;
        }

        products.forEach(function (produk, index) {
            const baris = document.createElement("tr");

            [
                index + 1,
                produk.nama,
                produk.kategori,
                produk.kode,
                formatRupiah(produk.harga),
                produk.stok
            ].forEach(function (isi) {
                const td = document.createElement("td");
                td.textContent = isi;
                baris.appendChild(td);
            });

            const aksi = document.createElement("td");
            const tombolHapus = document.createElement("button");

            tombolHapus.type = "button";
            tombolHapus.textContent = "Hapus";
            tombolHapus.className = "btn btn-danger btn-sm";

            tombolHapus.addEventListener("click", function () {
                if (confirm("Yakin ingin menghapus produk ini?")) {
                    products.splice(index, 1);
                    simpanProduk();
                    tampilkanProduk();
                }
            });

            aksi.appendChild(tombolHapus);
            baris.appendChild(aksi);
            tableBody.appendChild(baris);
        });
    }

    function simpanProduk() {
        localStorage.setItem("products", JSON.stringify(products));
    }

    // Saat tombol Simpan Data ditekan
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const produkBaru = {
            nama: nama.value.trim(),
            kategori: kategori.value,
            kode: kode.value.trim(),
            harga: Number(harga.value),
            stok: Number(stok.value)
        };

        if (
            !produkBaru.nama ||
            !produkBaru.kategori ||
            !produkBaru.kode ||
            harga.value === "" ||
            stok.value === "" ||
            produkBaru.harga < 0 ||
            produkBaru.stok < 0
        ) {
            alert("Mohon isi semua data dengan benar!");
            return;
        }

        // Cek kode produk agar tidak duplikat
        const kodeDuplikat = products.some(function (p) {
            return p.kode.toLowerCase() === produkBaru.kode.toLowerCase();
        });

        if (kodeDuplikat) {
            alert("Kode produk sudah digunakan!");
            return;
        }

        products.push(produkBaru);

        try {
            simpanProduk();
        } catch (error) {
            products.pop();
            alert("Data gagal disimpan!");
            return;
        }

        tampilkanProduk();
        form.reset();

        alert("Produk berhasil disimpan!");
    });

    // Tampilkan data ketika halaman dibuka
    tampilkanProduk();
});