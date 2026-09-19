// ============================================================================
// Particles: tiny pixel particles with gravity, fade, shapes
// ============================================================================
(function (CH) {
  class Particles {
    constructor() { this.list = []; }
    clear() { this.list.length = 0; }
    // p: {x,y,vx,vy,life,color,size,grav,shape:'px'|'circle'|'spark'|'text'|'ring', text, drag, fade}
    add(p) {
      p.t = 0; p.life = p.life || 0.5; p.size = p.size || 1; p.grav = p.grav === undefined ? 0 : p.grav;
      p.vx = p.vx || 0; p.vy = p.vy || 0; p.drag = p.drag === undefined ? 1 : p.drag;
      this.list.push(p);
      if (this.list.length > 1200) this.list.splice(0, this.list.length - 1200);
      return p;
    }
    burst(x, y, n, opts = {}) {
      for (let i = 0; i < n; i++) {
        const a = opts.angle !== undefined ? opts.angle + (Math.random() - 0.5) * (opts.spread || Math.PI * 2) : Math.random() * Math.PI * 2;
        const sp = (opts.speed || 60) * (0.4 + Math.random() * 0.8);
        this.add({
          x: x + (Math.random() - 0.5) * (opts.jitter || 0), y: y + (Math.random() - 0.5) * (opts.jitter || 0),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: (opts.life || 0.5) * (0.6 + Math.random() * 0.8),
          color: Array.isArray(opts.color) ? CH.pick(opts.color) : opts.color || '#fff',
          size: opts.size || 1, grav: opts.grav === undefined ? 200 : opts.grav, shape: opts.shape || 'px',
          drag: opts.drag === undefined ? 1 : opts.drag, fade: opts.fade,
        });
      }
    }
    // rising steam/smoke puff
    steam(x, y, n = 3, color = 'rgba(255,255,255,0.5)') {
      for (let i = 0; i < n; i++) this.add({ x: x + CH.rand(-3, 3), y, vx: CH.rand(-6, 6), vy: CH.rand(-25, -12), life: CH.rand(0.6, 1.2), color, size: CH.irand(1, 2), grav: -10, shape: 'circle', drag: 0.98, grow: 1.5 });
    }
    text(x, y, str, color = '#fff', opts = {}) {
      this.add({ x, y, vx: opts.vx || 0, vy: opts.vy === undefined ? -30 : opts.vy, life: opts.life || 1, color, shape: 'text', text: str, grav: opts.grav === undefined ? 40 : opts.grav, font: opts.font || 'main', outline: opts.outline });
    }
    update(dt) {
      const L = this.list;
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i];
        p.t += dt;
        if (p.t >= p.life) { L.splice(i, 1); continue; }
        p.vy += p.grav * dt;
        p.vx *= p.drag; p.vy *= p.drag;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.floorY !== undefined && p.y > p.floorY) { p.y = p.floorY; p.vy *= -0.4; p.vx *= 0.6; if (Math.abs(p.vy) < 5) p.vy = 0; }
        if (p.onUpdate) p.onUpdate(p, dt);
      }
    }
    draw(g, camX = 0, camY = 0) {
      const gfx = CH.gfx;
      for (const p of this.list) {
        const k = 1 - p.t / p.life;
        const x = Math.round(p.x - camX), y = Math.round(p.y - camY);
        if (p.fade) g.globalAlpha = k;
        switch (p.shape) {
          case 'circle': { const r = p.size * (p.grow ? 1 + (1 - k) * (p.grow - 1) : 1); gfx.circle(x, y, r, p.color); break; }
          case 'spark': gfx.rect(x, y, 1, 1, p.color); gfx.rect(x - Math.sign(p.vx), y - Math.sign(p.vy), 1, 1, p.color); break;
          case 'text': gfx.text(p.text, x, y, p.color, { align: 'center', font: p.font, outline: p.outline || '#000' }); break;
          case 'ring': gfx.ellipseOutline(x, y, p.size * (1 + (1 - k) * 3), p.size * (1 + (1 - k) * 3) * 0.6, p.color); break;
          case 'rect': gfx.rect(x - (p.w >> 1), y - (p.h >> 1), p.w, p.h, p.color); break;
          default: { const s = k < 0.3 && p.size > 1 ? Math.max(1, p.size - 1) : p.size; gfx.rect(x, y, s, s, p.color); }
        }
        if (p.fade) g.globalAlpha = 1;
      }
    }
  }
  CH.Particles = Particles;
  CH.fxParticles = new Particles(); // screen-space global
})(window.CH);
