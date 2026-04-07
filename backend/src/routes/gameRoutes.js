import express from "express";
import { salvarJogo } from "../controllers/gameController.js";

const router = express.Router();

router.post("/", salvarJogo);

export default router;