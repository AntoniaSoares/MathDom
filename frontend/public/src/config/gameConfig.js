export function aplicarTema(tema, contexto = "jogo") {
  document.body.classList.remove("default-bg", "pokemon", "mario", "biblioteca");

  if (contexto === "inicio") {
    document.body.classList.add("default-bg");
    return;
  }

  if (tema) document.body.classList.add(tema);
}
