import { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas } from 'canvas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

  // Get size from query params or use defaults
  const size = parseInt(req.query.size as string) || 200;
  
  // Create canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0F533A');
  gradient.addColorStop(1, '#16a34a');
  
  // Set line styles
  ctx.strokeStyle = gradient;
  ctx.lineWidth = size * 0.06; // Proportional line width
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Scale to fit canvas
  const scale = size / 24;
  ctx.scale(scale, scale);
  
  // Draw the logo
  // Triangle
  ctx.beginPath();
  ctx.moveTo(4.5, 16.5);
  ctx.lineTo(12, 3);
  ctx.lineTo(19.5, 16.5);
  ctx.closePath();
  ctx.stroke();
  
  // Vertical line
  ctx.beginPath();
  ctx.moveTo(12, 3);
  ctx.lineTo(12, 12);
  ctx.stroke();
  
  // Right diagonal
  ctx.beginPath();
  ctx.moveTo(12, 12);
  ctx.lineTo(16.5, 16.5);
  ctx.stroke();
  
  // Left diagonal
  ctx.beginPath();
  ctx.moveTo(12, 12);
  ctx.lineTo(7.5, 16.5);
  ctx.stroke();
  
  // Bottom curve
  ctx.beginPath();
  ctx.moveTo(4.5, 16.5);
  ctx.bezierCurveTo(4.5, 18.5, 6, 21, 12, 21);
  ctx.bezierCurveTo(18, 21, 19.5, 18.5, 19.5, 16.5);
  ctx.stroke();
  
  // Convert to PNG buffer
  const buffer = canvas.toBuffer('image/png');
  
  // Send response
  res.setHeader('Content-Type', 'image/png');
  res.send(buffer);
} 