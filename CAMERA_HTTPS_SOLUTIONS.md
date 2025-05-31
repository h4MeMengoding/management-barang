# Solusi untuk Camera Access dengan HTTPS

## Masalah
Browser modern memerlukan HTTPS untuk mengakses kamera karena alasan keamanan.

## Solusi 1: HTTPS dengan Self-Signed Certificate

1. Jalankan script setup:
   ```bash
   ./setup-https.sh
   ```

2. Start development server dengan HTTPS:
   ```bash
   npm run dev:https
   ```

3. Akses aplikasi melalui:
   - `https://localhost:3000` (di komputer)
   - `https://192.168.1.10:3000` (di iPhone - mungkin perlu accept certificate warning)

## Solusi 2: Menggunakan ngrok (Recommended)

1. Install ngrok:
   ```bash
   # Ubuntu/Debian
   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
   echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
   sudo apt update && sudo apt install ngrok
   
   # Atau download manual dari https://ngrok.com/download
   ```

2. Setup ngrok account (gratis):
   - Daftar di https://ngrok.com
   - Copy authtoken dari dashboard
   - Jalankan: `ngrok config add-authtoken YOUR_TOKEN`

3. Start aplikasi normal:
   ```bash
   npm run dev
   ```

4. Di terminal baru, start ngrok:
   ```bash
   ngrok http 3000
   ```

5. Gunakan URL HTTPS yang diberikan ngrok (contoh: https://abc123.ngrok.io)

## Solusi 3: Menggunakan localtunnel

1. Install localtunnel:
   ```bash
   npm install -g localtunnel
   ```

2. Start aplikasi:
   ```bash
   npm run dev
   ```

3. Di terminal baru:
   ```bash
   lt --port 3000
   ```

4. Gunakan URL HTTPS yang diberikan

## Solusi 4: Testing di Desktop

Untuk testing cepat, gunakan desktop browser dengan localhost:
- Chrome/Firefox: `http://localhost:3000`
- Localhost tidak memerlukan HTTPS untuk camera access

## Rekomendasi

Untuk development mobile testing, **ngrok adalah solusi terbaik** karena:
- Mudah setup
- Memberikan HTTPS secara otomatis
- Dapat diakses dari device manapun
- Gratis untuk basic usage
