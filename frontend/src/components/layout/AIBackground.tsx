import { useAppState } from '@/hooks/use-app-state';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

interface AIBackgroundProps {
  animate?: boolean;
}

export const AIBackground: React.FC<AIBackgroundProps> = ({ animate = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useAppState();

  useEffect(() => {
    if (!animate || typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rootStyle = getComputedStyle(document.documentElement);
    const toHsla = (hslString: string, alpha: number) => {
      const [h, s, l] = (hslString || '0 0 0').replace(/%/g, '').split(' ');
      return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    };

    let primaryColor: string, accentColor: string;
    const updateColors = () => {
      primaryColor = rootStyle.getPropertyValue('--primary').trim();
      accentColor = rootStyle.getPropertyValue('--accent').trim();
    }

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      updateColors();
      init();
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 1.5 + 1;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.color = Math.random() > 0.5 ? primaryColor : accentColor;
      }

      update() {
        if (this.x > canvas!.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas!.height || this.y < 0) this.speedY *= -1;
        this.x += this.speedX;
        this.y += this.speedY;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = toHsla(this.color, 0.8);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      const numberOfParticles = (canvas.width * canvas.height) / 15000;
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    const connect = () => {
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            opacityValue = 1 - (distance / 120);
            const grad = ctx.createLinearGradient(particles[a].x, particles[a].y, particles[b].x, particles[b].y);
            grad.addColorStop(0, toHsla(particles[a].color, opacityValue * 0.5));
            grad.addColorStop(1, toHsla(particles[b].color, opacityValue * 0.5));

            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      connect();
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    window.addEventListener('resize', resize);
    resize();
    animateParticles();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [animate, theme]);

  return (
    <div className="fixed inset-0 -z-1 bg-background overflow-hidden pointer-events-none">
      <div className={cn("absolute inset-0 ai-gradient-bg", theme === 'dark' ? 'opacity-80' : 'opacity-60')} />
      <canvas
        ref={canvasRef}
        className={cn("absolute inset-0 w-full h-full transition-opacity duration-1000", theme === 'dark' ? 'opacity-30' : 'opacity-50')}
      />
    </div>
  );
};
