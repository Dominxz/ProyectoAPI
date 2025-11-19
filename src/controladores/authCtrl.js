// src/controladores/authCtrl.js
import { conmysql } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import cloudinary from "../cloudinary.js";

/* ============================================================
   === REGISTRO PACIENTE
   ============================================================ */
export const register = async (req, res) => {
  try {
    const { usuario, password, nombre, correo, edad, peso, estatura } = req.body;

    if (!usuario || !password || !nombre || !correo) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Verificar duplicado usuario
    const [exist] = await conmysql.query(
      "SELECT * FROM login WHERE usuario = ?",
      [usuario]
    );

    if (exist.length > 0) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Encriptar contraseña
    const hash = await bcrypt.hash(password, 10);

    // Insertar login
    const [loginResult] = await conmysql.query(
      "INSERT INTO login (usuario, password) VALUES (?, ?)",
      [usuario, hash]
    );

    // Insertar usuario con rol 3 = paciente
    const [userResult] = await conmysql.query(
      `INSERT INTO usuarios (login_id, rol_id, nombre, correo)
       VALUES (?, 3, ?, ?)`,
      [loginResult.insertId, nombre, correo]
    );

    const usuario_id = userResult.insertId;

    // Insertar datos médicos del paciente
    await conmysql.query(
      `INSERT INTO pacientes (usuario_id, edad, peso, estatura) 
       VALUES (?, ?, ?, ?)`,
      [
        usuario_id,
        edad || null,
        peso || null,
        estatura || null,
      ]
    );

    return res.status(201).json({
      message: "Paciente registrado correctamente",
      usuario_id,
    });

  } catch (error) {
    console.error("Error en register:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};


/* ============================================================
   === LOGIN
   ============================================================ */
export const login = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    // Buscar en tabla login
    const [result] = await conmysql.query(
      "SELECT * FROM login WHERE usuario = ?",
      [usuario]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const loginData = result[0];

    // Comparar contraseña
    const match = await bcrypt.compare(password, loginData.password);
    if (!match) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Obtener datos de usuarios
    const [userData] = await conmysql.query(
      "SELECT * FROM usuarios WHERE login_id = ?",
      [loginData.login_id]
    );

    if (userData.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró información del usuario" });
    }

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

    return res.json({
      message: "Login exitoso",
      token,
      usuario: user,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

/* ============================================================
   === REGISTRO MÉDICO + SOLICITUD
   ============================================================ */
export const registerMedico = async (req, res) => {
  const connection = await conmysql.getConnection(); // para usar transacciones

  try {
    const {
      usuario,
      password,
      nombre,
      correo,
      numero_licencia,
      especialidad,
      institucion,
      anios_experiencia,
    } = req.body;

    // Validar campos obligatorios
    if (
      !usuario ||
      !password ||
      !nombre ||
      !correo ||
      !numero_licencia ||
      !especialidad ||
      !institucion
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Usuario duplicado
    const [existeLogin] = await conmysql.query(
      "SELECT login_id FROM login WHERE usuario = ?",
      [usuario]
    );
    if (existeLogin.length > 0) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Correo duplicado
    const [existeCorreo] = await conmysql.query(
      "SELECT usuario_id FROM usuarios WHERE correo = ?",
      [correo]
    );
    if (existeCorreo.length > 0) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    await connection.beginTransaction();

    // 1) Crear login
    const hash = await bcrypt.hash(password, 10);
    const [loginResult] = await connection.query(
      "INSERT INTO login (usuario, password) VALUES (?, ?)",
      [usuario, hash]
    );
    const login_id = loginResult.insertId;

    // 2) Crear usuario con rol MÉDICO (2)
    //  ⚠️ IMPORTANTE: YA NO USAMOS estado_certificacion NI fecha_solicitud_certificacion
    const [usuarioResult] = await connection.query(
      `INSERT INTO usuarios 
       (login_id, rol_id, nombre, correo)
       VALUES (?, 2, ?, ?)`,
      [login_id, nombre, correo]
    );
    const usuario_id = usuarioResult.insertId;

    // 3) Subir PDF a Cloudinary (si viene)
    let documento_adjunto = null;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "solicitudes_certificacion",
            resource_type: "raw", // PDF
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

    // 4) Insertar en tabla medicos
    //  ⚠️ IMPORTANTE: columna = anios_experiencia (SIN Ñ)
    await connection.query(
      `INSERT INTO medicos 
       (usuario_id, numero_licencia, especialidad, institucion, anios_experiencia, documento_certificacion)
       VALUES (?,?,?,?,?,?)`,
      [
        usuario_id,
        numero_licencia,
        especialidad,
        institucion,
        anios_experiencia || null,
        documento_adjunto,
      ]
    );

    // 5) Crear solicitud en solicitudes_certificacion
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
      message: "Médico registrado correctamente.",
      usuario_id,
    });
  } catch (error) {
    console.error("Error en registerMedico:", error);
    await connection.rollback();
    return res.status(500).json({
      message: "Error en el servidor",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};