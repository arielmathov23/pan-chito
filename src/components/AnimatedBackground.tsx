import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create an array of number objects
    const numbers: {
      x: number;
      y: number;
      value: string;
      size: number;
      speed: number;
      opacity: number;
    }[] = [];
    
    // Initialize numbers
    const initNumbers = () => {
      numbers.length = 0;
      const density = Math.floor(canvas.width * canvas.height / 20000); // Reduced density
      
      for (let i = 0; i < density; i++) {
        numbers.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          value: Math.random() < 0.33 ? '0' : Math.random() < 0.66 ? '2' : '1',
          size: Math.random() * 16 + 8,
          speed: Math.random() * 0.8 + 0.2, // Slightly faster
          opacity: Math.random() * 0.15 + 0.05 // More subtle
        });
      }
    };
    
    initNumbers();
    window.addEventListener('resize', initNumbers);
    
    // Animation loop
    let animationFrameId: number;
    let lastTime = 0;
    
    const render = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw subtle gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, 
        canvas.height / 2, 
        0, 
        canvas.width / 2, 
        canvas.height / 2, 
        canvas.width * 0.8
      );
      
      const t = Date.now() * 0.0001;
      gradient.addColorStop(0, `rgba(249, 250, 251, 0.2)`); // Very light gray
      gradient.addColorStop(1, `rgba(243, 244, 246, 0.1)`); // Light gray
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw numbers
      numbers.forEach(number => {
        ctx.font = `${number.size}px monospace`;
        ctx.fillStyle = `rgba(15, 83, 58, ${number.opacity})`;
        ctx.fillText(number.value, number.x, number.y);
        
        // Move number up
        number.y -= number.speed;
        
        // Reset position if off screen
        if (number.y < -number.size) {
          number.y = canvas.height + number.size;
          number.x = Math.random() * canvas.width;
        }
      });
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    animationFrameId = requestAnimationFrame(render);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('resize', initNumbers);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <div className="relative min-h-screen">
      <canvas 
        ref={canvasRef} 
        className="fixed top-0 left-0 w-full h-full -z-10"
        style={{ pointerEvents: 'none' }}
      />
      {children}
    </div>
  );
};

export default AnimatedBackground; 