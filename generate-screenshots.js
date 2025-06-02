const fs = require('fs');
const path = require('path');
const { createCanvas, CanvasRenderingContext2D } = require('canvas');

// Add roundRect method to canvas context
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Generate desktop screenshot
function generateDesktopScreenshot() {
  const canvas = createCanvas(1280, 720);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#1e293b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1280, 720);

  // Header area
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 1280, 64);

  // Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('Management Barang', 40, 130);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = '18px Arial';
  ctx.fillText('Kelola loker dan barang Anda dengan mudah', 40, 170);

  // Statistics cards
  const cardData = [
    { title: 'Total Loker', value: '12', color: '#3b82f6', icon: '📦' },
    { title: 'Total Barang', value: '48', color: '#10b981', icon: '📋' },
    { title: 'Loker Terisi', value: '8', color: '#8b5cf6', icon: '🔗' }
  ];

  cardData.forEach((card, index) => {
    const x = 40 + (index * 280);
    const y = 220;
    
    // Card background
    ctx.fillStyle = '#334155';
    ctx.roundRect(x, y, 260, 120, 8);
    ctx.fill();
    
    // Card content
    ctx.fillStyle = card.color;
    ctx.font = '24px Arial';
    ctx.fillText(card.icon, x + 20, y + 40);
    
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(card.value, x + 20, y + 80);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Arial';
    ctx.fillText(card.title, x + 20, y + 100);
  });

  // Action buttons
  const buttons = ['Tambah Loker', 'Tambah Barang', 'Kelola Kategori', 'Scan QR Code'];
  buttons.forEach((button, index) => {
    const x = 40 + (index * 200);
    const y = 380;
    
    ctx.fillStyle = '#475569';
    ctx.roundRect(x, y, 180, 40, 6);
    ctx.fill();
    
    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px Arial';
    ctx.fillText(button, x + 10, y + 25);
  });

  // Loker grid simulation
  for (let i = 0; i < 6; i++) {
    const x = 40 + (i % 3) * 280;
    const y = 460 + Math.floor(i / 3) * 120;
    
    // Loker card
    ctx.fillStyle = '#334155';
    ctx.roundRect(x, y, 260, 100, 8);
    ctx.fill();
    
    // Loker content
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Loker ${i + 1}`, x + 15, y + 30);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.fillText(`Kode: L00${i + 1}`, x + 15, y + 50);
    ctx.fillText(`${Math.floor(Math.random() * 10)} barang`, x + 15, y + 70);
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(screenshotsDir, 'desktop-banner.png'), buffer);
  console.log('Generated desktop screenshot');
}

// Generate mobile screenshot
function generateMobileScreenshot() {
  const canvas = createCanvas(320, 640);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 320, 640);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#1e293b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 320, 640);

  // Header
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 320, 56);

  // Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('Dashboard', 20, 80);

  // Statistics cards (mobile layout)
  const mobileCards = [
    { title: 'Loker', value: '12', color: '#3b82f6' },
    { title: 'Barang', value: '48', color: '#10b981' },
    { title: 'Terisi', value: '8', color: '#8b5cf6' }
  ];

  mobileCards.forEach((card, index) => {
    const x = 20 + (index * 90);
    const y = 100;
    
    // Card background
    ctx.fillStyle = '#334155';
    ctx.roundRect(x, y, 80, 80, 6);
    ctx.fill();
    
    // Card content
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(card.value, x + 10, y + 30);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Arial';
    ctx.fillText(card.title, x + 10, y + 50);
  });

  // Action buttons (mobile)
  const mobileButtons = ['+ Loker', '+ Barang', 'Kategori', 'Scan'];
  mobileButtons.forEach((button, index) => {
    const x = 20 + (index % 2) * 140;
    const y = 210 + Math.floor(index / 2) * 50;
    
    ctx.fillStyle = '#475569';
    ctx.roundRect(x, y, 120, 35, 4);
    ctx.fill();
    
    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px Arial';
    ctx.fillText(button, x + 8, y + 22);
  });

  // Mobile loker cards
  for (let i = 0; i < 4; i++) {
    const y = 320 + (i * 70);
    
    // Loker card
    ctx.fillStyle = '#334155';
    ctx.roundRect(20, y, 280, 60, 6);
    ctx.fill();
    
    // Loker content
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Loker ${i + 1}`, 30, y + 20);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Arial';
    ctx.fillText(`L00${i + 1} • ${Math.floor(Math.random() * 10)} barang`, 30, y + 35);
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(screenshotsDir, 'mobile-banner.png'), buffer);
  console.log('Generated mobile screenshot');
}

generateDesktopScreenshot();
generateMobileScreenshot();
console.log('All screenshots generated successfully!');
