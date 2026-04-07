import { salvarNoFirebase } from "../services/firebaseService.js";

export async function salvarJogo(req, res) {
  await salvarNoFirebase(req.body);
  res.send("Salvo!");
}