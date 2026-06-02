import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join } from 'path';

const PUBLIC = join(import.meta.dirname, '..', 'public');

// Brand colors
const BG_DARK = '#0F172A';     // Slate 900
const ACCENT = '#22C55E';      // Green 500
const WHITE = '#FFFFFF';
const GRAY = '#94A3B8';        // Slate 400

// --- Favicon generator ---
function generateFavicon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - dark rounded square
  ctx.fillStyle = BG_DARK;
  const radius = size * 0.2;
  roundRect(ctx, 0, 0, size, size, radius);
  ctx.fill();

  // Soccer ball circle
  const cx = size / 2;
  const cy = size * 0.42;
  const ballR = size * 0.25;

  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(cx, cy, ballR, 0, Math.PI * 2);
  ctx.fill();

  // Pentagon pattern on ball
  ctx.fillStyle = BG_DARK;
  drawPentagon(ctx, cx, cy, ballR * 0.4);

  // "BF" text below ball
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.max(size * 0.28, 4);
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillText('BF', cx, size * 0.78);

  return canvas;
}

function drawPentagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Generate favicons
for (const size of [16, 32, 180]) {
  const canvas = generateFavicon(size);
  const name = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}x${size}.png`;
  writeFileSync(join(PUBLIC, name), canvas.toBuffer('image/png'));
  console.log(`Created ${name}`);
}

// Generate .ico (32x32 PNG wrapped - browsers accept PNG favicons)
const ico32 = generateFavicon(32);
writeFileSync(join(PUBLIC, 'favicon.ico'), ico32.toBuffer('image/png'));
console.log('Created favicon.ico');

// --- OG Image (1200x630) ---
function generateOGImage() {
  const W = 1200, H = 630;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0F172A');
  grad.addColorStop(0.5, '#1E293B');
  grad.addColorStop(1, '#0F172A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle pattern - diagonal lines
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.06)';
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }

  // Top accent bar
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, W, 4);

  // Soccer ball icon (top left area)
  const ballX = 100, ballY = H / 2 - 30, ballR = 65;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballR + 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BG_DARK;
  drawPentagon(ctx, ballX, ballY, ballR * 0.38);

  // Small pentagons around the ball
  const offsets = [
    [0, -1], [0.95, -0.31], [0.59, 0.81], [-0.59, 0.81], [-0.95, -0.31]
  ];
  for (const [ox, oy] of offsets) {
    drawPentagon(ctx, ballX + ox * ballR * 0.72, ballY + oy * ballR * 0.72, ballR * 0.15);
  }

  // Text area
  const textX = 220;

  // "BAREFOOT FC" label
  ctx.fillStyle = ACCENT;
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '4px';
  ctx.fillText('BAREFOOT FC', textX, 160);

  // Main title
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 56px Arial, sans-serif';
  ctx.fillText('World Cup Match', textX, 240);
  ctx.fillText('Predictor', textX, 305);

  // Subtitle
  ctx.fillStyle = GRAY;
  ctx.font = '26px Arial, sans-serif';
  ctx.fillText('Make your picks. Climb the leaderboard.', textX, 380);

  // Tagline
  ctx.fillStyle = ACCENT;
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText('Free to play. No gambling. No cash prizes.', textX, 430);

  // Bottom bar
  ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
  ctx.fillRect(0, H - 60, W, 60);

  ctx.fillStyle = GRAY;
  ctx.font = '18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('barefootfcworldcup.com', W / 2, H - 30);

  // Right side decorative elements - field lines
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.12)';
  ctx.lineWidth = 2;
  // Center circle
  ctx.beginPath();
  ctx.arc(W - 150, H / 2, 100, 0, Math.PI * 2);
  ctx.stroke();
  // Center line
  ctx.beginPath();
  ctx.moveTo(W - 150, H / 2 - 150);
  ctx.lineTo(W - 150, H / 2 + 150);
  ctx.stroke();

  return canvas;
}

const ogCanvas = generateOGImage();
writeFileSync(join(PUBLIC, 'og-image.png'), ogCanvas.toBuffer('image/png'));
console.log('Created og-image.png (1200x630)');

console.log('\nAll branding assets generated!');
