# Panduan Sistem APMMS

## 1. Ringkasan Sistem

APMMS adalah sistem untuk mengelola kebutuhan part dari customer, proses review oleh purchasing, pengelolaan master item, dan monitoring status sampai harga jual final siap dipakai oleh sales.

Sistem ini dibentuk supaya:

- sales fokus menginput kebutuhan customer
- purchasing fokus mencari sumber part, menghitung harga internal, dan menentukan harga jual
- data sensitif seperti vendor, ATPM, cost, dan HPP tidak bocor ke role yang tidak berhak
- data inquiry dan item request lebih rapi, bisa dipantau, dan bisa diedit sesuai hak akses
- proses kerja tim tidak bergantung pada spreadsheet saja, tetapi sudah punya aturan akses dan alur kerja yang jelas

---

## 2. Kenapa Sistem Dibentuk Seperti Ini

Sistem ini mengikuti kebutuhan operasional yang memisahkan peran bisnis:

- **Sales** bertugas menerima kebutuhan customer dan mencatat detail inquiry
- **Purchasing** bertugas mengecek master item, vendor, harga modal, HPP, PO, dan menentukan selling price
- **Admin** dipertahankan sebagai akun full access untuk kebutuhan developer, debugging, pengecekan data, dan maintenance sistem

Alasan utama desain ini:

1. **Keamanan data internal**
   Sales tidak boleh melihat data internal purchasing seperti vendor, ATPM price, cost price, HPP, dan data procurement lainnya.

2. **Tanggung jawab kerja lebih jelas**
   Sales tidak menentukan harga modal maupun vendor. Purchasing yang memegang keputusan harga dan supply source.

3. **Monitoring lebih mudah**
   Setiap item request punya `Data Status`, `Tahap Proses`, `Progress Note`, `Status Reason`, dan `Aging Days`.

4. **Data per sales terisolasi**
   Setiap akun sales hanya bisa melihat inquiry dan item request miliknya sendiri.

5. **Master item dipisahkan dari inquiry**
   Input inquiry bukan berarti menambah stok atau master item. Penambahan part ke master item adalah area purchasing.

---

## 3. Role dan Hak Akses

### 3.1 Admin

Role `admin` adalah full access.

Hak admin:

- akses semua menu
- lihat semua data
- lihat data sensitif purchasing
- edit semua data sesuai flow yang tersedia
- dipakai untuk developer / maintenance / troubleshooting

### 3.2 Purchasing

Role `purchasing` adalah role operasional internal.

Hak purchasing:

- akses `Inquiry`
- akses `Input Item Request`
- akses `Item Request`
- akses `Master Item`
- lihat vendor, ATPM price, cost price, HPP, status ID, PO process, PO number, dan PO date
- edit pricing dan detail procurement
- tambah master item manual
- edit master item
- review dan melanjutkan tahap proses item request

### 3.3 Sales

Role `sales` adalah role operasional customer-facing.

Hak sales:

- akses `Input Inquiry`
- akses `Inquiry`
- akses `Item Request`
- hanya melihat inquiry miliknya sendiri
- hanya melihat item request miliknya sendiri
- bisa edit data utama, gambar, lampiran, dan catatan pada item request miliknya
- hanya melihat **selling price final**

Sales **tidak boleh** melihat:

- vendor ID
- vendor name
- ATPM price
- cost price
- HPP
- status procurement internal
- data PO

Sales juga **tidak boleh** mengakses `Master Item`.

---

## 4. Aturan Utama Sistem

Berikut rule bisnis yang saat ini menjadi dasar sistem:

1. **Role resmi hanya 3**
   - `admin`
   - `purchasing`
   - `sales`

2. **Input Inquiry untuk sales bukan registrasi master item**
   Form ini hanya dipakai untuk mencatat kebutuhan customer.

3. **Master Item hanya untuk purchasing dan admin**
   Karena master item memuat data internal part, vendor, dan harga modal.

4. **Data sensitif purchasing disembunyikan di backend**
   Bukan hanya di frontend.

5. **Sales hanya melihat datanya sendiri**
   Filter ownership dipasang di API untuk inquiry dan item request.

6. **HPP dihitung di backend**
   Saat ini formula yang dipakai adalah:

   ```text
   HPP = 100% x Cost Price
   ```

7. **Data Status berbeda dengan Tahap Proses**
   - `Data Status` = apakah data item sudah lengkap atau belum
   - `Tahap Proses` = posisi alur kerja item request saat ini

