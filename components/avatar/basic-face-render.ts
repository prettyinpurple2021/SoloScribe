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
 * Renders a sophisticated, purely abstract "Glowing Nebula" AI.
 * No facial features. Layered cosmic energy that pulses with audio.
 */
export function renderBasicFace({
  ctx,
  mouthScale,
  eyeScale,
  color = '#00f3ff',
}: BasicFaceState) {
  const { width, height } = ctx.canvas;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 5;

  // Clear the canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Deep Space Background
  const spaceGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  spaceGrad.addColorStop(0, '#0a0a1a');
  spaceGrad.addColorStop(0.8, '#050510');
  spaceGrad.addColorStop(1, '#000000');
  ctx.fillStyle = spaceGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Layered Nebula Clouds
  const time = Date.now() / 1000;
  
  // Primary Nebula (Cyan/Blue)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const nebula1 = ctx.createRadialGradient(
    centerX + Math.cos(time * 0.5) * radius * 0.2,
    centerY + Math.sin(time * 0.5) * radius * 0.2,
    0,
    centerX, centerY, radius * 0.8
  );
  nebula1.addColorStop(0, 'rgba(0, 243, 255, 0.3)');
  nebula1.addColorStop(0.5, 'rgba(0, 100, 255, 0.1)');
  nebula1.addColorStop(1, 'transparent');
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, width, height);

  // Secondary Nebula (Purple/Magenta)
  const nebula2 = ctx.createRadialGradient(
    centerX + Math.sin(time * 0.7) * radius * 0.3,
    centerY + Math.cos(time * 0.7) * radius * 0.3,
    0,
    centerX, centerY, radius * 0.7
  );
  nebula2.addColorStop(0, 'rgba(176, 38, 255, 0.25)');
  nebula2.addColorStop(0.6, 'rgba(100, 0, 255, 0.05)');
  nebula2.addColorStop(1, 'transparent');
  ctx.fillStyle = nebula2;
  ctx.fillRect(0, 0, width, height);
  
  // 3. Pulsing AI Core (Reacts to audio)
  const coreRadius = radius * (0.3 + mouthScale * 0.2);
  const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
  coreGrad.addColorStop(0, '#fff');
  coreGrad.addColorStop(0.2, color);
  coreGrad.addColorStop(0.5, 'rgba(0, 243, 255, 0.2)');
  coreGrad.addColorStop(1, 'transparent');
  
  ctx.shadowBlur = 20 + mouthScale * 30;
  ctx.shadowColor = color;
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 4. Star Particles
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI * 2 + time * 0.2;
    const dist = radius * (0.4 + Math.sin(time + i) * 0.2);
    const px = centerX + Math.cos(angle) * dist;
    const py = centerY + Math.sin(angle) * dist;
    const size = 0.5 + Math.random() * 1;
    
    ctx.globalAlpha = 0.3 + Math.sin(time * 2 + i) * 0.2;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 5. Energy Rings (React to audio)
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 0; i < 2; i++) {
    const ringRadius = radius * (0.5 + i * 0.15 + mouthScale * 0.1);
    ctx.globalAlpha = (0.2 - i * 0.1) * (1 + mouthScale);
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.restore();

  // 6. Outer Rim Glow
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1.0;
}
