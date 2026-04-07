import { iniciarJogo } from "./scenes/GameScene.js";
import { carregarHistorico } from "./scenes/HistoryScene.js";
import {
  loginUser,
  registerUser,
  logoutUser,
  observarAutenticacao,
  obterNomeJogador
} from "../services/auth.js";
import { aplicarTema } from "../config/gameConfig.js";
import { aplicarConfiguracoesSalvas } from "../ui/accessibility.js";
import "../ui/pdf.js";

const THEME_INFO = {
  pokemon: {
    descricao: "Pokémon: visual azul e dinâmico para uma experiência leve e divertida.",
    pecas: "10 peças no fácil · 19 no médio · 28 no difícil"
  },
  mario: {
    descricao: "Mario: estilo retrô com energia visual marcante e elementos lúdicos.",
    pecas: "10 peças no fácil · 19 no médio · 28 no difícil"
  },
  biblioteca: {
    descricao: "Biblioteca: visual acolhedor e pedagógico, ideal para sessões focadas.",
    pecas: "10 peças no fácil · 19 no médio · 28 no difícil"
  }
};

const INFO_CONTENT = {
  ajuda: {
    tag: "Ajuda rápida",
    titulo: "Como aplicar o MathDom",
    conteudo: `
      <section class="about-card">
        <h4>Antes da sessão</h4>
        <ul>
          <li>Selecione o nível de acordo com o objetivo pedagógico e o tempo disponível.</li>
          <li>Escolha o tema visual mais confortável para o participante.</li>
          <li>Ative contraste, fonte ampliada ou modo simplificado quando necessário.</li>
        </ul>
      </section>
      <section class="about-card">
        <h4>Durante a aplicação</h4>
        <ul>
          <li>Explique que o objetivo é conectar valores equivalentes nas extremidades do dominó.</li>
          <li>Use o feedback visual e sonoro como reforço breve, sem sobrecarga.</li>
          <li>Observe tempo, acertos, erros e padrão de resolução para discussão posterior.</li>
        </ul>
      </section>
      <section class="about-card">
        <h4>Quando a partida termina</h4>
        <ul>
          <li>O jogo finaliza quando todas as peças forem usadas ou quando não houver jogadas possíveis.</li>
          <li>Abra o histórico para visualizar indicadores, tabela e gráficos.</li>
          <li>Use o PDF para registrar os resultados da aplicação no TCC.</li>
        </ul>
      </section>
      <section class="about-card">
        <h4>Dica de mediação</h4>
        <p>Mantenha instruções curtas, previsíveis e concretas. Sempre que possível, faça uma rodada demonstrativa antes do teste principal.</p>
      </section>
    `
  },
  sobre: {
    tag: "Sobre o produto",
    titulo: "MathDom",
    conteudo: `
      <section class="about-card">
        <h4>Descrição</h4>
        <p>MathDom é um jogo digital educativo inspirado no dominó das operações, desenvolvido para apoiar o ensino de matemática em contexto inclusivo, com foco em educandos com TEA.</p>
      </section>
      <section class="about-card">
        <h4>Principais recursos</h4>
        <ul>
          <li>Cadastro e login de usuário.</li>
          <li>Temas visuais personalizados e plano de fundo por tema.</li>
          <li>Acessibilidade com contraste, fonte ampliada, modo simplificado e som ajustável.</li>
          <li>Histórico com indicadores, gráficos e exportação em PDF.</li>
        </ul>
      </section>
      <section class="about-card">
        <h4>Objetivo pedagógico</h4>
        <p>Estimular reconhecimento de equivalência numérica e resolução de operações, promovendo atenção, previsibilidade e participação em uma atividade estruturada.</p>
      </section>
      <section class="about-card">
        <h4>Uso no TCC</h4>
        <p>Esta versão foi organizada para aplicação piloto e coleta de dados, permitindo comparar desempenho por nível, tempo e acertos em diferentes sessões.</p>
      </section>
    `
  }
};

function mostrarTela(tela) {
  ["loginScreen", "menuScreen", "gameScreen", "historyScreen"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === tela ? "flex" : "none";
  });

  if (tela === "loginScreen") {
    aplicarTema(null, "inicio");
  }
}

