/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BasicFaceState = {
  ctx: CanvasRenderingContext2D;
  mouthScale: number;
  eyeScale: number;
  color: string | undefined;
};

/**
 * Renders Inklo, the SoloScribe mascot.
 * Matches the provided image: egg-shaped yellow body, thick black glasses, 
 * vertical oval eyes, and a specific top-left highlight.
 */
export function renderBasicFace({
  ctx,
  mouthScale,
  eyeScale,
  color = '#F2FF00', // Bright Inklo Yellow
}: BasicFaceState) {
  const { width, height } = ctx.canvas;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Proportions based on an egg shape
  const radiusX = Math.min(width, height) / 2 - 15;
  const radiusY = radiusX * 1.2; // Slightly taller than wide

  // Clear the canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Shadow (Flat black oval at the bottom)
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + radiusY + 15, radiusX * 0.6, radiusY * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Body (Yellow Egg Shape)
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Top-Left Highlight (Curved white shape)
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  // Drawing a curve on the top left
  ctx.arc(centerX - radiusX * 0.4, centerY - radiusY * 0.5, radiusX * 0.3, Math.PI * 0.8, Math.PI * 1.4);
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // 3. Glasses (Thick Black Frames)
  ctx.save();
  ctx.fillStyle = '#000000';
  
  const gWidth = radiusX * 0.75;
  const gHeight = radiusY * 0.45;
  const gY = centerY - radiusY * 0.1;
  const bridge = radiusX * 0.2;
  const cornerRadius = 15;
  
  // Left Frame
  drawRoundedRect(ctx, centerX - gWidth - bridge/2, gY, gWidth, gHeight, cornerRadius);
  ctx.fill();
  
  // Right Frame
  drawRoundedRect(ctx, centerX + bridge/2, gY, gWidth, gHeight, cornerRadius);
  ctx.fill();
  
  // Bridge (Thick)
  ctx.fillRect(centerX - bridge/2 - 2, gY + gHeight * 0.3, bridge + 4, gHeight * 0.25);
  
  // Side Wings (Extensions)
  ctx.fillRect(centerX - gWidth - bridge/2 - 5, gY + 5, 10, gHeight * 0.4);
  ctx.fillRect(centerX + gWidth + bridge/2 - 5, gY + 5, 10, gHeight * 0.4);

  // 4. Lenses (Yellow interior of glasses)
  ctx.fillStyle = color;
  const lensPadding = 8;
  drawRoundedRect(ctx, centerX - gWidth - bridge/2 + lensPadding, gY + lensPadding, gWidth - lensPadding * 2, gHeight - lensPadding * 2, cornerRadius - 5);
  ctx.fill();
  drawRoundedRect(ctx, centerX + bridge/2 + lensPadding, gY + lensPadding, gWidth - lensPadding * 2, gHeight - lensPadding * 2, cornerRadius - 5);
  ctx.fill();
  
  // 5. Eyes (Inside Lenses - Vertical Ovals)
  ctx.fillStyle = '#000000';
  const eyeY = gY + gHeight / 2;
  const eyeXOffset = gWidth / 2;
  
  // Left Eye
  ctx.beginPath();
  ctx.ellipse(centerX - bridge/2 - eyeXOffset, eyeY, 4, 8 * (0.8 + eyeScale * 0.4), 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Right Eye
  ctx.beginPath();
  ctx.ellipse(centerX + bridge/2 + eyeXOffset, eyeY, 4, 8 * (0.8 + eyeScale * 0.4), 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();

  // 6. Mouth (Open oval with dark red interior)
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  const mouthY = centerY + radiusY * 0.5;
  
  // Dynamic mouth sizing based on audio volume
  // We want it to go from a small slit to a wide open mouth
  const mWidth = 12 + mouthScale * 8;
  const mHeight = 4 + mouthScale * 24;
  
  ctx.beginPath();
  ctx.ellipse(centerX, mouthY, mWidth, mHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Interior (Dark red tongue/throat area) - only visible when mouth is open
  if (mouthScale > 0.05) {
    ctx.fillStyle = '#7A2F2F'; // Dark reddish
    ctx.beginPath();
    ctx.ellipse(centerX, mouthY + mHeight * 0.2, mWidth * 0.7, mHeight * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Helper to draw rounded rectangles for the glasses frames.
 */
function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