8. **Aging Days dipakai untuk monitoring**
   Aturan warna:
   - kurang dari 3 hari: hijau
   - tepat 3 hari: kuning
   - lebih dari 3 hari: merah

---

## 5. Istilah Penting

### 5.1 Data Status

Dipakai untuk menunjukkan kelengkapan data.

Nilai utama:

- `Complete`
- `Tidak Complete`

Makna:

- **Complete**: data part, pricing, dan kebutuhan utama sudah lengkap
- **Tidak Complete**: masih menunggu data, harga, vendor, atau proses pengadaan

### 5.2 Tahap Proses

Dipakai untuk menunjukkan posisi workflow item request.

Label yang dilihat user:

- `Menunggu Review Purchasing`
- `Menunggu Konfirmasi Akhir`
- `Selesai Diproses`
- `Dikembalikan`

Secara internal sistem masih memakai kode status:

- `validation`
- `approval`
- `approved`
- `rejected`

### 5.3 Input Inquiry

Form khusus sales untuk mencatat kebutuhan customer.

### 5.4 Input Item Request

Form khusus purchasing/admin untuk membuat atau melengkapi item request dengan data procurement.

---

## 6. Alur Bisnis Sistem

### 6.1 Alur Sales

1. Sales login
2. Sales klik menu `Input Inquiry`
3. Sales mengisi kebutuhan customer:
   - Inquiry ID
   - Inquiry Date
   - Sales Name
   - Customer Name
   - Part Number (opsional)
   - Nama Part
   - Brand
   - Model
   - Series
   - Year
   - Nomor VIN
   - Gambar item
   - Lampiran
   - Total QTY
   - Catatan
4. Data tersimpan sebagai item request
5. Sales memantau progress di menu `Item Request`
6. Sales hanya melihat selling price final yang sudah ditetapkan purchasing

### 6.2 Alur Purchasing

1. Purchasing login
2. Purchasing membuka inquiry atau item request
3. Purchasing melengkapi data internal:
   - vendor
   - category part
   - ATPM price
   - cost price
   - HPP
   - selling price
   - status ID
   - PO process
   - PO number
   - PO date
   - progress note
   - status reason
4. Purchasing menentukan `Data Status`
5. Purchasing menjalankan tahap proses sampai item request selesai
6. Jika part perlu dimasukkan ke master, purchasing menambahkannya melalui `Master Item`

### 6.3 Alur Admin

Admin dapat mengakses seluruh flow untuk kebutuhan:

- pengecekan data
- pengujian sistem
- support user
- maintenance dan debugging

---

## 7. Cara Pemakaian per Menu

### 7.1 Login

User login memakai:

- username
- password

Setelah login, user diarahkan sesuai role:

- admin / purchasing: bisa masuk dashboard
- sales: diarahkan ke flow yang relevan untuk sales

### 7.2 Inquiry

Fungsi:

- melihat data inquiry
- membuka detail inquiry
- memantau data sesuai role

Aturan:

- sales hanya melihat inquiry miliknya sendiri
- purchasing dan admin dapat melihat lebih luas
- field sensitif inquiry tetap disembunyikan untuk sales

### 7.3 Input Inquiry

Khusus sales.

Fungsi:

- mencatat kebutuhan customer secara cepat

Catatan:

- ini **bukan** registrasi master item
- istilah dibuat khusus supaya sales tidak bingung

### 7.4 Item Request

Fungsi:

- memantau hasil input sales dan proses review purchasing
- melihat detail item request
- mengedit data sesuai hak akses

Aturan edit:

- sales: hanya informasi utama, gambar, lampiran, catatan
- purchasing/admin: bisa edit detail procurement dan pricing

### 7.5 Master Item

Khusus purchasing dan admin.

Fungsi:

- cek part yang sudah ada di master
- tambah master item manual
- edit master item

Master item memuat data seperti:

- part number
- part name
- workshop name
- brand
- model
- series
- year
- stock status
- stock qty
- vendor ID
- vendor name
- ATPM price
- cost price
- HPP
- selling price

---

## 8. Struktur Data Penting

### 8.1 Tabel Utama

- `users`
- `DATA_INQUIRY`
- `VENDOR_PRICE`
- `VENDOR_MASTER`
- `CUST_MASTER`
- `new_item_requests`

### 8.2 Tabel yang Paling Penting untuk Flow Baru

#### `new_item_requests`

Tabel ini dipakai untuk flow item request yang sekarang aktif.

Field penting:

