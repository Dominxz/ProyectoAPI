// controladores/administradoresCtrl.js

import { conmysql } from "../db.js";

/* ===============================
   PRUEBA DE RUTA
================================ */
export const pruebaAdmins = (req, res) => {
  res.send("prueba con éxito - administradores");
};

/* ===============================
   OBTENER TODOS LOS ADMINISTRADORES
================================ */
export const getAdministradores = async (req, res) => {
  try {
    const [result] = await conmysql.query(`
      SELECT 
        a.*, 
        u.nombre, 
        u.correo, 
        l.usuario AS username
      FROM administradores a
      INNER JOIN usuarios u ON u.usuario_id = a.usuario_id
      INNER JOIN login l ON l.login_id = u.login_id
    `);

    res.json({
      cant: result.length,
      data: result
    });
  } catch (error) {
    console.error("Error en getAdministradores:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

/* ===============================
   OBTENER ADMIN POR ID
================================ */
export const getAdministradorxId = async (req, res) => {
  try {
    const [result] = await conmysql.query(`
      SELECT 
        a.*, 
        u.nombre, 
        u.correo,
        l.usuario AS username
      FROM administradores a
      INNER JOIN usuarios u ON u.usuario_id = a.usuario_id
      INNER JOIN login l ON l.login_id = u.login_id
      WHERE a.admin_id = ?
    `, [req.params.id]);

    if (result.length === 0)
      return res.status(404).json({ message: "Administrador no encontrado" });

    res.json({
      cant: 1,
      data: result[0]
    });
  } catch (error) {
    console.error("Error en getAdministradorxId:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

/* ===============================
   CREAR ADMINISTRADOR
================================ */
export const postAdministrador = async (req, res) => {
  try {
    const { usuario_id, nivel_acceso, departamento } = req.body;

    // Verificar si ya existe
    const [exist] = await conmysql.query(
      "SELECT * FROM administradores WHERE usuario_id = ?",
      [usuario_id]
    );

    if (exist.length > 0) {
      return res.status(400).json({
        message: "Este usuario ya es administrador"
      });
    }

    // Insertar nuevo admin
    const [result] = await conmysql.query(`
      INSERT INTO administradores (usuario_id, nivel_acceso, departamento)
      VALUES (?, ?, ?)
    `, [usuario_id, nivel_acceso, departamento]);

    return res.json({
      admin_id: result.insertId,
      message: "Administrador creado correctamente"
    });
  } catch (error) {
    console.error("Error en postAdministrador:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

/* ===============================
   EDITAR ADMINISTRADOR
================================ */
export const putAdministrador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nivel_acceso, departamento } = req.body;

    const [result] = await conmysql.query(`
      UPDATE administradores
      SET nivel_acceso = ?, departamento = ?
      WHERE admin_id = ?
    `, [nivel_acceso, departamento, id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Administrador no encontrado" });

    const [[updated]] = await conmysql.query(
      "SELECT * FROM administradores WHERE admin_id = ?",
      [id]
    );

    res.json({
      message: "Administrador actualizado",
      data: updated
    });

  } catch (error) {
    console.error("Error en putAdministrador:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

/* ===============================
   ELIMINAR ADMINISTRADOR
================================ */
export const deleteAdministrador = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await conmysql.query(
      "DELETE FROM administradores WHERE admin_id = ?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Administrador no encontrado" });

    res.json({ message: "Administrador eliminado correctamente" });

  } catch (error) {
    console.error("Error en deleteAdministrador:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};
