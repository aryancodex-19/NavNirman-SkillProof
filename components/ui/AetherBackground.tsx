"use client";

import React, { useEffect, useRef } from "react";

export default function AetherBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: null as number | null, y: null as number | null, radius: 200 };

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      color: string;

      constructor(x: number, y: number, dx: number, dy: number, size: number, color: string) {
        this.x = x;
        this.y = y;
        this.directionX = dx;
        this.directionY = dy;
        this.size = size;
        this.color = color;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(168, 85, 247, 0.6)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      update() {
        if (!canvas) return;
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + this.size && distance > 0) {
            const fx = dx / distance;
            const fy = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= fx * force * 4;
            this.y -= fy * force * 4;
          }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    function init() {
      if (!canvas) return;
      particles = [];
      const particleDensity = 9500;
      const count = Math.min(140, Math.max(40, Math.floor((canvas.height * canvas.width) / particleDensity)));
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * (canvas.width - size * 4) + size * 2;
        const y = Math.random() * (canvas.height - size * 4) + size * 2;
        const dx = (Math.random() - 0.5) * 0.5;
        const dy = (Math.random() - 0.5) * 0.5;
        particles.push(new Particle(x, y, dx, dy, size, "rgba(191, 128, 255, 0.75)"));
      }
    }

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const connect = () => {
      if (!canvas || !ctx) return;
      const maxDistSquared = Math.min(24000, (canvas.width / 6) * (canvas.height / 6));
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = dx * dx + dy * dy;
          if (dist < maxDistSquared) {
            const opacity = (1 - dist / maxDistSquared) * 0.35;
            const dxm = particles[a].x - (mouse.x ?? -9999);
            const dym = particles[a].y - (mouse.y ?? -9999);
            const dm = Math.sqrt(dxm * dxm + dym * dym);

            if (mouse.x !== null && dm < mouse.radius) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 1.8})`;
              ctx.lineWidth = 1.2;
            } else {
              ctx.strokeStyle = `rgba(180, 130, 255, ${opacity})`;
              ctx.lineWidth = 0.8;
            }

            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (!canvas || !ctx) return;
      animationFrameId = requestAnimationFrame(animate);
      ctx.fillStyle = "rgba(10, 10, 15, 0.22)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onOut);

    init();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -10 }}
    />
  );
}
