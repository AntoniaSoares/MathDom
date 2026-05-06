import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

export async function salvarHistorico(dados) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  await addDoc(collection(db, "historico"), {
    ...dados,
    userId: user.uid,
    data: dados.data || new Date().toISOString(),
    criadoEm: serverTimestamp()
  });
}

export async function buscarHistorico() {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const q = query(
    collection(db, "historico"),
    where("userId", "==", user.uid)
  );

  const snapshot = await getDocs(q);
  const dados = [];
  snapshot.forEach((item) => dados.push(item.data()));

  return dados.sort((a, b) => {
    const da = new Date(a.data || 0).getTime();
    const dbTime = new Date(b.data || 0).getTime();
    return da - dbTime;
  });
}

export async function salvarConfiguracoesUsuario(configuracoes) {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, "usuarios", user.uid), {
    id: user.uid,
    nome: user.displayName || user.email || "Jogador",
    email: user.email || "",
    configuracoes
  }, { merge: true });
}

export async function buscarConfiguracoesUsuario() {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "usuarios", user.uid));
  if (!snap.exists()) return null;
  return snap.data().configuracoes || null;
}
