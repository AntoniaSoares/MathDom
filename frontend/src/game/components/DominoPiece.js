function renderHalf(label, value) {
  return `
    <div class="domino-half">
      <div>
        <div>${label}</div>
        <small class="domino-connector">valor ${value}</small>
      </div>
    </div>
  `;
}

function criarElementoBase(piece) {
  const el = document.createElement("div");
  el.className = "domino";
  el.dataset.id = piece.id;
  el.dataset.leftValue = String(piece.leftValue);
  el.dataset.rightValue = String(piece.rightValue);
  el.dataset.leftLabel = piece.leftLabel;
  el.dataset.rightLabel = piece.rightLabel;
  el.innerHTML = `${renderHalf(piece.leftLabel, piece.leftValue)}${renderHalf(piece.rightLabel, piece.rightValue)}`;
  return el;
}

export function criarPeca(piece) {
  const el = criarElementoBase(piece);
  el.setAttribute("draggable", true);

  el.addEventListener("dragstart", (e) => {
    el.classList.add("dragging");
    e.dataTransfer.setData("piece", JSON.stringify(piece));
  });

  el.addEventListener("dragend", () => {
    el.classList.remove("dragging");
  });

  return el;
}

export function criarPecaTravada(piece) {
  const el = criarElementoBase(piece);
  el.classList.add("locked");
  return el;
}
