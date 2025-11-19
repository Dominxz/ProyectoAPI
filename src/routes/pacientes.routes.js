import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";

import {
  pruebaPacientes,
  getPacientes,
  getPacientexId,
  deletePaciente
} from "../controladores/pacientesCtrl.js";

const router = Router();

router.get("/pacientes/prueba", pruebaPacientes);

// 👉 Ver pacientes: ADMIN (1) y MÉDICO (2)
router.get("/pacientes", verifyToken, verifyRole([1, 2]), getPacientes);

// 👉 Ver detalle paciente: ADMIN (1) y MÉDICO (2)
router.get("/pacientes/:id", verifyToken, verifyRole([1, 2]), getPacientexId);

// 👉 Eliminar paciente: SOLO ADMIN
router.delete("/pacientes/:id", verifyToken, verifyRole([1]), deletePaciente);

export default router;