import { conmysql } from "../db.js";

// ================================
// PRUEBA
// ================================
export const pruebaPacientes = (req, res) => {
  res.send("Prueba con éxito - pacientes");
};

// ================================
// OBTENER TODOS LOS PACIENTES (solo admin)
// ================================
export const getPacientes = async (req, res) => {
  try {
    const [rows] = await conmysql.query(`
      SELECT 
        u.usuario_id,
        u.nombre,
        u.correo,
        p.paciente_id,
        p.peso,
        p.estatura,
        p.edad
      FROM usuarios u
      INNER JOIN pacientes p ON p.usuario_id = u.usuario_id
      WHERE u.rol_id = 3
    `);

    res.json({
      cant: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("Error en getPacientes:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// ================================
// OBTENER PACIENTE POR ID (solo admin)
// ================================
export const getPacientexId = async (req, res) => {
  try {
    const [rows] = await conmysql.query(`
      SELECT 
        u.usuario_id,
        u.nombre,
        u.correo,
        p.paciente_id,
        p.peso,
        p.estatura,
        p.edad
      FROM usuarios u
      INNER JOIN pacientes p ON p.usuario_id = u.usuario_id
      WHERE u.usuario_id = ? AND u.rol_id = 3
    `, [req.params.id]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Paciente no encontrado" });

    res.json(rows[0]);

  } catch (error) {
    console.error("Error en getPacientexId:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// ================================
// ELIMINAR PACIENTE (pacientes + usuarios + login asociado)
// ================================
export const deletePaciente = async (req, res) => {
  try {
    const usuarioId = req.params.id;

    // 1️⃣ Obtener login_id del usuario
    const [[usuario]] = await conmysql.query(
      "SELECT login_id FROM usuarios WHERE usuario_id = ? AND rol_id = 3",
      [usuarioId]
    );

    if (!usuario)
      return res.status(404).json({ message: "Paciente no encontrado" });

    const loginId = usuario.login_id;

    // 2️⃣ Eliminar registro en tabla pacientes
    await conmysql.query(
      "DELETE FROM pacientes WHERE usuario_id = ?",
      [usuarioId]
    );

    // 3️⃣ Eliminar usuario
    await conmysql.query(
      "DELETE FROM usuarios WHERE usuario_id = ?",
      [usuarioId]
    );

    // 4️⃣ Eliminar login
    if (loginId) {
      await conmysql.query(
        "DELETE FROM login WHERE login_id = ?",
        [loginId]
      );
    }

    res.json({ message: "Paciente eliminado correctamente (pacientes + usuarios + login)" });

  } catch (error) {
    console.error("Error en deletePaciente:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
