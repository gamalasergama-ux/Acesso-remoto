// Independent gesture state machine. Coordinates are display pixels, not remote
// screen pixels; MeshCentral performs the final DPI/scale conversion.
export class Gestures {
  constructor(send, bounds, now = () => performance.now()) {
    this.send = send; this.bounds = bounds; this.now = now;
    this.mode = 'touchpad'; this.x = 0; this.y = 0; this.points = new Map(); this.down = false;
  }
  clamp() { const b = this.bounds(); this.x = Math.max(0, Math.min(b.width - 1, this.x)); this.y = Math.max(0, Math.min(b.height - 1, this.y)); }
  emit(type, extra = {}) { this.clamp(); this.send({ type, x: this.x, y: this.y, ...extra }); }
  start(id, x, y) {
    if (this.points.size === 0) {
      this.started = this.now(); this.moved = false; this.multi = false;
      if (this.mode === 'direct') { this.x = x; this.y = y; this.emit('move'); }
    } else { this.multi = true; this.release(); }
    this.points.set(id, { x, y });
  }
  move(id, x, y) {
    const p = this.points.get(id); if (!p) return;
    const dx = x - p.x, dy = y - p.y; this.points.set(id, { x, y });
    if (Math.abs(dx) + Math.abs(dy) > 1) this.moved = true;
    if (this.points.size > 1) { if (dy) this.emit('scroll', { delta: -dy * 3 }); return; }
    if (this.mode === 'direct') { this.x = x; this.y = y; }
    else { this.x += dx * 1.4; this.y += dy * 1.4; }
    this.emit('move');
  }
  hold() {
    if (this.points.size === 1 && !this.moved && !this.multi) { this.down = true; this.emit('down', { button: 0 }); }
  }
  end(id) {
    if (!this.points.has(id)) return;
    this.points.delete(id);
    if (this.down) this.release();
    else if (!this.multi && !this.moved && this.now() - this.started < 450) this.click(0);
  }
  click(button = 0) { this.emit('down', { button }); this.emit('up', { button }); }
  release() { if (this.down) { this.emit('up', { button: 0 }); this.down = false; } }
  cancel() { this.release(); this.points.clear(); this.multi = false; }
}
