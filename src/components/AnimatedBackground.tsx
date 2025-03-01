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
      color: string;
      sequence: string[];
      sequenceIndex: number;
      lastUpdate: number;
      updateInterval: number;
    }[] = [];
    
    // Initialize numbers
    const initNumbers = () => {
      numbers.length = 0;
      const density = Math.floor(canvas.width * canvas.height / 10000); // Slightly reduced density for white background
      
      // Only use 0, 1, 2 for the Matrix effect
      const digits = ['0', '1', '2'];
      
      // Define color variations (green shades with better contrast for white background)
      const colors = [
        '#0F533A', // Dark green
        '#0a3f2c', // Darker green
        '#084024', // Very dark green
        '#052e1d', // Extremely dark green
        '#031b11', // Almost black green
      ];
      
      // Create columns of numbers
      const columnCount = Math.floor(canvas.width / 25); // One column every ~25px
      const columnPositions = Array.from({ length: columnCount }, (_, i) => 
        (i * canvas.width / columnCount) + (Math.random() * 10 - 5) // Add slight randomness
      );
      
      // Create multiple streams of numbers
      for (let col = 0; col < columnPositions.length; col++) {
        const x = columnPositions[col];
        const streamLength = Math.floor(Math.random() * 10) + 3; // 3-12 numbers per stream
        
        // Create a stream of numbers at this column position
        for (let i = 0; i < streamLength; i++) {
          const color = colors[Math.floor(Math.random() * colors.length)];
          const baseOpacity = Math.random() * 0.4 + 0.2; // Higher base opacity for white background
          
          // Head of the stream is darker (now at the top of the stream for upward movement)
          const opacity = i === 0 ? baseOpacity + 0.4 : baseOpacity - (i / streamLength * 0.1);
          
          // Position numbers in a column with the lead number at the bottom
          // This creates a better effect for upward movement
          const yPosition = canvas.height - (i * 20) - Math.random() * 50;
          
          numbers.push({
            x,
            y: yPosition,
            value: digits[Math.floor(Math.random() * digits.length)],
            size: Math.random() * 14 + 10, // Size variation
            speed: Math.random() * 0.6 + 0.3, // Slower speed for upward movement
            opacity,
            color,
            sequence: digits, // Just use the digits array
            sequenceIndex: 0,
            lastUpdate: Date.now() - (i * 200), // Stagger updates
            updateInterval: Math.random() * 600 + 400, // Slightly slower updates
          });
        }
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
      const currentTime = Date.now();
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw white background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, 
        canvas.height / 2, 
        0, 
        canvas.width / 2, 
        canvas.height / 2, 
        canvas.width * 0.8
      );
      
      gradient.addColorStop(0, `rgba(255, 255, 255, 1)`); // Pure white
      gradient.addColorStop(1, `rgba(245, 245, 245, 1)`); // Slightly off-white
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Sort numbers by y position to handle opacity correctly
      numbers.sort((a, b) => a.y - b.y);
      
      // Draw numbers
      numbers.forEach(number => {
        // Update sequence if it's time
        if (currentTime - number.lastUpdate > number.updateInterval) {
          number.value = number.sequence[Math.floor(Math.random() * number.sequence.length)];
          number.lastUpdate = currentTime;
        }
        
        ctx.font = `${number.size}px monospace`;
        
        // Create a subtle shadow effect for the leading number in each stream
        if (number.opacity > 0.5) {
          ctx.shadowColor = number.color;
          ctx.shadowBlur = 3;
        } else {
          ctx.shadowBlur = 0;
        }
        
        // Use full opacity for better contrast on white
        ctx.fillStyle = number.color;
        // Apply opacity through globalAlpha instead
        ctx.globalAlpha = number.opacity;
        ctx.fillText(number.value, number.x, number.y);
        ctx.globalAlpha = 1.0; // Reset global alpha
        
        // Move number up instead of down
        number.y -= number.speed;
        
        // Reset position if off screen (now checking top instead of bottom)
        if (number.y < -number.size) {
          number.y = canvas.height + number.size;
          // Keep the same x position to maintain column effect
          number.speed = Math.random() * 0.6 + 0.3; // Slower randomized speed
          number.opacity = Math.random() * 0.4 + 0.2; // Randomize opacity
          number.size = Math.random() * 14 + 10; // Randomize size
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