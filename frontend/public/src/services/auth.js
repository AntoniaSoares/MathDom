import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

function showAuthMessage(message, success = false) {
  const el = document.getElementById("authMessage");
  if (!el) return;
  el.textContent = message;
  el.className = success
    ? "feedback-box auth-message feedback-success"
    : "feedback-box auth-message feedback-error";
}

export async function loginUser(email, senha) {
  try {
    if (!email || !senha) {
      showAuthMessage("Preencha email e senha.");
      return false;
    }

    await signInWithEmailAndPassword(auth, email, senha);
    showAuthMessage("Login realizado com sucesso.", true);
    return true;
  } catch (e) {
    console.error(e);
    showAuthMessage("Não foi possível entrar. Verifique email e senha.");
    return false;
  }
}

export async function registerUser(nome, email, senha) {
  try {
    if (!nome || !email || !senha) {
      showAuthMessage("Preencha nome, email e senha para cadastrar.");
      return false;
    }

    if (senha.length < 6) {
      showAuthMessage("A senha deve ter pelo menos 6 caracteres.");
      return false;
    }

    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(cred.user, { displayName: nome });

    await setDoc(doc(db, "usuarios", cred.user.uid), {
      id: cred.user.uid,
      nome,
      email,
      configuracoes: {
        fonte: "1",
        contraste: false,
        som: true,
        simplificado: false
      },
      criadoEm: serverTimestamp()
    }, { merge: true });

    showAuthMessage("Cadastro realizado com sucesso. Você já pode jogar.", true);
    return true;
  } catch (e) {
    console.error(e);
    showAuthMessage("Não foi possível cadastrar. O email pode já estar em uso.");
    return false;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

export function observarAutenticacao(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function carregarPerfilUsuario() {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "usuarios", user.uid));
  return snap.exists() ? snap.data() : null;
}

export function obterNomeJogador() {
  const user = auth.currentUser;
  if (!user) return "Jogador";
  return user.displayName || user.email || "Jogador";
}
