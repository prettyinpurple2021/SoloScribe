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
  
  // Proportions based on a round shape
  const radiusX = Math.min(width, height) / 2 - 15;
  const radiusY = radiusX; // Round body

  // Clear the canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Shadow (Flat black oval at the bottom)
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + radiusY + 15, radiusX * 0.6, radiusY * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Body (Yellow Round Shape with 3D gradient)
  ctx.save();
  const gradient = ctx.createRadialGradient(
    centerX - radiusX * 0.3, 
    centerY - radiusY * 0.3, 
    radiusX * 0.1, 
    centerX, 
    centerY, 
    radiusX
  );
  gradient.addColorStop(0, '#FFF766'); // Lighter yellow highlight
  gradient.addColorStop(1, color);     // Base yellow
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radiusX, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Glasses (Thick Black Frames with subtle shadow)
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#000000';
  
  const gWidth = radiusX * 0.5;
  const gHeight = radiusY * 0.4;
  const gY = centerY - radiusY * 0.15;
  const bridge = radiusX * 0.1;
  const cornerRadius = 10;
  
  // Left Frame
  drawRoundedRect(ctx, centerX - gWidth - bridge/2, gY, gWidth, gHeight, cornerRadius);
  ctx.fill();
  
  // Right Frame
  drawRoundedRect(ctx, centerX + bridge/2, gY, gWidth, gHeight, cornerRadius);
  ctx.fill();
  
  // Bridge (Thick)
  ctx.fillRect(centerX - bridge/2, gY + gHeight * 0.3, bridge, gHeight * 0.2);
  ctx.restore();
  
  // 4. Eyes (Inside Glasses - Large surprised circles)
  ctx.fillStyle = '#000000';
  const eyeY = gY + gHeight / 2;
  const eyeXOffset = gWidth / 2;
  const eyeRadius = 10;
  
  // Left Eye
  ctx.beginPath();
  ctx.arc(centerX - bridge/2 - eyeXOffset + gWidth/2, eyeY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Right Eye
  ctx.beginPath();
  ctx.arc(centerX + bridge/2 + eyeXOffset - gWidth/2, eyeY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();

  // 5. Mouth (Open oval with dark red interior)
  ctx.save();
  ctx.fillStyle = '#000000';
  const mouthY = centerY + radiusY * 0.4;
  
  // Dynamic mouth sizing based on audio volume
  const mWidth = 15 + mouthScale * 5;
  const mHeight = 20 + mouthScale * 15;
  
  ctx.beginPath();
  ctx.ellipse(centerX, mouthY, mWidth, mHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Interior (Dark red tongue/throat area)
  ctx.fillStyle = '#D9534F'; // Reddish
  ctx.beginPath();
  ctx.ellipse(centerX, mouthY + mHeight * 0.1, mWidth * 0.7, mHeight * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
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
