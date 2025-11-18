import { config } from "dotenv";
config();

export const BD_HOST = process.env.BD_HOST || "b4y3ati1zf5apibds6o7-mysql.services.clever-cloud.com";
export const BD_DATABASE = process.env.BD_DATABASE || "b4y3ati1zf5apibds6o7";
export const BD_USER = process.env.BD_USER || "ufombeob0aafmtgm";
export const BD_PASSWORD = process.env.BD_PASSWORD || "EkFAKtaKCdNlAkQrQPFP";
export const BD_PORT = process.env.BD_PORT || 3306;

export const PORT = process.env.PORT || 3000;

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES = process.env.JWT_EXPIRES;

export const CLOUDINARY_URL = process.env.CLOUDINARY_URL;