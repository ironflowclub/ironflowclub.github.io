async function loadComponent(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  const res = await fetch(file);
  const html = await res.text();
  el.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("footer-container", "/assets/components/footer.html");

  // Set year after footer is injected into the DOM
  document.querySelectorAll('.footer-year, .yr').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});