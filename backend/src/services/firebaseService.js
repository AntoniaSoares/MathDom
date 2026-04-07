import { getFirestore, collection, addDoc } from "firebase/firestore";

export async function salvarNoFirebase(dados) {
  const db = getFirestore();
  await addDoc(collection(db, "historico"), dados);
}