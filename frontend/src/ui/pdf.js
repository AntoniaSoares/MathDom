import html2canvas from "https://cdn.jsdelivr.net/npm/html2canvas/+esm";
import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

function criarGraficoComoImagem(canvas, tituloTexto) {
  const card = document.createElement("div");
  card.style.background = "#ffffff";
  card.style.borderRadius = "14px";
  card.style.padding = "14px";
  card.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)";
  card.style.marginBottom = "20px";
  card.style.boxSizing = "border-box";

  const titulo = document.createElement("h3");
  titulo.textContent = tituloTexto;
  titulo.style.margin = "0 0 12px 0";
  titulo.style.textAlign = "center";
  titulo.style.fontSize = "18px";

  const img = document.createElement("img");
  img.src = canvas.toDataURL("image/png", 1.0);
  img.style.width = "100%";
  img.style.display = "block";
  img.style.background = "#fff";
  img.style.borderRadius = "10px";

  card.appendChild(titulo);
  card.appendChild(img);

  return card;
}

async function capturarElemento(elemento, largura = 1400) {
  const wrapper = document.createElement("div");
  wrapper.style.background = "#ffffff";
  wrapper.style.width = `${largura}px`;
  wrapper.style.padding = "24px";
  wrapper.style.position = "fixed";
  wrapper.style.left = "-99999px";
  wrapper.style.top = "0";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.fontFamily = "Arial, sans-serif";
  wrapper.style.color = "#000";

  wrapper.appendChild(elemento);
  document.body.appendChild(wrapper);

  const canvas = await html2canvas(wrapper, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  });

  document.body.removeChild(wrapper);
  return canvas;
}

function adicionarCanvasEmVariasPaginas(pdf, canvas, primeiraPagina = false) {
  const imgData = canvas.toDataURL("image/png");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margem = 10;
  const imgWidth = pageWidth - margem * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margem;

  if (!primeiraPagina) {
    pdf.addPage();
  }

  pdf.addImage(imgData, "PNG", margem, position, imgWidth, imgHeight);
  heightLeft -= (pageHeight - margem * 2);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margem;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margem, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - margem * 2);
  }
}

window.gerarPDF = async () => {
  const resumo = document.getElementById("historico");
  const cards = document.getElementById("historySummaryCards");
  const tabela = document.getElementById("historyTableWrapper");

  const grafico1 = document.getElementById("grafico1");
  const grafico2 = document.getElementById("grafico2");
  const grafico3 = document.getElementById("grafico3");

  if (!resumo || !cards || !tabela || !grafico1 || !grafico2 || !grafico3) {
    alert("Não foi possível gerar o PDF.");
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 1200));

  const layout = document.createElement("div");
  layout.style.background = "#ffffff";
  layout.style.padding = "20px";
  layout.style.boxSizing = "border-box";

  const titulo = document.createElement("h1");
  titulo.textContent = "Relatório MathDom";
  titulo.style.textAlign = "center";
  titulo.style.marginBottom = "20px";

  const resumoClone = resumo.cloneNode(true);
  const cardsClone = cards.cloneNode(true);

  resumoClone.style.textAlign = "center";
  resumoClone.style.marginBottom = "20px";

  cardsClone.style.display = "grid";
  cardsClone.style.gridTemplateColumns = "repeat(4, 1fr)";
  cardsClone.style.gap = "16px";
  cardsClone.style.marginBottom = "28px";

  const conteudoGrid = document.createElement("div");
  conteudoGrid.style.display = "grid";
  conteudoGrid.style.gridTemplateColumns = "1fr 1fr";
  conteudoGrid.style.gap = "24px";
  conteudoGrid.style.alignItems = "start";

  const tabelaCard = document.createElement("div");
  tabelaCard.style.background = "#ffffff";
  tabelaCard.style.borderRadius = "16px";
  tabelaCard.style.padding = "16px";
  tabelaCard.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)";
  tabelaCard.style.boxSizing = "border-box";

  const tituloTabela = document.createElement("h2");
  tituloTabela.textContent = "Tabela de partidas";
  tituloTabela.style.textAlign = "center";
  tituloTabela.style.marginBottom = "16px";

  const tabelaClone = tabela.cloneNode(true);
  tabelaCard.appendChild(tituloTabela);
  tabelaCard.appendChild(tabelaClone);

  const graficosColuna = document.createElement("div");
  graficosColuna.style.display = "flex";
  graficosColuna.style.flexDirection = "column";
  graficosColuna.style.gap = "20px";

  graficosColuna.appendChild(criarGraficoComoImagem(grafico1, "Acertos x Erros"));
  graficosColuna.appendChild(criarGraficoComoImagem(grafico2, "Evolução da Pontuação"));
  graficosColuna.appendChild(criarGraficoComoImagem(grafico3, "Tempo por Partida"));

  conteudoGrid.appendChild(tabelaCard);
  conteudoGrid.appendChild(graficosColuna);

  layout.appendChild(titulo);
  layout.appendChild(resumoClone);
  layout.appendChild(cardsClone);
  layout.appendChild(conteudoGrid);

  const canvasFinal = await capturarElemento(layout, 1500);

  const pdf = new jsPDF("p", "mm", "a4");
  adicionarCanvasEmVariasPaginas(pdf, canvasFinal, true);
  pdf.save("relatorio_mathdom.pdf");
};