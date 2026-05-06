const LEVEL_CONFIG = {
  facil: {
    quantidade: 10,
    intervalo: [0, 10],
    tipos: ["numero", "soma", "subtracao"],
    bonus: 1,
    tempoIdeal: 120
  },
  medio: {
    quantidade: 19,
    intervalo: [0, 20],
    tipos: ["numero", "soma", "subtracao", "multiplicacao"],
    bonus: 1.2,
    tempoIdeal: 180
  },
  dificil: {
    quantidade: 28,
    intervalo: [0, 40],
    tipos: ["numero", "soma", "subtracao", "multiplicacao", "divisao"],
    bonus: 1.5,
    tempoIdeal: 240
  }
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function criarRepresentacao(valor, config) {
  const tipos = shuffle(config.tipos);

  for (const tipo of tipos) {
    if (tipo === "numero") return { label: String(valor), value: valor };

    if (tipo === "soma") {
      const a = randomInt(0, valor);
      const b = valor - a;
      return { label: `${a}+${b}`, value: valor };
    }

    if (tipo === "subtracao") {
      const b = randomInt(0, config.intervalo[1]);
      const a = valor + b;
      return { label: `${a}-${b}`, value: valor };
    }

    if (tipo === "multiplicacao") {
      const fatores = [];
      for (let i = 1; i <= Math.max(1, Math.floor(Math.sqrt(Math.max(1, valor)))); i++) {
        if (valor % i === 0) fatores.push([i, valor / i]);
      }
      if (fatores.length) {
        const [a, b] = fatores[randomInt(0, fatores.length - 1)];
        return { label: `${a}×${b}`, value: valor };
      }
    }

    if (tipo === "divisao") {
      const divisor = randomInt(1, 10);
      const dividendo = valor * divisor;
      return { label: `${dividendo}÷${divisor}`, value: valor };
    }
  }

  return { label: String(valor), value: valor };
}

export function gerarOperacoes(nivel) {
  const config = LEVEL_CONFIG[nivel] || LEVEL_CONFIG.facil;
  const [min, max] = config.intervalo;
  const valores = [randomInt(min, max)];

  while (valores.length < config.quantidade + 1) {
    const ultimo = valores[valores.length - 1];
    let candidato = randomInt(min, max);

    while (candidato === ultimo) {
      candidato = randomInt(min, max);
    }

    valores.push(candidato);
  }

  const pecas = [];

  for (let i = 0; i < config.quantidade; i++) {
    const esquerda = criarRepresentacao(valores[i], config);
    const direita = criarRepresentacao(valores[i + 1], config);

    pecas.push({
      id: `piece-${i}-${crypto.randomUUID ? crypto.randomUUID() : Math.random()}`,
      leftLabel: esquerda.label,
      leftValue: esquerda.value,
      rightLabel: direita.label,
      rightValue: direita.value
    });
  }

  return shuffle(pecas);
}

export function existeJogadaPossivel(extremoEsquerdo, extremoDireito, pecasRestantes = []) {
  if (extremoEsquerdo === null || extremoDireito === null) return true;

  return pecasRestantes.some((piece) => (
    piece.leftValue === extremoEsquerdo ||
    piece.rightValue === extremoEsquerdo ||
    piece.leftValue === extremoDireito ||
    piece.rightValue === extremoDireito
  ));
}

export function calcularPontuacao({ acertos, erros, tempo, nivel, totalPecas }) {
  const config = LEVEL_CONFIG[nivel] || LEVEL_CONFIG.facil;
  const eficiencia = Math.max(0, acertos - erros * 0.5);
  const bonusTempo = Math.max(0, config.tempoIdeal - tempo) / 10;
  const base = (eficiencia * 10 + bonusTempo + totalPecas * 2) * config.bonus;
  return Math.max(0, Math.round(base));
}

export function obterMetaNivel(nivel) {
  return LEVEL_CONFIG[nivel] || LEVEL_CONFIG.facil;
}
