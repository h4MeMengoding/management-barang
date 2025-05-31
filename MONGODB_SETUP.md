# MongoDB Atlas Setup Guide

## Langkah 1: Buat Akun MongoDB Atlas

1. Kunjungi [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Klik "Try Free" atau "Start Free"
3. Daftar dengan email atau login dengan Google/GitHub
4. Pilih "Build a Database"

## Langkah 2: Buat Database Cluster

1. Pilih "M0 Sandbox" (Free tier - 512 MB)
2. Pilih region terdekat (contoh: Singapore untuk Indonesia)
3. Beri nama cluster (atau biarkan default)
4. Klik "Create Cluster"

## Langkah 3: Setup Database Access

1. Di sidebar kiri, klik "Database Access"
2. Klik "Add New Database User"
3. Pilih "Password" authentication
4. Masukkan username dan password (catat dengan baik!)
5. Pilih "Built-in Role" → "Read and write to any database"
6. Klik "Add User"

## Langkah 4: Setup Network Access

1. Di sidebar kiri, klik "Network Access"
2. Klik "Add IP Address"
3. Klik "Allow Access from Anywhere" (0.0.0.0/0) untuk development
   - **Catatan**: Untuk production, gunakan IP address spesifik
4. Klik "Confirm"

## Langkah 5: Dapatkan Connection String

1. Kembali ke "Database" di sidebar
2. Klik "Connect" pada cluster Anda
3. Pilih "Connect your application"
4. Pilih "Node.js" dan versi "4.1 or later"
5. Copy connection string yang diberikan
6. Ganti `<password>` dengan password yang Anda buat
7. Ganti `<database>` dengan `management-barang`

## Contoh Connection String:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/management-barang?retryWrites=true&w=majority
```

## Langkah 6: Update .env.local

Ganti MONGODB_URI di file `.env.local` dengan connection string Anda:

```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/management-barang?retryWrites=true&w=majority
```

## Troubleshooting

- **Connection Error**: Pastikan IP address sudah ditambahkan di Network Access
- **Authentication Error**: Periksa username dan password
- **Database Not Found**: Database akan dibuat otomatis saat aplikasi pertama kali connect
