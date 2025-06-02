const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Sizes for PWA icons
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
iconSizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6'); // Blue
  gradient.addColorStop(1, '#1e40af'); // Darker blue
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Icon design - Package/Box icon
  const centerX = size / 2;
  const centerY = size / 2;
  const boxSize = size * 0.5;
  
  // Box shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(centerX - boxSize/2 + 4, centerY - boxSize/2 + 4, boxSize, boxSize);
  
  // Main box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(centerX - boxSize/2, centerY - boxSize/2, boxSize, boxSize);
  
  // Box lines
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = size / 50;
  
  // Vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - boxSize/2);
  ctx.lineTo(centerX, centerY + boxSize/2);
  ctx.stroke();
  
  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(centerX - boxSize/2, centerY);
  ctx.lineTo(centerX + boxSize/2, centerY);
  ctx.stroke();
  
  // QR code pattern in corner
  const qrSize = boxSize * 0.3;
  ctx.fillStyle = '#3b82f6';
  
  // Small squares pattern
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const squareSize = qrSize / 4;
      const x = centerX + boxSize/2 - qrSize + (i * squareSize * 1.2);
      const y = centerY - boxSize/2 + (j * squareSize * 1.2);
      ctx.fillRect(x, y, squareSize, squareSize);
    }
  }

  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}x${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), buffer);
  console.log(`Generated ${filename}`);
});

console.log('All PWA icons generated successfully!');
