import { criarPecaTravada } from "./DominoPiece.js";

let esquerda = null;
let direita = null;
let totalNoTabuleiro = 0;
let selectedPieceEl = null;
let activeHandlers = null;

function resetBoardState() {
  esquerda = null;
  direita = null;
  totalNoTabuleiro = 0;
  selectedPieceEl = null;
  activeHandlers = null;
}

function normalizarPeca(piece, lado) {
  if (lado === "primeira") return piece;

  if (lado === "esquerda") {
    if (piece.rightValue === esquerda) return piece;
    if (piece.leftValue === esquerda) {
      return {
        ...piece,
        leftLabel: piece.rightLabel,
        leftValue: piece.rightValue,
        rightLabel: piece.leftLabel,
        rightValue: piece.leftValue
      };
    }
  }

  if (lado === "direita") {
    if (piece.leftValue === direita) return piece;
    if (piece.rightValue === direita) {
      return {
        ...piece,
        leftLabel: piece.rightLabel,
        leftValue: piece.rightValue,
        rightLabel: piece.leftLabel,
        rightValue: piece.leftValue
      };
    }
  }

  return null;
}

function lerPecaDoElemento(el) {
  if (!el) return null;
  return {
    id: el.dataset.id,
    leftValue: Number(el.dataset.leftValue),
    rightValue: Number(el.dataset.rightValue),
    leftLabel: el.dataset.leftLabel,
    rightLabel: el.dataset.rightLabel
  };
}

function definirPecaSelecionada(el) {
  if (selectedPieceEl && selectedPieceEl !== el) {
    selectedPieceEl.classList.remove("selected");
  }
  selectedPieceEl = el;
  if (selectedPieceEl) selectedPieceEl.classList.add("selected");
}

export function selecionarPeca(el) {
  if (!el || !el.dataset.id) return;

  if (selectedPieceEl === el) {
    selectedPieceEl.classList.remove("selected");
    selectedPieceEl = null;
    activeHandlers?.onFeedback?.("Seleção removida. Toque em outra peça para escolher.", true);
    return;
  }

  definirPecaSelecionada(el);
  activeHandlers?.onFeedback?.("Peça selecionada. Toque na mesa para posicionar.", true);
}

function escolherLadoPorClique(board, clientX, piece) {
  if (esquerda === null && direita === null) return "primeira";

  const rect = board.getBoundingClientRect();
  const zonaEsquerda = clientX < rect.left + rect.width / 2;

  const tentaEsquerda = piece.leftValue === esquerda || piece.rightValue === esquerda;
  const tentaDireita = piece.leftValue === direita || piece.rightValue === direita;

  if (zonaEsquerda) {
    if (tentaEsquerda) return "esquerda";
    if (tentaDireita) return "direita";
  } else {
    if (tentaDireita) return "direita";
    if (tentaEsquerda) return "esquerda";
  }

  return null;
}

function encaixarPeca({ board, piece, original, ladoPreferido }) {
  if (!piece || !original) return false;

  let encaixada = null;
  let lado = ladoPreferido || "primeira";

  if (esquerda === null && direita === null) {
    lado = "primeira";
    encaixada = piece;
  } else if (lado === "esquerda" || lado === "direita") {
    encaixada = normalizarPeca(piece, lado);
  } else if (piece.leftValue === direita || piece.rightValue === direita) {
    lado = "direita";
    encaixada = normalizarPeca(piece, "direita");
  } else if (piece.leftValue === esquerda || piece.rightValue === esquerda) {
    lado = "esquerda";
    encaixada = normalizarPeca(piece, "esquerda");
  }

  if (!encaixada) {
    activeHandlers.onPontuacao(false);
    original.classList.add("incorrect");
    setTimeout(() => original.classList.remove("incorrect"), 500);
    activeHandlers.onFeedback("Peça não encaixa nos extremos atuais.", false);
    return false;
  }

  const visual = criarPecaTravada(encaixada);
  visual.classList.add("correct");

  if (lado === "primeira") {
    esquerda = encaixada.leftValue;
    direita = encaixada.rightValue;
    board.appendChild(visual);
    activeHandlers.onFeedback("Primeira peça posicionada com sucesso.", true);
  } else if (lado === "esquerda") {
    esquerda = encaixada.leftValue;
    board.insertBefore(visual, board.firstChild);
    activeHandlers.onFeedback("Peça encaixada à esquerda.", true);
  } else {
    direita = encaixada.rightValue;
    board.appendChild(visual);
    activeHandlers.onFeedback("Peça encaixada à direita.", true);
  }

  totalNoTabuleiro += 1;
  original.remove();
  selectedPieceEl = null;
  activeHandlers.onPontuacao(true);
  activeHandlers.onAtualizarExtremos(esquerda, direita, totalNoTabuleiro);

  if (!document.querySelector(".pieces-pool .domino[data-id]")) {
    activeHandlers.onConcluir?.("concluido");
  }

  return true;
}

export function criarTabuleiro({ onPontuacao, onFeedback, onAtualizarExtremos, onConcluir }) {
  const board = document.createElement("div");
  board.className = "board";
  board.setAttribute("role", "button");
  board.setAttribute("tabindex", "0");
  board.setAttribute("aria-label", "Mesa do jogo. No celular ou tablet, toque em uma peça e depois toque aqui para posicionar.");
  resetBoardState();
  activeHandlers = { onPontuacao, onFeedback, onAtualizarExtremos, onConcluir };

  board.addEventListener("dragover", (e) => e.preventDefault());

  board.addEventListener("drop", (e) => {
    e.preventDefault();

    const raw = e.dataTransfer.getData("piece");
    if (!raw) return;

    const piece = JSON.parse(raw);
    const original = document.querySelector(`.pieces-pool [data-id="${piece.id}"]`);
    if (!original) return;

    encaixarPeca({ board, piece, original });
  });

  board.addEventListener("click", (e) => {
    if (!selectedPieceEl) {
      onFeedback("Toque primeiro em uma peça disponível e depois na mesa.", false);
      return;
    }
    const piece = lerPecaDoElemento(selectedPieceEl);
    const lado = escolherLadoPorClique(board, e.clientX, piece);
    encaixarPeca({ board, piece, original: selectedPieceEl, ladoPreferido: lado });
  });

  board.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && selectedPieceEl) {
      e.preventDefault();
      const piece = lerPecaDoElemento(selectedPieceEl);
      const lado = esquerda === null ? "primeira" : (piece.leftValue === direita || piece.rightValue === direita ? "direita" : "esquerda");
      encaixarPeca({ board, piece, original: selectedPieceEl, ladoPreferido: lado });
    }
  });

  return board;
}
