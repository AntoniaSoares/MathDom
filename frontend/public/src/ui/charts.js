import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

let chart1 = null;
let chart2 = null;
let chart3 = null;

// 0 = normal. Valores positivos aumentam bastante a escala.
// Valores negativos deixam a escala mais próxima do maior valor, sem cortar os dados.
const scaleModes = { grafico1: 0, grafico2: 0, grafico3: 0 };
const chartValues = { grafico1: [], grafico2: [], grafico3: [] };

const LEVEL_COLORS = {
  facil: { line: "#16a34a", soft: "rgba(22, 163, 74, 0.22)" },
  medio: { line: "#f59e0b", soft: "rgba(245, 158, 11, 0.24)" },
  dificil: { line: "#dc2626", soft: "rgba(220, 38, 38, 0.22)" },
  default: { line: "#2563eb", soft: "rgba(37, 99, 235, 0.18)" }
};

const levelPointFillPlugin = {
  id: "levelPointFillPlugin",
  beforeDatasetsDraw(chart) {
    const cfg = chart.options.plugins?.levelPointFill;
    if (!cfg?.values?.length) return;

    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;
    const yScale = scales.y;
    if (!xScale || !yScale) return;

    const count = cfg.values.length;
    const availableWidth = chartArea.right - chartArea.left;
    const barWidth = Math.max(18, Math.min(46, availableWidth / Math.max(count, 1) * 0.52));
    const baseY = yScale.getPixelForValue(0);

    ctx.save();
    cfg.values.forEach((value, index) => {
      const numeric = Number(value) || 0;
      const x = xScale.getPixelForValue(index);
      const y = yScale.getPixelForValue(numeric);
      const nivel = cfg.levels?.[index];
      const color = corNivel(nivel).soft;

      const top = Math.min(y, baseY);
      const height = Math.max(2, Math.abs(baseY - y));

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x - barWidth / 2, top, barWidth, height, 8);
      ctx.fill();
    });
    ctx.restore();
  }
};

Chart.register(levelPointFillPlugin);

function normalizarNivel(nivel) {
  return String(nivel || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function corNivel(nivel) {
  return LEVEL_COLORS[normalizarNivel(nivel)] || LEVEL_COLORS.default;
}

function calcularMaximo(valores, modo) {
  const maior = Math.max(1, ...valores.map((v) => Number(v) || 0));

  // Diminui a folga para visualizar valores próximos com mais detalhe, sem cortar o maior ponto.
  if (modo < 0) {
    const folga = Math.max(0.025, 0.18 - Math.abs(modo) * 0.035);
    return Math.max(5, Math.ceil(maior * (1 + folga)));
  }

  // Escala normal.
  if (modo === 0) return Math.max(10, Math.ceil(maior * 1.25));

  // Escala ampla: permite ampliar bastante a visualização quando houver discrepâncias grandes.
  return Math.max(20, Math.ceil(maior * (1.25 + modo * 0.85)));
}

function textoEscala(mode) {
  if (mode < 0) return `detalhada ${Math.abs(mode)}`;
  if (mode === 0) return "normal";
  return `ampla ${mode}`;
}

function atualizarLabelEscala(canvasId) {
  const label = document.getElementById(`${canvasId}ScaleLabel`);
  if (!label) return;
  label.textContent = textoEscala(scaleModes[canvasId]);
}

function aplicarEscala(canvasId, chart) {
  if (!chart) return;
  prepararRolagem(canvasId, chart.data.labels?.length || chartValues[canvasId]?.length || 0);
  chart.options.scales.y.max = calcularMaximo(chartValues[canvasId], scaleModes[canvasId]);
  chart.resize();
  chart.update();
  atualizarLabelEscala(canvasId);
}

function criarControleEscala(canvasId, chartRefGetter, valores) {
  chartValues[canvasId] = valores;

  const canvas = document.getElementById(canvasId);
  const card = canvas?.closest(".chart-card");
  if (!card) return;

  let controls = card.querySelector(`[data-scale-control="${canvasId}"]`);
  if (!controls) {
    controls = document.createElement("div");
    controls.className = "chart-controls";
    controls.dataset.scaleControl = canvasId;
    controls.innerHTML = `
      <span>Escala do gráfico:</span>
      <button type="button" class="scale-btn" data-action="minus" title="Diminuir escala">−</button>
      <strong id="${canvasId}ScaleLabel">normal</strong>
      <button type="button" class="scale-btn" data-action="plus" title="Aumentar escala">+</button>
      <button type="button" class="scale-btn scale-reset" data-action="reset" title="Voltar ao normal">0</button>
    `;

    const title = card.querySelector("h4");
    title?.after(controls);

    controls.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-action]");
      if (!btn) return;

      if (btn.dataset.action === "plus") scaleModes[canvasId] = Math.min(50, scaleModes[canvasId] + 1);
      if (btn.dataset.action === "minus") scaleModes[canvasId] = Math.max(-5, scaleModes[canvasId] - 1);
      if (btn.dataset.action === "reset") scaleModes[canvasId] = 0;

      aplicarEscala(canvasId, chartRefGetter());
    });
  }

  atualizarLabelEscala(canvasId);
}

