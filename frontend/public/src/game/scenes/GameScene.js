import { gerarOperacoes, calcularPontuacao, obterMetaNivel, existeJogadaPossivel } from "../utils/mathLogic.js";
import { criarPeca } from "../components/DominoPiece.js";
import { criarTabuleiro } from "../components/Board.js";
import { salvarHistorico } from "../../services/api.js";
import { obterNomeJogador } from "../../services/auth.js";
import { tocarSom } from "../../ui/accessibility.js";

let acertos = 0;
let erros = 0;
let inicio;
let intervaloTempo = null;
let jogoFinalizado = false;

function limparTimers() {
  if (intervaloTempo) clearInterval(intervaloTempo);
}

function criarCelebracao() {
  const burst = document.createElement("div");
  burst.className = "celebration-burst";

  for (let i = 0; i < 22; i++) {
    const dot = document.createElement("span");
    dot.className = "celebration-dot";
    dot.style.left = `${10 + Math.random() * 80}%`;
    dot.style.top = `${55 + Math.random() * 25}%`;
    dot.style.animationDelay = `${Math.random() * 0.18}s`;
    burst.appendChild(dot);
  }

  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1100);
}

function mostrarModalFim({ titulo, mensagem, resumo, onMenu, onHistorico }) {
  const antigo = document.getElementById("gameEndModal");
  if (antigo) antigo.remove();

  const overlay = document.createElement("div");
  overlay.id = "gameEndModal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <span class="brand-badge">Resultado da sessão</span>
      <h3>${titulo}</h3>
      <p>${mensagem}</p>
      <div class="status-grid">
        <div class="status-badge">Acertos: ${resumo.acertos}</div>
        <div class="status-badge">Erros: ${resumo.erros}</div>
        <div class="status-badge">Tempo: ${resumo.tempo}s</div>
        <div class="status-badge">Pontuação: ${resumo.pontuacao}</div>
      </div>
      <div class="modal-actions">
        <button id="btnModalHistorico">Ver histórico</button>
        <button id="btnModalMenu" class="secondary-button">Voltar ao menu</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById("btnModalMenu")?.addEventListener("click", () => {
    overlay.remove();
    onMenu?.();
  });
  document.getElementById("btnModalHistorico")?.addEventListener("click", async () => {
    overlay.remove();
    await onHistorico?.();
  });
}

