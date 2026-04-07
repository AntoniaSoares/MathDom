import { buscarConfiguracoesUsuario, salvarConfiguracoesUsuario } from "../services/api.js";

let somAtivado = true;
let carregado = false;

function announce(message) {
  const el = document.getElementById("appAnnouncer");
  if (el) el.textContent = message;
}

function getConfiguracoesAtuais() {
  const fontScale = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-scale")
    .trim() || "1";

  return {
    fonte: String(fontScale),
    contraste: document.body.classList.contains("high-contrast"),
    som: somAtivado,
    simplificado: document.body.classList.contains("simplified-mode")
  };
}

async function persistir() {
  if (!carregado) return;
  await salvarConfiguracoesUsuario(getConfiguracoesAtuais());
}

export function tocarSom(tipo = "success") {
  if (!somAtivado) return;

  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = context.createGain();
    gainNode.gain.value = tipo === "success" ? 0.018 : 0.013;
    gainNode.connect(context.destination);

    const notas = tipo === "success"
      ? [392, 440, 494]
      : [220, 196];

    notas.forEach((freq, index) => {
      const osc = context.createOscillator();
      const localGain = context.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      localGain.gain.setValueAtTime(0.0001, context.currentTime);
      const start = context.currentTime + index * 0.06;
      const end = start + (tipo === "success" ? 0.16 : 0.12);
      localGain.gain.exponentialRampToValueAtTime(gainNode.gain.value, start + 0.02);
      localGain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(localGain);
      localGain.connect(gainNode);
      osc.start(start);
      osc.stop(end + 0.01);
    });
  } catch (error) {
    console.warn("Som não pôde ser reproduzido.", error);
  }
}

export async function aplicarConfiguracoesSalvas() {
  const cfg = await buscarConfiguracoesUsuario();
  carregado = true;

  if (!cfg) return;

  document.documentElement.style.setProperty("--font-scale", cfg.fonte || "1");
  document.body.classList.toggle("high-contrast", !!cfg.contraste);
  document.body.classList.toggle("simplified-mode", !!cfg.simplificado);
  somAtivado = cfg.som !== false;
}

window.aumentarTexto = async function () {
  const atual = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--font-scale")) || 1;
  const novo = Math.min(atual + 0.1, 1.6);
  document.documentElement.style.setProperty("--font-scale", novo);
  announce(`Tamanho do texto aumentado para ${novo.toFixed(1)}`);
  await persistir();
};

window.diminuirTexto = async function () {
  const atual = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--font-scale")) || 1;
  const novo = Math.max(atual - 0.1, 0.8);
  document.documentElement.style.setProperty("--font-scale", novo);
  announce(`Tamanho do texto reduzido para ${novo.toFixed(1)}`);
  await persistir();
};

window.toggleContraste = async function () {
  document.body.classList.toggle("high-contrast");
  announce(document.body.classList.contains("high-contrast") ? "Alto contraste ativado" : "Alto contraste desativado");
  await persistir();
};

window.toggleSimplificado = async function () {
  document.body.classList.toggle("simplified-mode");
  announce(document.body.classList.contains("simplified-mode") ? "Modo simplificado ativado" : "Modo simplificado desativado");
  await persistir();
};

window.toggleSom = async function () {
  somAtivado = !somAtivado;
  announce(somAtivado ? "Som ativado" : "Som desativado");
  await persistir();
};
