import {ChangeDetectionStrategy, Component, ElementRef, viewChild, afterNextRender, OnDestroy} from '@angular/core';
import {animate, stagger} from 'motion';
import {MatIconModule} from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  container = viewChild<ElementRef>('container');
  blob1 = viewChild<ElementRef>('blob1');
  blob2 = viewChild<ElementRef>('blob2');
  blob3 = viewChild<ElementRef>('blob3');
  infinityCanvas = viewChild<ElementRef<HTMLCanvasElement>>('infinityCanvas');

  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private particles: { t: number; speed: number; size: number; alpha: number }[] = [];

  constructor() {
    afterNextRender(() => {
      const el = this.container()?.nativeElement;
      const canvas = this.infinityCanvas()?.nativeElement;

      if (el) {
        // Content animations
        const items = el.querySelectorAll('.animate-item');
        animate(
          items,
          { opacity: [0, 1], y: [20, 0] },
          {
            delay: stagger(0.2),
            duration: 0.8,
            ease: "easeOut"
          }
        );

        // Background animations
        const b1 = this.blob1()?.nativeElement;
        const b2 = this.blob2()?.nativeElement;
        const b3 = this.blob3()?.nativeElement;

        if (b1) {
          animate(b1, 
            { x: [0, 50, -30, 0], y: [0, -40, 60, 0], scale: [1, 1.1, 0.9, 1] }, 
            { duration: 20, repeat: Infinity, ease: "linear" }
          );
        }
        if (b2) {
          animate(b2, 
            { x: [0, -60, 40, 0], y: [0, 50, -30, 0], scale: [1, 0.9, 1.1, 1] }, 
            { duration: 25, repeat: Infinity, ease: "linear" }
          );
        }
        if (b3) {
          animate(b3, 
            { x: [0, 30, -50, 0], y: [0, 40, -60, 0], opacity: [0.3, 0.5, 0.3] }, 
            { duration: 18, repeat: Infinity, ease: "linear" }
          );
        }
      }

      if (canvas) {
        this.ctx = canvas.getContext('2d');
        this.initInfinityAnimation(canvas);
      }
    });
  }

  private initInfinityAnimation(canvas: HTMLCanvasElement) {
    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      if (this.ctx) {
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    // Initialize particles
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        t: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.01,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.5
      });
    }

    const draw = () => {
      if (!this.ctx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const centerX = w / 2;
      const centerY = h / 2;
      const size = Math.min(w, h) * 0.25;

      this.ctx.clearRect(0, 0, w, h);

      // Draw the main infinity loop (subtle)
      this.ctx.beginPath();
      this.ctx.lineWidth = 2;
      const gradient = this.ctx.createLinearGradient(centerX - size, centerY, centerX + size, centerY);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)'); // Blue
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)'); // Purple
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0.2)'); // Pink
      this.ctx.strokeStyle = gradient;

      for (let t = 0; t <= Math.PI * 2; t += 0.02) {
        const pos = this.getInfinityPos(t, size, centerX, centerY);
        if (t === 0) this.ctx.moveTo(pos.x, pos.y);
        else this.ctx.lineTo(pos.x, pos.y);
      }
      this.ctx.stroke();

      // Draw particles (light trails)
      this.particles.forEach(p => {
        p.t += p.speed;
        const pos = this.getInfinityPos(p.t, size, centerX, centerY);
        
        this.ctx!.beginPath();
        this.ctx!.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
        
        // Dynamic color based on position
        const hue = (p.t / (Math.PI * 2)) * 360;
        this.ctx!.fillStyle = `hsla(${hue}, 70%, 70%, ${p.alpha})`;
        this.ctx!.shadowBlur = 10;
        this.ctx!.shadowColor = `hsla(${hue}, 70%, 70%, ${p.alpha})`;
        this.ctx!.fill();
        this.ctx!.shadowBlur = 0;
      });

      this.animationId = requestAnimationFrame(draw);
    };

    draw();
  }

  private getInfinityPos(t: number, a: number, cx: number, cy: number) {
    // Lemniscate of Bernoulli
    const scale = (a * Math.sqrt(2)) / (Math.sin(t) * Math.sin(t) + 1);
    return {
      x: cx + scale * Math.cos(t),
      y: cy + (scale * Math.sin(t) * Math.cos(t))
    };
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
