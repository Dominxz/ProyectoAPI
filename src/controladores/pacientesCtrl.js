// src/controladores/pacientesCtrl.js
import { conmysql } from "../db.js";

// ================================
// PRUEBA
// ================================
export const pruebaPacientes = (req, res) => {
  res.send("Prueba con éxito - pacientes");
};

// ================================
// OBTENER TODOS LOS PACIENTES (admin)
// ================================
export const getPacientes = async (req, res) => {
  try {
    const [result] = await conmysql.query(
      `SELECT p.*, u.nombre, u.correo, u.peso, u.estatura, u.edad
       FROM pacientes p
       INNER JOIN usuarios u ON u.usuario_id = p.usuario_id`
    );

    res.json({
      cant: result.length,
      data: result,
    });

  } catch (error) {
    console.error("Error en getPacientes:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// ================================
// OBTENER PACIENTE POR ID
// ================================
export const getPacientexId = async (req, res) => {
  try {
    const [result] = await conmysql.query(
      `SELECT p.*, u.nombre, u.correo, u.peso, u.estatura, u.edad
       FROM pacientes p
       INNER JOIN usuarios u ON u.usuario_id = p.usuario_id
       WHERE p.paciente_id = ?`,
      [req.params.id]
    );

    if (result.length === 0)
      return res.status(404).json({ message: "Paciente no encontrado" });

    res.json({
      cant: 1,
      data: result[0],
    });

  } catch (error) {
    console.error("Error en getPacientexId:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// ================================
// ELIMINAR PACIENTE COMPLETO
// (pacientes + usuarios + login)
// ================================
export const deletePaciente = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Buscar usuario_id
    const [[pacienteData]] = await conmysql.query(
      "SELECT usuario_id FROM pacientes WHERE paciente_id = ?",
      [id]
    );

    if (!pacienteData) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    const usuario_id = pacienteData.usuario_id;

    // 2️⃣ Buscar login_id del usuario
    const [[usuarioData]] = await conmysql.query(
      "SELECT login_id FROM usuarios WHERE usuario_id = ?",
      [usuario_id]
    );

    const login_id = usuarioData?.login_id;

    // 3️⃣ Eliminar PACIENTE
    await conmysql.query(
      "DELETE FROM pacientes WHERE paciente_id = ?",
      [id]
    );

    // 4️⃣ Eliminar USUARIO
    await conmysql.query(
      "DELETE FROM usuarios WHERE usuario_id = ?",
      [usuario_id]
    );

    // 5️⃣ Eliminar LOGIN
    if (login_id) {
      await conmysql.query(
        "DELETE FROM login WHERE login_id = ?",
        [login_id]
      );
    }

    return res.json({
      message: "Paciente eliminado correctamente (paciente + usuario + login)",
    });

  } catch (error) {
    console.error("Error en deletePaciente:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};
