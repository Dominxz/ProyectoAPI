// controladores/habitosCtrl.js
// Tabla registro_habitos: catálogo de tipos de hábitos (caminar, beber agua, etc.)

import { conmysql } from "../db.js";

// === PRUEBA DE CONEXIÓN ===
export const pruebaHabitos = (req, res) => {
  res.send("prueba con éxito - registro_habitos");
};

// === OBTENER TODOS LOS HÁBITOS ===
export const getHabitos = async (req, res) => {
  try {
    const [result] = await conmysql.query(
      "SELECT * FROM registro_habitos ORDER BY habito_id DESC"
    );

    res.json({
      cant: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Error en getHabitos:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === OBTENER HÁBITO POR ID ===
export const getHabitoxId = async (req, res) => {
  try {
    const [result] = await conmysql.query(
      "SELECT * FROM registro_habitos WHERE habito_id = ?",
      [req.params.id]
    );

    if (result.length <= 0)
      return res.json({ cant: 0, message: "Hábito no encontrado" });

    res.json({
      cant: result.length,
      data: result[0],
    });
  } catch (error) {
    console.error("Error en getHabitoxId:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === CREAR HÁBITO ===
export const postHabito = async (req, res) => {
  try {
    const { nombre_habito, descripcion } = req.body;

    if (!nombre_habito || nombre_habito.trim() === "") {
      return res
        .status(400)
        .json({ message: "El nombre del hábito es obligatorio" });
    }

    const [result] = await conmysql.query(
      "INSERT INTO registro_habitos (nombre_habito, descripcion) VALUES (?, ?)",
      [nombre_habito.trim(), descripcion || null]
    );

    res.json({
      habito_id: result.insertId,
      nombre_habito: nombre_habito.trim(),
      descripcion: descripcion || null,
    });
  } catch (error) {
    console.error("Error en postHabito:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === ACTUALIZAR HÁBITO ===
export const putHabito = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_habito, descripcion } = req.body;

    const [result] = await conmysql.query(
      "UPDATE registro_habitos SET nombre_habito = ?, descripcion = ? WHERE habito_id = ?",
      [nombre_habito, descripcion || null, id]
    );

    if (result.affectedRows <= 0)
      return res.status(404).json({ message: "Hábito no encontrado" });

    const [fila] = await conmysql.query(
      "SELECT * FROM registro_habitos WHERE habito_id = ?",
      [id]
    );

    res.json(fila[0]);
  } catch (error) {
    console.error("Error en putHabito:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// === ELIMINAR HÁBITO ===
export const deleteHabito = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await conmysql.query(
      "DELETE FROM registro_habitos WHERE habito_id = ?",
      [id]
    );

    if (result.affectedRows <= 0)
      return res.status(404).json({ message: "Hábito no encontrado" });

    res.json({ message: "Hábito eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteHabito:", error);

    // Si el hábito está referenciado en plan_habitos (FK)
    if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
      return res.status(400).json({
        message:
          "No se puede eliminar el hábito porque está asociado a uno o más planes de hábitos",
      });
    }

    return res.status(500).json({ message: "Error en el servidor" });
  }
};
