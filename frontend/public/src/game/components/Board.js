import { criarPecaTravada } from "./DominoPiece.js";

let esquerda = null;
let direita = null;
let totalNoTabuleiro = 0;

function resetBoardState() {
  esquerda = null;
  direita = null;
  totalNoTabuleiro = 0;
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

export function criarTabuleiro({ onPontuacao, onFeedback, onAtualizarExtremos, onConcluir }) {
  const board = document.createElement("div");
  board.className = "board";
  resetBoardState();

  board.addEventListener("dragover", (e) => e.preventDefault());

  board.addEventListener("drop", (e) => {
    e.preventDefault();

    const raw = e.dataTransfer.getData("piece");
    if (!raw) return;

    const piece = JSON.parse(raw);
    const original = document.querySelector(`.pieces-pool [data-id="${piece.id}"]`);
    if (!original) return;

    let encaixada = null;
    let lado = "primeira";

    if (esquerda === null && direita === null) {
      encaixada = piece;
    } else if (piece.leftValue === direita || piece.rightValue === direita) {
      lado = "direita";
      encaixada = normalizarPeca(piece, "direita");
    } else if (piece.leftValue === esquerda || piece.rightValue === esquerda) {
      lado = "esquerda";
      encaixada = normalizarPeca(piece, "esquerda");
    }

    if (!encaixada) {
      onPontuacao(false);
      original.classList.add("incorrect");
      setTimeout(() => original.classList.remove("incorrect"), 500);
      onFeedback("Peça não encaixa nos extremos atuais.", false);
      return;
    }

    const visual = criarPecaTravada(encaixada);
    visual.classList.add("correct");

    if (lado === "primeira") {
      esquerda = encaixada.leftValue;
      direita = encaixada.rightValue;
      board.appendChild(visual);
      onFeedback("Primeira peça posicionada com sucesso.", true);
    } else if (lado === "esquerda") {
      esquerda = encaixada.leftValue;
      board.insertBefore(visual, board.firstChild);
      onFeedback("Peça encaixada à esquerda.", true);
    } else {
      direita = encaixada.rightValue;
      board.appendChild(visual);
      onFeedback("Peça encaixada à direita.", true);
    }

    totalNoTabuleiro += 1;
    original.remove();
    onPontuacao(true);
    onAtualizarExtremos(esquerda, direita, totalNoTabuleiro);

    if (!document.querySelector(".pieces-pool .domino[data-id]")) {
      onConcluir?.("concluido");
    }
  });

  return board;
}
