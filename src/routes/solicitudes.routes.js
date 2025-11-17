import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { uploadPDF } from "../middlewares/upload.js"; 
import { verifyRole } from "../middlewares/verifyRole.js";   // ⬅ FALTABA ESTO

import {
  pruebaSolicitudes,
  getSolicitudes,
  getSolicitudxId,
  postSolicitud,
  putSolicitud,
  deleteSolicitud
} from "../controladores/solicitudesCtrl.js";

const router = Router();

router.get("/prueba", pruebaSolicitudes);

router.get("/solicitudes", verifyToken, getSolicitudes);
router.get("/solicitudes/:id", verifyToken, getSolicitudxId);

router.post(
  "/solicitudes",
  verifyToken,
  uploadPDF.single("documento_adjunto"),
  postSolicitud
);

router.put(
  "/solicitudes/:id",
  verifyToken,
  verifyRole([1]),
  uploadPDF.single("documento_adjunto"),
  putSolicitud
);


router.delete("/solicitudes/:id", verifyToken, deleteSolicitud);

export default router;
