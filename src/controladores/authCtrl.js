// src/controladores/authCtrl.js
import { conmysql } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import cloudinary from "../cloudinary.js"; // 👈 AÑADIDO

// ================================
// === REGISTRO PACIENTE (normal)
// ================================
export const register = async (req, res) => {
  try {
    const { usuario, clave, nombre, correo } = req.body;

    // 1. Verificar que no exista el usuario
    const [exist] = await conmysql.query(
      "SELECT * FROM login WHERE usuario = ?",
      [usuario]
    );

    if (exist.length > 0) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // 2. Encriptar contraseña
    const hash = await bcrypt.hash(clave, 10);

    // 3. Insertar login
    const [loginResult] = await conmysql.query(
      "INSERT INTO login (usuario, contraseña) VALUES (?, ?)",
      [usuario, hash]
    );

    // 4. Crear usuario con rol por defecto (3 = paciente)
    const [userResult] = await conmysql.query(
      `INSERT INTO usuarios (login_id, rol_id, nombre, correo)
       VALUES (?, 3, ?, ?)`,
      [loginResult.insertId, nombre, correo]
    );

    // 5. Crear token
    const token = jwt.sign(
      {
        usuario_id: userResult.insertId,
        nombre: nombre,
        rol_id: 3,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Registro exitoso",
      token,
      usuario: {
        usuario_id: userResult.insertId,
        nombre,
        correo,
        rol_id: 3,
      },
    });

  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// ================================
// === LOGIN
// ================================
export const login = async (req, res) => {
  try {
    const { usuario, clave } = req.body;

    const [result] = await conmysql.query(
      "SELECT * FROM login WHERE usuario = ?",
      [usuario]
    );

    if (result.length === 0)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const loginData = result[0];

    // Comparar contraseña
    const match = await bcrypt.compare(clave, loginData.contraseña);
    if (!match)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    // Obtener datos del usuario
    const [userData] = await conmysql.query(
      "SELECT * FROM usuarios WHERE login_id = ?",
      [loginData.login_id]
    );

    const user = userData[0];

    // Crear token
    const token = jwt.sign(
      {
        usuario_id: user.usuario_id,
        nombre: user.nombre,
        rol_id: user.rol_id,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login exitoso",
      token,
      usuario: user,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// ==========================================
// === REGISTRO DE MÉDICO (+ solicitud)
// ==========================================
export const registerMedico = async (req, res) => {
  const connection = await conmysql.getConnection(); // para poder hacer rollback

  try {
    const {
      usuario,
      clave,
      nombre,
      correo,
      numero_licencia,
      especialidad,
      institucion,
      años_experiencia,
    } = req.body;

    if (
      !usuario ||
      !clave ||
      !nombre ||
      !correo ||
      !numero_licencia ||
      !especialidad ||
      !institucion
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // ¿usuario ya existe?
    const [existeLogin] = await conmysql.query(
      "SELECT login_id FROM login WHERE usuario = ?",
      [usuario]
    );
    if (existeLogin.length > 0) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // ¿correo ya existe?
    const [existeCorreo] = await conmysql.query(
      "SELECT usuario_id FROM usuarios WHERE correo = ?",
      [correo]
    );
    if (existeCorreo.length > 0) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    await connection.beginTransaction();

    // 1) login
    const hash = await bcrypt.hash(clave, 10);
    const [loginResult] = await connection.query(
      "INSERT INTO login (usuario, contraseña) VALUES (?, ?)",
      [usuario, hash]
    );
    const login_id = loginResult.insertId;

    // 2) usuario con rol MEDICO (rol_id = 2)
    const [usuarioResult] = await connection.query(
      `INSERT INTO usuarios 
       (login_id, rol_id, nombre, correo, estado_certificacion, fecha_solicitud_certificacion)
       VALUES (?, 2, ?, ?, 'pendiente', NOW())`,
      [login_id, nombre, correo]
    );
    const usuario_id = usuarioResult.insertId;

    // 3) subir PDF a Cloudinary (si viene)
    let documento_adjunto = null;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "solicitudes_certificacion",
            resource_type: "raw", // para PDF
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      documento_adjunto = uploadResult.secure_url;
    }

    // 4) insertar en tabla MEDICOS
    await connection.query(
      `INSERT INTO medicos 
       (usuario_id, numero_licencia, especialidad, institucion, años_experiencia, documento_certificacion)
       VALUES (?,?,?,?,?,?)`,
      [
        usuario_id,
        numero_licencia,
        especialidad,
        institucion,
        años_experiencia || null,
        documento_adjunto,
      ]
    );

    // 5) crear solicitud de certificación (para panel admin)
    await connection.query(
      `INSERT INTO solicitudes_certificacion
       (usuario_id, numero_licencia, especialidad, institucion, documento_adjunto, estado)
       VALUES (?,?,?,?,?, 'pendiente')`,
      [
        usuario_id,
        numero_licencia,
        especialidad,
        institucion,
        documento_adjunto,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Médico registrado y solicitud creada.",
      usuario_id,
    });
  } catch (error) {
    console.error("Error en registerMedico:", error);
    await connection.rollback();
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  } finally {
    connection.release();
  }
};