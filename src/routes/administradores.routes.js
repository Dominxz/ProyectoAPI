// routes/administradores.routes.js
import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";

import {
  pruebaAdmins,
  getAdministradores,
  getAdministradorxId,
  postAdministrador,
  putAdministrador,
  deleteAdministrador,
  principal
} from "../controladores/administradoresCtrl.js";

const router = Router();

router.get("/prueba", pruebaAdmins);

// SOLO ADMIN (rol 1) puede entrar aquí ⬇⬇⬇
router.get(
  "/administradores",
  verifyToken,
  verifyRole([1]),
  getAdministradores
);

router.get(
  "/administradores/:id",
  verifyToken,
  verifyRole([1]),
  getAdministradorxId
);

router.post(
  "/administradores",
  verifyToken,
  verifyRole([1]),
  postAdministrador
);

router.put(
  "/administradores/:id",
  verifyToken,
  verifyRole([1]),
  putAdministrador
);

router.delete(
  "/administradores/:id",
  verifyToken,
  verifyRole([1]),
  deleteAdministrador
);

router.get(
  "/administradores/principal",
  verifyToken,
  verifyRole([1]),
  principal
);

export default router;
