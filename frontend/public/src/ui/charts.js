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

function createBaseOptions(yTitle) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false
    },
    plugins: {
      legend: {
        position: "top"
      },
      tooltip: {
        padding: 10,
        cornerRadius: 10
      }
    },
    elements: {
      line: {
        tension: 0.35,
        borderWidth: 3
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: yTitle
        }
      }
    }
  };
}

export function gerarGraficos(dados) {
  const g1 = document.getElementById("grafico1");
  const g2 = document.getElementById("grafico2");
  const g3 = document.getElementById("grafico3");

  if (chart1) {
    chart1.destroy();
    chart1 = null;
  }
  if (chart2) {
    chart2.destroy();
    chart2 = null;
  }
  if (chart3) {
    chart3.destroy();
    chart3 = null;
  }

  if (!dados || dados.length === 0) return;

  const labels = dados.map((_, i) => `Partida ${i + 1}`);
  const acertos = dados.map((d) => d.acertos || 0);
  const erros = dados.map((d) => d.erros || 0);
  const pontuacoes = dados.map((d) => d.pontuacao || 0);
  const tempos = dados.map((d) => Number(d.tempo || 0));

  chart1 = new Chart(g1, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Acertos", data: acertos },
        { label: "Erros", data: erros }
      ]
    },
    options: createBaseOptions("Quantidade")
  });

  chart2 = new Chart(g2, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Pontuação", data: pontuacoes }
      ]
    },
    options: createBaseOptions("Pontos")
  });

  chart3 = new Chart(g3, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Tempo", data: tempos }
      ]
    },
    options: createBaseOptions("Segundos")
  });
}
