# Daftar Fitur dan Sumber Data di APMMS

Berikut adalah daftar menu/fitur di aplikasi APMMS beserta sumber data yang digunakan dari database PostgreSQL.

---

## 1. Login & Register
- **Tabel**: `users`
- **Keterangan**: Menyimpan data pengguna (username, email, password hash, role)
- **Aksi**:
  - Login: Membaca data `users` untuk verifikasi
  - Register: Menambah data baru ke `users`

---

## 2. Dashboard
- **Tabel**: 
  - `DATA_INQUIRY`
  - `CUST_MASTER`
  - `VENDOR_MASTER`
  - `VENDOR_PRICE`
- **Endpoint**: `/api/stats`
- **Keterangan**:
  - Menampilkan total inquiry (dari `DATA_INQUIRY`)
  - Menampilkan total customer (dari `CUST_MASTER`)
  - Menampilkan total vendor (dari `VENDOR_MASTER`)
  - Menampilkan master item aktif (dari `VENDOR_PRICE`)
  - Menampilkan inquiry terbaru (dari `DATA_INQUIRY`)

---

## 3. Inquiry List
- **Tabel**: `DATA_INQUIRY`
- **Endpoint**: `/api/inquiries`
- **Kolom di Database**:
  | Nama Kolom | Keterangan |
  |------------|------------|
  | `Data Status` | Status data (Complete / Tidak Complete) |
  | `Sales Name` | Nama sales yang menangani |
  | `Inquiry ID` | ID unik inquiry |
  | `Purchasing Officer` | Petugas purchasing |
  | `Inquiry Date` | Tanggal inquiry |
  | `Aging (Days)` | Umur inquiry (dalam hari) |
  | `Customer Type` | Tipe customer (Bengkel dll) |
  | `Customer Name` | Nama customer |
  | `Part Number` | Nomor part |
  | `Workshop Part Name` | Nama part di workshop |
  | `Part Name` | Nama part |
  | `Brand ` | Merk part |
  | `Model ` | Model kendaraan |
  | `Year ` | Tahun kendaraan |
  | `ATPM Price` | Harga ATPM |
  | `UOM ` | Unit of Measure (satuan) |
  | `Progress Notes` | Catatan progress |
  | `Item Status` | Status item (Purchased dll) |
  | `Status Reason` | Alasan status |
  | `Vendor ID` | ID vendor |
  | `Vendor Name` | Nama vendor |
  | `HPP ` | Harga Pokok Penjualan |
  | `Category Part` | Kategori part |
  | `Total HPP` | Total HPP |
  | `Selling Price` | Harga jual |
  | `Diskon %` | Persentase diskon |
  | `Selling Price After Disc.` | Harga jual setelah diskon |
  | `Final Selling Price` | Harga jual final |
  | `Checklist PO` | Checklist PO (TRUE/FALSE) |
  | `No. PO` | Nomor PO |
  | `PO Date` | Tanggal PO |
  | `PROCUREMNT NAME FIX` | Nama procurement |
  | `ID FIX` | ID tetap |
  | `SALES NAME FIX` | Nama sales tetap |
- **Filter**:
  - Customer (berdasarkan `Customer_Name`)
  - Status (berdasarkan `Data_Status`)
  - Search (berdasarkan `Inquiry_ID`, `Customer_Name`, `Part_Number`, `Part_Name`)
- **Fitur**:
  - Menampilkan daftar inquiry dengan pagination (15 data/halaman)
  - Export ke CSV & Excel
  - Reset filter

---

## 4. Input Inquiry
- **Catatan**: Saat ini fitur ini hanya menampilkan form (belum terhubung ke database)
- **Fitur**: Form untuk input inquiry baru (masih dummy)

---

## 5. Master Items
- **Tabel**: `VENDOR_PRICE`
- **Endpoint**: `/api/master-items`
- **Filter**:
  - Brand (berdasarkan `Brand`)
  - Model (berdasarkan `Model`)
  - Search (berdasarkan `Int__Part_Number`, `Part_Name`, `Brand`, `Model`)
- **Fitur**:
  - Menampilkan daftar master item dengan pagination (15 data/halaman)
  - Export ke CSV & Excel
  - Reset filter

---

## 6. Request List
- **Tabel**: `new_item_requests`
- **Endpoint**: `/api/requests`
- **Keterangan**:
  - Menampilkan daftar permintaan item baru
  - Validator dapat approve/reject permintaan
  - Approver dapat approve/reject permintaan
  - Menampilkan status permintaan dan riwayat approval

---

## 7. New Item Request
- **Tabel**: `new_item_requests`
- **Endpoint**: `POST /api/new-item-request`
- **Keterangan**:
  - Form untuk mengajukan permintaan item baru
  - Menyimpan data ke `new_item_requests` dengan status awal "validation"

---

## 8. Flow Sistem Singkat

1. Data dari Google Spreadsheet disinkronkan ke PostgreSQL.
2. User login ke sistem sesuai role masing-masing.
3. User melihat Dashboard untuk monitoring data utama.
4. User membuka `Inquiries` untuk melihat kebutuhan part dan detail inquiry.
5. User membuka `Master Items` untuk mengecek apakah item sudah tersedia di master.
6. Jika item sudah ada, data master item dipakai sebagai referensi proses lanjut.
7. Jika item belum ada, user membuat `New Item Request`.
8. Request diproses oleh `validator` lalu `approver`.
9. Semua data dapat dipantau kembali melalui Dashboard, Inquiry List, Request List, dan Master Items.

---

## Daftar Tabel Utama di Database
| Nama Tabel | Fungsi |
|------------|--------|
| `users` | Data pengguna sistem (admin, validator, approver, requester) |
| `DATA_INQUIRY` | Data transaksi inquiry |
| `CUST_MASTER` | Data master customer |
| `VENDOR_MASTER` | Data master vendor |
| `VENDOR_PRICE` | Data master item beserta harga vendor |
| `DATA_TRACKING` | Data tracking (belum terintegrasi penuh) |
| `LOGBOOK_BA` | Logbook BA (belum terintegrasi penuh) |
| `Quotation_Generator` | Data quotation (belum terintegrasi penuh) |
| `Cost_Saving_calculator` | Data cost saving (belum terintegrasi penuh) |
| `new_item_requests` | Data permintaan item baru |
