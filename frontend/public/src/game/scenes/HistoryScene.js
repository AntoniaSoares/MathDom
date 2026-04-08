import { buscarHistorico } from "../../services/api.js";
import { gerarGraficos } from "../../ui/charts.js";
import { obterNomeJogador } from "../../services/auth.js";

function formatarData(data) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
}

function formatarTempoMedio(segundos) {
  const mins = Math.floor(segundos / 60);
  const secs = Math.round(segundos % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function calcularStats(dados) {
  if (!dados.length) {
    return { total: 0, totalAcertos: 0, mediaPontos: 0, tempoMedio: "0:00" };
  }

  const total = dados.length;
  const totalAcertos = dados.reduce((soma, item) => soma + (item.acertos || 0), 0);
  const mediaPontos = (dados.reduce((soma, item) => soma + (item.pontuacao || 0), 0) / total).toFixed(1);
  const tempoMedio = formatarTempoMedio(dados.reduce((soma, item) => soma + (item.tempo || 0), 0) / total);

  return { total, totalAcertos, mediaPontos, tempoMedio };
}

function renderizarTabela(dados) {
  const wrapper = document.getElementById("historyTableWrapper");

  if (!dados.length) {
    wrapper.innerHTML = "<p>Nenhum registro encontrado para este jogador.</p>";
    return;
  }

  const linhas = [...dados].reverse().map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.nivel || "-"}</td>
      <td>${item.tema || "-"}</td>
      <td>${item.pontuacao ?? 0}</td>
      <td>${item.acertos ?? 0}</td>
      <td>${item.erros ?? 0}</td>
      <td>${Math.round(item.tempo ?? 0)}s</td>
      <td>${formatarData(item.data)}</td>
    </tr>
  `).join("");

  wrapper.innerHTML = `
    <table class="history-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Nível</th>
          <th>Tema</th>
          <th>Pontuação</th>
          <th>Acertos</th>
          <th>Erros</th>
          <th>Tempo</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
  `;
}

function renderizarResumo(stats) {
  const summary = document.getElementById("historySummaryCards");
  summary.innerHTML = `
    <div class="summary-card">
      <div class="summary-value">${stats.total}</div>
      <div class="summary-label">Partidas</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${stats.totalAcertos}</div>
      <div class="summary-label">Total de acertos</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${stats.mediaPontos}</div>
      <div class="summary-label">Média de pontos</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${stats.tempoMedio}</div>
      <div class="summary-label">Tempo médio</div>
    </div>
  `;
}

export async function carregarHistorico() {
  const container = document.getElementById("historico");
  const nomeJogador = obterNomeJogador();
  container.innerHTML = "Carregando histórico...";
  document.getElementById("historySummaryCards").innerHTML = "";
  document.getElementById("historyTableWrapper").innerHTML = "";

  try {
    const dados = await buscarHistorico();
    const stats = calcularStats(dados);
    const ultimo = dados[dados.length - 1];

    container.innerHTML = `
      <div class="menu-section">
        <p><strong>Jogador:</strong> ${nomeJogador}</p>
        <p><strong>Total de partidas:</strong> ${stats.total}</p>
        <p><strong>Último nível jogado:</strong> ${ultimo?.nivel || "-"}</p>
        <p><strong>Último tema utilizado:</strong> ${ultimo?.tema || "-"}</p>
      </div>
    `;

    renderizarResumo(stats);
    renderizarTabela(dados);
    gerarGraficos(dados);
  } catch (error) {
    console.error(error);
    container.innerHTML = "<div class='menu-section'><p>Erro ao carregar histórico.</p><p>Verifique as permissões do Firebase e se existem partidas salvas para este usuário.</p></div>";
    document.getElementById("historyTableWrapper").innerHTML = "<p>Não foi possível montar a tabela.</p>";
  }
}
