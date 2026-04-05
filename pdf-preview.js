import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs";

const previewNodes = Array.from(document.querySelectorAll("[data-pdf-preview]"));

async function renderPreview(node) {
  const src = node.getAttribute("data-pdf-preview");
  if (!src) return;

  const url = new URL(src, window.location.href).href;
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const containerWidth = Math.max(node.clientWidth, 280);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = containerWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  canvas.width = Math.ceil(viewport.width * window.devicePixelRatio);
  canvas.height = Math.ceil(viewport.height * window.devicePixelRatio);
  canvas.style.width = `${Math.ceil(viewport.width)}px`;
  canvas.style.height = `${Math.ceil(viewport.height)}px`;

  context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

  await page.render({
    canvasContext: context,
    viewport
  }).promise;

  const oldCanvas = node.querySelector("canvas");
  if (oldCanvas) oldCanvas.remove();

  node.prepend(canvas);
  node.classList.add("is-rendered");
}

for (const node of previewNodes) {
  renderPreview(node).catch(() => {
    node.classList.remove("is-rendered");
  });
}
