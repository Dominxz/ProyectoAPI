// controladores/planHabitosCtrl.js
// Tabla plan_habitos: relaciona paciente + hábito + frecuencia + validación médica

import { conmysql } from "../db.js";

// === PRUEBA DE CONEXIÓN ===
export const pruebaPlanHabitos = (req, res) => {
  res.send("prueba con éxito - plan_habitos");
};

// === OBTENER PLANES DE HÁBITOS (TODOS) ===
export const getPlanesHabitos = async (req, res) => {
  try {
    const [result] = await conmysql.query(
      `SELECT ph.*, u.nombre AS nombre_paciente, h.nombre_habito,
              m.medico_id, u2.nombre AS nombre_medico
       FROM plan_habitos ph
       INNER JOIN usuarios u ON u.usuario_id = ph.usuario_id
       INNER JOIN registro_habitos h ON h.habito_id = ph.habito_id
       LEFT JOIN medicos m ON m.medico_id = ph.medico_validador_id
       LEFT JOIN usuarios u2 ON u2.usuario_id = m.usuario_id`
    );

    res.json({
      cant: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Error en getPlanesHabitos:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === OBTENER PLANES DE UN PACIENTE POR USUARIO_ID ===
export const getPlanesPorUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const [result] = await conmysql.query(
      `SELECT ph.*, h.nombre_habito
       FROM plan_habitos ph
       INNER JOIN registro_habitos h ON h.habito_id = ph.habito_id
       WHERE ph.usuario_id = ?`,
      [usuario_id]
    );

    res.json({
      cant: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Error en getPlanesPorUsuario:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === OBTENER PLAN DE HÁBITO POR ID ===
export const getPlanHabitoxId = async (req, res) => {
  try {
    const [result] = await conmysql.query(
      `SELECT ph.*, h.nombre_habito
       FROM plan_habitos ph
       INNER JOIN registro_habitos h ON h.habito_id = ph.habito_id
       WHERE ph.plan_habito_id = ?`,
      [req.params.id]
    );

    if (result.length <= 0)
      return res.json({ cant: 0, message: "Plan de hábito no encontrado" });

    res.json({
      cant: result.length,
      data: result[0],
    });
  } catch (error) {
    console.error("Error en getPlanHabitoxId:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === CREAR PLAN DE HÁBITO ===
// En la práctica, el médico puede enviar SOLO:
// usuario_id, habito_id, frecuencia, meta
export const postPlanHabito = async (req, res) => {
  try {
    const {
      usuario_id,
      habito_id,
      frecuencia,
      meta,
      // Los siguientes son opcionales, se ponen por defecto
      estado,
      origen,
      estado_validacion,
      medico_validador_id,
      fecha_validacion,
      motivo_revision,
    } = req.body;

    if (!usuario_id || !habito_id) {
      return res
        .status(400)
        .json({ message: "usuario_id y habito_id son obligatorios" });
    }

    // Valores por defecto si NO vienen en el body
    const _estado = estado || "Activo";
    const _origen = origen || "medico"; // creado por el médico
    const _estado_validacion = estado_validacion || "aprobado";

    // Si viene fecha_validacion la usamos, si no y está aprobado => NOW()
    const usarFechaValidacion =
      fecha_validacion ||
      (_estado_validacion !== "pendiente" ? new Date() : null);

    const [result] = await conmysql.query(
      `INSERT INTO plan_habitos
       (usuario_id, habito_id, frecuencia, meta, estado, origen,
        estado_validacion, medico_validador_id, fecha_validacion, motivo_revision)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        usuario_id,
        habito_id,
        frecuencia || null,
        meta || null,
        _estado,
        _origen,
        _estado_validacion,
        medico_validador_id || null,
        usarFechaValidacion,
        motivo_revision || null,
      ]
    );

    res.json({ plan_habito_id: result.insertId });
  } catch (error) {
    console.error("Error en postPlanHabito:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === ACTUALIZAR PLAN DE HÁBITO ===
// Útil para cuando el médico ajusta el plan o cambia el estado
export const putPlanHabito = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      frecuencia,
      meta,
      estado,
      origen,
      estado_validacion,
      medico_validador_id,
      fecha_validacion,
      motivo_revision,
    } = req.body;

    const [result] = await conmysql.query(
      `UPDATE plan_habitos
       SET frecuencia = ?, meta = ?, estado = ?, origen = ?,
           estado_validacion = ?, medico_validador_id = ?, fecha_validacion = ?, motivo_revision = ?
       WHERE plan_habito_id = ?`,
      [
        frecuencia || null,
        meta || null,
        estado || "Activo",
        origen || "medico",
        estado_validacion || "aprobado",
        medico_validador_id || null,
        fecha_validacion || null,
        motivo_revision || null,
        id,
      ]
    );

    if (result.affectedRows <= 0)
      return res.status(404).json({ message: "Plan de hábito no encontrado" });

    const [fila] = await conmysql.query(
      "SELECT * FROM plan_habitos WHERE plan_habito_id = ?",
      [id]
    );
    res.json(fila[0]);
  } catch (error) {
    console.error("Error en putPlanHabito:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === ELIMINAR PLAN DE HÁBITO ===
export const deletePlanHabito = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await conmysql.query(
      "DELETE FROM plan_habitos WHERE plan_habito_id = ?",
      [id]
    );

    if (result.affectedRows <= 0)
      return res.status(404).json({ message: "Plan de hábito no encontrado" });

    res.json({ message: "Plan de hábito eliminado correctamente" });
  } catch (error) {
    console.error("Error en deletePlanHabito:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};
