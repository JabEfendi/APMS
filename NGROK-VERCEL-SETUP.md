# Koneksi Vercel ke Backend Lokal dengan ngrok

Project ini bisa memakai backend lokal di laptop, tetapi frontend Vercel tidak bisa memanggil `http://localhost:3001` secara langsung. Gunakan `ngrok` untuk memberi URL publik sementara ke backend lokal.

## 1. Jalankan backend

```powershell
npm --prefix backend run dev
```

Pastikan backend berjalan di port `3001`.

## 2. Jalankan ngrok

Anda bisa memakai command berikut dari root project:

```powershell
npm --prefix backend run tunnel:ngrok
```

Jika pertama kali memakai ngrok:

1. Buat akun di `https://dashboard.ngrok.com/`
2. Salin authtoken
3. Jalankan sekali:

```powershell
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

Setelah itu jalankan lagi `npm --prefix backend run tunnel:ngrok`.

## 3. Ambil URL publik ngrok

ngrok akan memberikan URL seperti:

```text
https://abc123.ngrok-free.app
```

URL ini adalah base URL backend publik Anda untuk sementara.

## 4. Set environment variable di Vercel

Di project Vercel `apms-theta`:

1. Buka `Settings`
2. Buka `Environment Variables`
3. Tambahkan:

```env
VITE_API_BASE_URL=https://abc123.ngrok-free.app
```

4. Simpan
5. Redeploy project

## 5. CORS backend

Backend harus mengizinkan origin Vercel Anda. Contoh:

```env
CORS_ORIGIN=http://localhost:5173,https://apms-theta.vercel.app,https://www.apms-theta.vercel.app
```

## 6. Verifikasi

Tes URL backend ngrok:

```text
https://abc123.ngrok-free.app/api/health
```

Kalau berhasil, response akan mengembalikan status koneksi database. Setelah itu buka frontend Vercel dan cek apakah data sudah termuat.

## Catatan penting

- URL ngrok gratis biasanya berubah setiap kali tunnel di-restart.
- Jika URL berubah, perbarui `VITE_API_BASE_URL` di Vercel lalu redeploy lagi.
- Laptop Anda harus tetap menyala dan backend harus tetap berjalan agar website Vercel bisa memanggil API.