function atualizarBoasVindas() {
  const welcome = document.getElementById("welcomeText");
  if (welcome) welcome.textContent = `Bem-vinda, ${obterNomeJogador()}!`;
}

function atualizarPreviewTema() {
  const tema = document.getElementById("tema")?.value || "pokemon";
  const info = THEME_INFO[tema] || THEME_INFO.pokemon;
  const desc = document.getElementById("themeDescription");
  const pieceHint = document.getElementById("pieceCountHint");

  if (desc) desc.textContent = info.descricao;
  if (pieceHint) pieceHint.textContent = info.pecas;

  aplicarTema(tema, "menu");
}

function ajustarAssetsVisuais() {
  const logo = document.getElementById("gameLogo");
  if (logo) {
    logo.addEventListener("error", () => {
      logo.src = "./assets/images/logo-mathdom.png.png";
    }, { once: true });
  }
}

function abrirInfoModal(tipo) {
  const data = INFO_CONTENT[tipo];
  const modal = document.getElementById("infoModal");
  if (!data || !modal) return;

  document.getElementById("infoModalTag").textContent = data.tag;
  document.getElementById("infoModalTitle").textContent = data.titulo;
  document.getElementById("infoModalContent").innerHTML = data.conteudo;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

window.fecharInfoModal = () => {
  const modal = document.getElementById("infoModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
};

window.abrirAjuda = () => abrirInfoModal("ajuda");
window.abrirSobre = () => abrirInfoModal("sobre");

window.toggleCadastro = (mostrarCadastro) => {
  document.getElementById("loginPanel")?.classList.toggle("hidden", mostrarCadastro);
  document.getElementById("registerPanel")?.classList.toggle("hidden", !mostrarCadastro);
  document.getElementById("authMessage").textContent = "";
};

window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const sucesso = await loginUser(email, senha);
  if (sucesso) {
    await aplicarConfiguracoesSalvas();
    atualizarBoasVindas();
    atualizarPreviewTema();
    mostrarTela("menuScreen");
  }
};

window.cadastrar = async () => {
  const nome = document.getElementById("cadastroNome").value.trim();
  const email = document.getElementById("cadastroEmail").value.trim();
  const senha = document.getElementById("cadastroSenha").value.trim();
  const sucesso = await registerUser(nome, email, senha);
  if (sucesso) {
    await aplicarConfiguracoesSalvas();
    atualizarBoasVindas();
    atualizarPreviewTema();
    mostrarTela("menuScreen");
  }
};

window.logout = async () => {
  await logoutUser();
  window.toggleCadastro(false);
  mostrarTela("loginScreen");
};

window.iniciar = () => {
  const nivel = document.getElementById("nivel").value;
  const tema = document.getElementById("tema").value;
  aplicarTema(tema, "jogo");
  mostrarTela("gameScreen");
  iniciarJogo(nivel, tema);
};

window.abrirHistorico = async () => {
  mostrarTela("historyScreen");
  await carregarHistorico();
};

window.voltarMenu = () => {
  atualizarBoasVindas();
  atualizarPreviewTema();
  mostrarTela("menuScreen");
};

function inicializarEventosMenu() {
  const temaSelect = document.getElementById("tema");
  const nivelSelect = document.getElementById("nivel");
  const infoModal = document.getElementById("infoModal");

  temaSelect?.addEventListener("change", atualizarPreviewTema);
  nivelSelect?.addEventListener("change", atualizarPreviewTema);

  infoModal?.addEventListener("click", (event) => {
    if (event.target === infoModal) window.fecharInfoModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") window.fecharInfoModal();
  });
}

observarAutenticacao(async (user) => {
  ajustarAssetsVisuais();
  inicializarEventosMenu();

  if (user) {
    await aplicarConfiguracoesSalvas();
    atualizarBoasVindas();
    atualizarPreviewTema();
    mostrarTela("menuScreen");
  } else {
    window.toggleCadastro(false);
    mostrarTela("loginScreen");
  }
});
