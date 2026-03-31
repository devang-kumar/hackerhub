// Auto-dismiss alerts
document.querySelectorAll('.alert').forEach(el => {
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.5s'; setTimeout(() => el.remove(), 500); }, 4000);
});

// Animate result bar on load
window.addEventListener('load', () => {
  const fill = document.querySelector('.result-fill');
  if (fill) { const w = fill.style.width; fill.style.width = '0'; setTimeout(() => fill.style.width = w, 100); }
});