- `request_number`
- `inquiry_id`
- `inquiry_date`
- `sales_name`
- `customer`
- `part_no`
- `part_name`
- `brand`
- `model`
- `series_type`
- `year`
- `quantity`
- `vin`
- `data_status`
- `status_reason`
- `progress_notes`
- `status_id`
- `po_process`
- `po_number`
- `po_date`
- `vendor_id`
- `vendor_name`
- `atpm_price`
- `cost_price`
- `hpp_idr`
- `selling_price`

---

## 9. Rules Keamanan dan Pembatasan Data

### 9.1 Pembatasan Data Sales

Sales hanya boleh membuka data miliknya sendiri.

Pembatasan berlaku di:

- list inquiry
- detail inquiry
- edit inquiry
- list item request
- detail item request
- edit item request

### 9.2 Field Sensitif

Field sensitif tidak boleh hanya disembunyikan di tampilan. Sistem menegakkan ini di backend.

Contoh field sensitif:

- vendor name
- vendor ID
- ATPM price
- cost price
- HPP
- procurement info
- PO info

### 9.3 Kecocokan Data Sales Lama

Untuk data inquiry lama, ownership sales dicocokkan berdasarkan nama sales pada data dan username user yang login.

Artinya:

- username sales sebaiknya konsisten dengan nama sales di data lama
- jika tidak cocok, data lama bisa tidak muncul ke akun sales tersebut

---

## 10. Kenapa Master Item Dipisahkan dari Input Inquiry

Ini salah satu alasan desain yang paling penting.

Jika `Input Inquiry` disamakan dengan `Master Item`, maka user sales bisa salah paham seolah mereka sedang mendaftarkan stok atau part internal perusahaan.

Padahal:

- sales hanya mencatat kebutuhan customer
- purchasing yang memutuskan apakah part masuk ke master item
- purchasing yang memegang struktur harga internal dan hubungan vendor

Pemisahan ini dibuat agar:

- istilah tidak membingungkan
- hak akses tetap aman
- data master tidak tercampur dengan data kebutuhan customer

---

## 11. Kenapa Admin Tetap Full Access

Secara bisnis, admin memang bukan role operasional seperti sales atau purchasing. Tetapi di sistem ini admin dipakai sebagai akun developer dan maintenance.

Karena itu admin tetap dibuat full access untuk:

- membantu pengecekan bug
- melihat data end-to-end
- menguji role dan flow
- mengoreksi data jika ada kasus khusus

Catatan:

- admin full access adalah keputusan sengaja
- pembatasan utama tetap berlaku untuk role operasional sales dan purchasing

---

## 12. Cara Menjalankan Sistem

### 12.1 Backend

```bash
cd backend
npm install
npm run dev
```

Pastikan file `.env` backend sudah berisi konfigurasi database dan JWT.

### 12.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

### 12.3 Database

Jalankan schema:

```bash
psql -U postgres -d postgres -f backend/schema.sql
```

### 12.4 Deployment Frontend + Backend Lokal

Karena frontend bisa di-deploy di Vercel sementara backend berjalan lokal, maka:

- backend dapat diekspos memakai ngrok
- frontend harus memanggil URL publik backend
- request ke ngrok perlu header `ngrok-skip-browser-warning: 1`

Lihat juga file:

- [NGROK-VERCEL-SETUP.md](file:///d:/Project/APMMS/NGROK-VERCEL-SETUP.md)

---

## 13. Ringkasan Singkat untuk Tim

Kalau dijelaskan paling sederhana:

- **Sales** input kebutuhan customer
- **Purchasing** cari part, vendor, hitung harga, dan tentukan selling price
- **Admin** full access untuk maintenance
- **Master Item** hanya untuk internal purchasing/admin
- **Input Inquiry** untuk sales bukan registrasi stok
- **Data Status** menunjukkan kelengkapan data
- **Tahap Proses** menunjukkan posisi alur kerja
- **Sales hanya melihat data miliknya sendiri**

---

## 14. Penutup

Sistem ini dibentuk bukan hanya untuk memindahkan spreadsheet ke web, tetapi untuk:

- merapikan tanggung jawab tiap tim
- menjaga kerahasiaan data internal purchasing
- mempercepat input kebutuhan customer
- memudahkan monitoring progres
- membuat flow bisnis lebih konsisten dan lebih aman

Kalau nanti sistem berkembang, dokumen ini sebaiknya ikut diperbarui setiap kali ada perubahan:

- role
- field penting
- aturan visibilitas data
- alur bisnis
- formula harga
