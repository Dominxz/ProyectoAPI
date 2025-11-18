import { config } from "dotenv";
config();

export const BD_HOST = process.env.BD_HOST || "bxzgqkf0glzpxmszhsun-mysql.services.clever-cloud.com";
export const BD_DATABASE = process.env.BD_DATABASE || "bxzgqkf0glzpxmszhsun";
export const BD_USER = process.env.BD_USER || "udpkyrhassc8pirw";
export const BD_PASSWORD = process.env.BD_PASSWORD || "a4I4wZCvt45f3lmGyI43P";
export const BD_PORT = process.env.BD_PORT || 3306;

export const PORT = process.env.PORT || 3000;

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES = process.env.JWT_EXPIRES;

export const CLOUDINARY_URL = process.env.CLOUDINARY_URL;