# Management Barang - Item Management System

Sistem manajemen barang dengan QR Code menggunakan Next.js, MongoDB, dan Google OAuth.

## Fitur

- 🔐 **Google OAuth Authentication** - Login menggunakan akun Google
- 📦 **Manajemen Loker** - Buat dan kelola loker dengan QR code unik
- 🏷️ **Manajemen Barang** - Tambah, edit, dan hapus barang dalam loker
- 📱 **QR Code Scanner** - Scan QR code untuk melihat isi loker
- 🔍 **Pencarian** - Cari loker berdasarkan kode atau label
- 📊 **Dashboard** - Overview semua loker dan barang

## Teknologi

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB dengan Mongoose
- **Authentication**: NextAuth.js dengan Google Provider
- **QR Code**: qrcode (generate), jsqr (scan)
- **Icons**: Lucide React

## Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd management-barang
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup MongoDB Atlas

**Penting**: Aplikasi ini menggunakan MongoDB Atlas (cloud database). Ikuti panduan di [MONGODB_SETUP.md](./MONGODB_SETUP.md) untuk setup lengkap.

Singkatnya:
1. Buat akun di [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Buat database cluster (M0 Sandbox - gratis)
3. Setup database user dan network access
4. Dapatkan connection string

### 4. Setup Environment Variables

Salin file `.env.local.example` ke `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dan isi dengan nilai yang sesuai:

```env
# MongoDB Atlas connection string (dari MongoDB Atlas Dashboard)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/management-barang?retryWrites=true&w=majority

# Google OAuth credentials (dapatkan dari Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth secret (generate random string untuk production)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**Catatan**: Untuk `MONGODB_URI`, gunakan connection string dari MongoDB Atlas. Lihat [MONGODB_SETUP.md](./MONGODB_SETUP.md) untuk panduan lengkap.

### 4. Setup Google OAuth

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang ada
3. Enable Google+ API
4. Buat OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Salin Client ID dan Client Secret ke `.env.local`

### 5. Setup MongoDB

Pastikan MongoDB sudah terinstall dan berjalan di komputer Anda, atau gunakan MongoDB Atlas untuk cloud database.

```bash
# Jika menggunakan local MongoDB
mongod

# Atau install menggunakan Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 6. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Project

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth configuration
│   │   ├── lockers/                # Locker CRUD API
│   │   ├── items/                  # Item CRUD API
│   │   └── scan/                   # QR scan API
│   ├── lockers/
│   │   ├── new/                    # Add new locker page
│   │   └── [lockerId]/             # Locker detail page
│   ├── items/
│   │   └── new/                    # Add new item page
│   ├── scan/                       # QR scanner page
│   ├── layout.tsx                  # Root layout with providers
│   └── page.tsx                    # Dashboard
├── components/
│   ├── Navbar.tsx                  # Navigation component
│   └── Providers.tsx               # NextAuth provider
├── lib/
│   └── mongodb.ts                  # MongoDB connection
└── models/
    └── index.ts                    # Mongoose models
```

## Penggunaan

### 1. Login
- Klik "Login dengan Google" di navbar
- Pilih akun Google Anda

### 2. Membuat Loker
- Klik "Tambah Loker" di dashboard
- Isi kode unik, label, dan deskripsi
- QR code akan dibuat otomatis

### 3. Menambah Barang
- Klik "Tambah Barang" di dashboard
- Pilih loker tujuan
- Isi detail barang (nama, kategori, jumlah, deskripsi)

### 4. Scan QR Code
- Klik "Scan QR Code" di dashboard
- Izinkan akses kamera atau upload gambar QR
- Lihat daftar barang dalam loker

### 5. Melihat Detail Loker
- Klik ikon mata pada card loker di dashboard
- Lihat QR code dan daftar barang
- Download atau print QR code

## QR Code Workflow

Sistem ini menggunakan workflow khusus untuk QR code yang mendukung skenario real-world:

### 1. Generate QR Codes dalam Batch
1. Akses halaman **Kelola QR Code** dari dashboard
2. Pilih tab **Generate QR Codes**
3. Tentukan jumlah QR code yang ingin dibuat (default: 10)
4. Klik **Generate QR Codes**
5. QR codes akan ditampilkan dalam format siap cetak

### 2. Print & Tempel QR Codes
1. Gunakan tombol **Print QR Codes** untuk mencetak
2. Potong QR codes sesuai garis panduan
3. Tempel QR code pada loker fisik/kontainer

### 3. Initialize Loker dengan Scan
1. Gunakan fitur **Scan QR Code** dari dashboard
2. Scan QR code yang sudah ditempel pada loker
3. Sistem akan mendeteksi QR code baru dan redirect ke halaman inisialisasi
4. Isi informasi loker (kode, label, deskripsi)
5. Klik **Initialize Locker** untuk membuat loker baru

### 4. Manajemen QR Codes
- Tab **Manage QR Codes** menampilkan semua QR codes
- QR codes yang sudah digunakan ditandai dengan warna hijau
- QR codes yang belum digunakan ditandai dengan warna abu-abu

### 5. Scan QR Code Existing
- Ketika scan QR code yang sudah terinisialisasi
- Sistem akan langsung menampilkan detail loker dan isinya

## API Endpoints

- `GET /api/lockers` - Get all user lockers
- `POST /api/lockers` - Create new locker
- `GET /api/lockers/[id]` - Get locker detail with items
- `GET /api/items` - Get all user items
- `POST /api/items` - Create new item
- `POST /api/scan` - Scan QR code and get locker items

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License