export function iniciarJogo(nivel, tema = "pokemon") {
  const game = document.getElementById("game");
  game.innerHTML = "";
  limparTimers();

  acertos = 0;
  erros = 0;
  jogoFinalizado = false;
  inicio = Date.now();

  const nomeJogador = obterNomeJogador();
  const meta = obterMetaNivel(nivel);
  const operacoes = gerarOperacoes(nivel);

  const playerNameEl = document.createElement("div");
  playerNameEl.className = "player-name";
  playerNameEl.innerText = `Jogador: ${nomeJogador}`;

  const statusPanel = document.createElement("div");
  statusPanel.className = "status-panel";

  const pontuacaoEl = document.createElement("div");
  pontuacaoEl.className = "status-badge";
  pontuacaoEl.innerText = "Acertos: 0 | Erros: 0";

  const nivelEl = document.createElement("div");
  nivelEl.className = "status-badge";
  nivelEl.innerText = `Nível: ${nivel}`;

  const temaEl = document.createElement("div");
  temaEl.className = "status-badge";
  temaEl.innerText = `Tema: ${tema}`;

  const tempoEl = document.createElement("div");
  tempoEl.className = "status-badge";
  tempoEl.innerText = "Tempo: 0s";

  const extremosEl = document.createElement("div");
  extremosEl.className = "status-badge";
  extremosEl.innerText = "Extremos: - | -";

  statusPanel.append(pontuacaoEl, nivelEl, temaEl, tempoEl, extremosEl);

  intervaloTempo = setInterval(() => {
    const tempoAtual = Math.floor((Date.now() - inicio) / 1000);
    tempoEl.innerText = `Tempo: ${tempoAtual}s`;
  }, 1000);

  const feedbackEl = document.createElement("div");
  feedbackEl.className = "feedback-box";

  const hintEl = document.createElement("p");
  hintEl.className = "game-hint";
  hintEl.innerText = `Arraste as ${meta.quantidade} peças e conecte valores equivalentes nos extremos do dominó.`;

  const boardArea = document.createElement("div");
  boardArea.className = "game-board-area";
  const boardTitle = document.createElement("div");
  boardTitle.className = "section-title";
  boardTitle.innerText = "Mesa do jogo";

  const piecesArea = document.createElement("div");
  piecesArea.className = "game-pieces-area";
  const piecesTitle = document.createElement("div");
  piecesTitle.className = "section-title";
  piecesTitle.innerText = "Peças disponíveis";

  const piecesPool = document.createElement("div");
  piecesPool.className = "pieces-pool";

  const atualizarPontuacao = (acertou) => {
    if (acertou) acertos += 1;
    else erros += 1;
    pontuacaoEl.innerText = `Acertos: ${acertos} | Erros: ${erros}`;
  };

  const atualizarFeedback = (mensagem, sucesso) => {
    feedbackEl.innerText = mensagem;
    feedbackEl.className = sucesso
      ? "feedback-box feedback-success show"
      : "feedback-box feedback-error show";
    tocarSom(sucesso ? "success" : "error");
    if (sucesso) criarCelebracao();
    setTimeout(() => feedbackEl.classList.remove("show"), 420);
  };

  const finalizarPartida = async (motivo = "concluido") => {
    if (jogoFinalizado) return;
    jogoFinalizado = true;
    limparTimers();

    const tempo = Math.floor((Date.now() - inicio) / 1000);
    const pontuacao = calcularPontuacao({
      acertos,
      erros,
      tempo,
      nivel,
      totalPecas: operacoes.length
    });

    const titulo = motivo === "sem-jogadas" ? "Sem novas jogadas" : "Partida concluída";
    const mensagemFinal = motivo === "sem-jogadas"
      ? "Não há mais peças compatíveis com os extremos atuais."
      : "Você concluiu a partida com sucesso.";

    try {
      await salvarHistorico({
        jogador: nomeJogador,
        acertos,
        erros,
        pontuacao,
        tempo,
        nivel,
        tema,
        data: new Date().toISOString(),
        resultado: motivo
      });
      atualizarFeedback(`${mensagemFinal} Resultado salvo no histórico.`, true);
    } catch (error) {
      console.error(error);
      atualizarFeedback("A partida terminou, mas houve erro ao salvar no histórico.", false);
    }

    mostrarModalFim({
      titulo,
      mensagem: `${mensagemFinal} Você pode voltar ao menu ou abrir o histórico para acompanhar o desempenho.`,
      resumo: { acertos, erros, tempo, pontuacao },
      onMenu: () => window.voltarMenu(),
      onHistorico: async () => {
        await window.abrirHistorico();
      }
    });
  };

  const verificarFimPorBloqueio = () => {
    const restantes = Array.from(document.querySelectorAll(".pieces-pool .domino[data-id]"))
      .map((el) => ({
        id: el.dataset.id,
        leftValue: Number(el.dataset.leftValue),
        rightValue: Number(el.dataset.rightValue)
      }));

    const extremosTexto = extremosEl.innerText;
    if (extremosTexto === "Extremos: - | -") return;

    const match = extremosTexto.match(/Extremos: (.+) \| (.+)/);
    if (!match) return;

    const esquerdaAtual = Number(match[1]);
    const direitaAtual = Number(match[2]);

    if (restantes.length > 0 && !existeJogadaPossivel(esquerdaAtual, direitaAtual, restantes)) {
      finalizarPartida("sem-jogadas");
    }
  };

  const tabuleiro = criarTabuleiro({
    onPontuacao: atualizarPontuacao,
    onFeedback: atualizarFeedback,
    onAtualizarExtremos: (esq, dir, quantidade) => {
      extremosEl.innerText = `Extremos: ${esq} | ${dir}`;
      if (quantidade === operacoes.length) {
        finalizarPartida("concluido");
        return;
      }
      verificarFimPorBloqueio();
    },
    onConcluir: finalizarPartida
  });

  operacoes.forEach((op) => piecesPool.appendChild(criarPeca(op)));

  boardArea.append(boardTitle, tabuleiro);
  piecesArea.append(piecesTitle, piecesPool);

  const actions = document.createElement("div");
  actions.className = "history-actions";

  const finalizarBtn = document.createElement("button");
  finalizarBtn.innerText = "Finalizar partida";
  finalizarBtn.onclick = () => finalizarPartida("concluido");

  const voltarBtn = document.createElement("button");
  voltarBtn.innerText = "Voltar";
  voltarBtn.className = "secondary-button";
  voltarBtn.onclick = () => {
    limparTimers();
    window.voltarMenu();
  };

  actions.append(finalizarBtn, voltarBtn);
  game.append(playerNameEl, statusPanel, hintEl, feedbackEl, boardArea, piecesArea, actions);
}