function prepararRolagem(canvasId, totalPontos) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  let windowEl = canvas.closest(".chart-scroll-window");
  let inner = canvas.closest(".chart-scroll-inner");

  if (!windowEl || !inner) {
    windowEl = document.createElement("div");
    windowEl.className = "chart-scroll-window";

    inner = document.createElement("div");
    inner.className = "chart-scroll-inner";

    canvas.parentNode.insertBefore(windowEl, canvas);
    windowEl.appendChild(inner);
    inner.appendChild(canvas);
  }

  const modo = scaleModes[canvasId] || 0;

  if (modo <= 0) {
    windowEl.classList.remove("chart-scroll-active");
    inner.style.minWidth = "100%";
    inner.style.width = "100%";
    inner.style.height = "255px";
    canvas.style.width = "100%";
    canvas.style.height = "255px";
    return;
  }

  windowEl.classList.add("chart-scroll-active");
  const basePorPartida = 42;
  const incrementoPorEscala = Math.min(38, 8 + modo * 0.65);
  const largura = Math.max(760, totalPontos * (basePorPartida + incrementoPorEscala));
  inner.style.minWidth = largura + "px";
  inner.style.width = largura + "px";
  inner.style.height = "255px";
  canvas.style.width = largura + "px";
  canvas.style.height = "255px";
}

function createBaseOptions(yTitle, valores, canvasId, dados, valoresPreenchimento) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false
    },
    plugins: {
      legend: {
        position: "top",
        labels: { usePointStyle: true }
      },
      tooltip: {
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          afterBody(items) {
            const index = items?.[0]?.dataIndex ?? 0;
            const chart = items?.[0]?.chart;
            const nivel = chart?.data?.nivelPorPonto?.[index];
            return nivel ? `Nível: ${nivel}` : "";
          }
        }
      },
      levelPointFill: {
        values: valoresPreenchimento,
        levels: dados.map((d) => d.nivel || "-")
      }
    },
    elements: {
      line: { tension: 0.35, borderWidth: 3 },
      point: { radius: 5, hoverRadius: 7, borderWidth: 2 }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 55,
          minRotation: 35
        }
      },
      y: {
        beginAtZero: true,
        max: calcularMaximo(valores, scaleModes[canvasId]),
        title: { display: true, text: yTitle }
      }
    }
  };
}

function lineDataset(label, data, dados, fallbackColor = "#2563eb") {
  return {
    type: "line",
    label,
    data,
    borderColor: fallbackColor,
    backgroundColor: "rgba(255,255,255,0)",
    pointBackgroundColor: dados.map((d) => corNivel(d.nivel).line),
    pointBorderColor: dados.map((d) => corNivel(d.nivel).line),
    segment: {
      borderColor: (ctx) => corNivel(dados[ctx.p0DataIndex]?.nivel).line
    },
    order: 1
  };
}

function destruirGraficos() {
  if (chart1) chart1.destroy();
  if (chart2) chart2.destroy();
  if (chart3) chart3.destroy();
  chart1 = chart2 = chart3 = null;
}

export function gerarGraficos(dados) {
  const g1 = document.getElementById("grafico1");
  const g2 = document.getElementById("grafico2");
  const g3 = document.getElementById("grafico3");

  destruirGraficos();
  if (!dados || dados.length === 0) return;

  const labels = dados.map((_, i) => `Partida ${i + 1}`);
  const acertos = dados.map((d) => Number(d.acertos || 0));
  const erros = dados.map((d) => Number(d.erros || 0));
  const pontuacoes = dados.map((d) => Number(d.pontuacao || 0));
  const tempos = dados.map((d) => Number(d.tempo || 0));
  const niveis = dados.map((d) => d.nivel || "-");
  const acertosErrosMax = acertos.map((valor, i) => Math.max(valor, erros[i] || 0));

  prepararRolagem("grafico1", labels.length);
  prepararRolagem("grafico2", labels.length);
  prepararRolagem("grafico3", labels.length);

  chart1 = new Chart(g1, {
    type: "line",
    data: {
      labels,
      nivelPorPonto: niveis,
      datasets: [
        lineDataset("Acertos", acertos, dados, "#2563eb"),
        lineDataset("Erros", erros, dados, "#64748b")
      ]
    },
    options: createBaseOptions("Quantidade", [...acertos, ...erros], "grafico1", dados, acertosErrosMax)
  });

  chart2 = new Chart(g2, {
    type: "line",
    data: {
      labels,
      nivelPorPonto: niveis,
      datasets: [
        lineDataset("Pontuação", pontuacoes, dados, "#2563eb")
      ]
    },
    options: createBaseOptions("Pontos", pontuacoes, "grafico2", dados, pontuacoes)
  });

  chart3 = new Chart(g3, {
    type: "line",
    data: {
      labels,
      nivelPorPonto: niveis,
      datasets: [
        lineDataset("Tempo", tempos, dados, "#2563eb")
      ]
    },
    options: createBaseOptions("Segundos", tempos, "grafico3", dados, tempos)
  });

  criarControleEscala("grafico1", () => chart1, [...acertos, ...erros]);
  criarControleEscala("grafico2", () => chart2, pontuacoes);
  criarControleEscala("grafico3", () => chart3, tempos);
}
