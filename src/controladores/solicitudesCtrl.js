// controladores/solicitudesCtrl.js  (o solicitudesCertCtrl.js, pero que coincida con el import)
import { conmysql } from "../db.js";
import cloudinary from "../cloudinary.js";

// === PRUEBA DE CONEXIÓN ===
export const pruebaSolicitudes = (req, res) => {
  res.send("prueba con éxito - solicitudes_certificacion");
};

// === OBTENER TODAS LAS SOLICITUDES ===
export const getSolicitudes = async (req, res) => {
  try {
    const [result] = await conmysql.query(
      `SELECT s.*, u.nombre, u.correo, a.nivel_acceso
       FROM solicitudes_certificacion s
       INNER JOIN usuarios u ON u.usuario_id = s.usuario_id
       LEFT JOIN administradores a ON a.admin_id = s.revisado_por`
    );

    res.json({
      cant: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Error en getSolicitudes:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === OBTENER SOLICITUD POR ID ===
export const getSolicitudxId = async (req, res) => {
  try {
    const [result] = await conmysql.query(
      `SELECT s.*, u.nombre, u.correo, a.nivel_acceso
       FROM solicitudes_certificacion s
       INNER JOIN usuarios u ON u.usuario_id = s.usuario_id
       LEFT JOIN administradores a ON a.admin_id = s.revisado_por
       WHERE s.solicitud_id = ?`,
      [req.params.id]
    );

    if (result.length <= 0)
      return res.json({
        cant: 0,
        message: "Solicitud no encontrada",
      });

    res.json({
      cant: result.length,
      data: result[0],
    });
  } catch (error) {
    console.error("Error en getSolicitudxId:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === CREAR NUEVA SOLICITUD (subiendo PDF a Cloudinary) ===
export const postSolicitud = async (req, res) => {
  try {
    const { usuario_id, numero_licencia, especialidad, institucion } = req.body;

    let documento_adjunto = null;

    // Si viene archivo PDF, lo subimos a Cloudinary
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "solicitudes_certificacion",
            resource_type: "raw", // 👈 para PDFs
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      documento_adjunto = uploadResult.secure_url;
    } else if (req.body.documento_adjunto) {
      // Por si algún día mandas una URL directa desde el front
      documento_adjunto = req.body.documento_adjunto;
    }

    const [result] = await conmysql.query(
      `INSERT INTO solicitudes_certificacion
       (usuario_id, numero_licencia, especialidad, institucion, documento_adjunto)
       VALUES (?,?,?,?,?)`,
      [usuario_id, numero_licencia, especialidad, institucion, documento_adjunto]
    );

    res.json({
      solicitud_id: result.insertId,
      documento_adjunto,
    });
  } catch (error) {
    console.error("Error en postSolicitud:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// === ACTUALIZAR SOLICITUD (estado, PDF, revisión) ===
export const putSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estado,
      fecha_revision,
      revisado_por,
      comentarios_revision,
      numero_licencia,
      especialidad,
      institucion,
    } = req.body;

    // Traemos la solicitud actual para conservar el documento si no envían uno nuevo
    const [currentRows] = await conmysql.query(
      "SELECT documento_adjunto FROM solicitudes_certificacion WHERE solicitud_id=?",
      [id]
    );

    if (currentRows.length === 0)
      return res.status(404).json({ message: "Solicitud no encontrada" });

    let documento_adjunto = currentRows[0].documento_adjunto;

    // Si viene nuevo PDF, lo subimos a Cloudinary y reemplazamos URL
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "solicitudes_certificacion",
            resource_type: "raw",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      documento_adjunto = uploadResult.secure_url;
    } else if (req.body.documento_adjunto) {
      // Si te mandan una URL manualmente
      documento_adjunto = req.body.documento_adjunto;
    }

    const [result] = await conmysql.query(
      `UPDATE solicitudes_certificacion
       SET estado=?, fecha_revision=?, revisado_por=?, comentarios_revision=?,
           numero_licencia=?, especialidad=?, institucion=?, documento_adjunto=?
       WHERE solicitud_id=?`,
      [
        estado,
        fecha_revision,
        revisado_por,
        comentarios_revision,
        numero_licencia,
        especialidad,
        institucion,
        documento_adjunto,
        id,
      ]
    );

    if (result.affectedRows <= 0)
      return res.status(404).json({ message: "Solicitud no encontrada" });

    const [fila] = await conmysql.query(
      "SELECT * FROM solicitudes_certificacion WHERE solicitud_id=?",
      [id]
    );

    res.json(fila[0]);
  } catch (error) {
    console.error("Error en putSolicitud:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === ELIMINAR SOLICITUD ===
export const deleteSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await conmysql.query(
      "DELETE FROM solicitudes_certificacion WHERE solicitud_id=?",
      [id]
    );

    if (result.affectedRows <= 0)
      return res.status(404).json({ message: "Solicitud no encontrada" });

    res.json({ message: "Solicitud eliminada correctamente" });
  } catch (error) {
    console.error("Error en deleteSolicitud:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};
