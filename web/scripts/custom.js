/* Gama Remote adds controls to the upstream UI; authentication, permissions,
   transport and screen rendering remain in MeshCentral. No credentials stored. */
window.addEventListener('load', async () => {
  const help = document.createElement('a');
  help.href = 'gama-ajuda.html'; help.textContent = 'Ajuda Gama Remote';
  help.className = 'gama-help'; help.target = '_blank'; help.rel = 'noopener';
  document.body.append(help);
  const canvas = document.getElementById('Desk');
  if (!canvas) return;
  const { Gestures } = await import('./gestures.js');
  let enabled = false, timer, activeEngine;
  function allowed() {
    if (!window.desktop?.m || window.desktop.State !== 3 || window.xxdialogMode) return false;
    if (typeof window.GetNodeRights !== 'function' || !window.currentNode) return false;
    const rights = window.GetNodeRights(window.currentNode);
    return (rights === 0xFFFFFFFF || ((rights & 8) && !(rights & 256) && !(rights & 4096))) && !(window.features2 & 0x2000);
  }
  function send(event) {
    // Allow mouse-up to the same transport during cancellation, never redirect a
    // held button into a newly selected computer.
    const engine = activeEngine;
    if (!engine || (!allowed() && event.type !== 'up')) return;
    const rect = canvas.getBoundingClientRect();
    const e = { pageX: rect.left + scrollX + event.x, pageY: rect.top + scrollY + event.y, button: event.button || 0, which: event.button === 2 ? 3 : 1, wheelDelta: event.delta || 0 };
    engine.SendMouseMsg({ move: 0, down: 1, up: 2, scroll: 3 }[event.type], e);
    window.setSessionActivity?.();
  }
  const gestures = new Gestures(send, () => canvas.getBoundingClientRect());
  const bar = document.createElement('details'); bar.className = 'gama-controls'; bar.hidden = true;
  const title = document.createElement('summary'); title.textContent = 'Controles Gama'; bar.append(title);
  const panel = document.createElement('div'); bar.append(panel);
  function button(text, action) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = text;
    b.addEventListener('click', action); panel.append(b); return b;
  }
  function reset() { clearTimeout(timer); gestures.cancel(); }
  const toggle = button('Ativar Touch Gama', () => {
    reset(); enabled = !enabled; activeEngine = window.desktop?.m;
    gestures.x = canvas.clientWidth / 2; gestures.y = canvas.clientHeight / 2;
    canvas.classList.toggle('gama-touch', enabled);
    toggle.textContent = enabled ? 'Touch Gama ligado' : 'Ativar Touch Gama'; toggle.setAttribute('aria-pressed', String(enabled));
  });
  const mode = button('Modo: touchpad', () => { reset(); gestures.mode = gestures.mode === 'touchpad' ? 'direct' : 'touchpad'; mode.textContent = gestures.mode === 'direct' ? 'Modo: toque direto' : 'Modo: touchpad'; });
  button('Clique direito', () => { if (allowed()) { activeEngine = window.desktop.m; gestures.click(2); } });
  button('Rolar ↑', () => { if (allowed()) { activeEngine = window.desktop.m; gestures.emit('scroll', { delta: 40 }); } });
  button('Rolar ↓', () => { if (allowed()) { activeEngine = window.desktop.m; gestures.emit('scroll', { delta: -40 }); } });
  button('Teclado', () => { if (allowed() && typeof window.toggleKeyboard === 'function') window.toggleKeyboard(); });
  function key(keys) {
    if (!allowed()) return;
    const m = window.desktop.m;
    window.setSessionActivity?.();
    const pressed = [];
    try { for (const k of keys) { m.SendKeyMsgKC(1, k); pressed.push(k); } }
    finally { for (const k of pressed.reverse()) m.SendKeyMsgKC(2, k); }
  }
  button('Enter', () => key([13])); button('Esc', () => key([27]));
  button('Tab', () => key([9])); button('Ctrl+C', () => key([17, 67])); button('Ctrl+V', () => key([17, 86]));
  button('Desconectar', () => { reset(); window.desktop?.Stop(); });
  const hint = document.createElement('p'); hint.textContent = 'Toque: clique. Segure e mova: arrastar. Dois dedos: rolar. Para ampliar, use o zoom nativo da tela.'; panel.append(hint);
  document.body.append(bar);
  // Capture only touch pointers while the optional Gama mode is on. Mouse and
  // pen input, and the upstream UI when off, keep their original handlers.
  function take(event) {
    if (!enabled || event.pointerType !== 'touch' || !allowed()) return false;
    event.preventDefault(); event.stopImmediatePropagation(); activeEngine = window.desktop.m; return true;
  }
  canvas.addEventListener('pointerdown', event => {
    if (!take(event)) return;
    canvas.setPointerCapture(event.pointerId);
    const b = canvas.getBoundingClientRect(); gestures.start(event.pointerId, event.clientX - b.left, event.clientY - b.top);
    clearTimeout(timer); timer = setTimeout(() => gestures.hold(), 450);
  }, true);
  canvas.addEventListener('pointermove', event => {
    if (!take(event)) return;
    const b = canvas.getBoundingClientRect(); gestures.move(event.pointerId, event.clientX - b.left, event.clientY - b.top);
  }, true);
  canvas.addEventListener('pointerup', event => { if (take(event)) { clearTimeout(timer); gestures.end(event.pointerId); } }, true);
  for (const name of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(name, reset);
  for (const name of ['touchstart', 'touchmove', 'touchend']) canvas.addEventListener(name, e => {
    if (enabled && allowed()) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, { capture: true, passive: false });
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  window.addEventListener('pagehide', reset);
  setInterval(() => {
    const ok = allowed(); bar.hidden = !ok;
    if (!ok || activeEngine !== window.desktop?.m) { reset(); activeEngine = undefined; }
  }, 250);
});
