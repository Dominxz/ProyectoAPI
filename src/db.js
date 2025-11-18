import {createPool} from "mysql2/promise";
 import {
    BD_HOST,
    BD_DATABASE,
    BD_USER,
    BD_PASSWORD,
    BD_PORT
 } from './config.js'

 export const conmysql=createPool({
    host:BD_HOST,
    database:BD_DATABASE,
    user:BD_USER,
    password:BD_PASSWORD,
    port:BD_PORT
 });

 try {
  const connection = await conmysql.getConnection();
  console.log("✅ Conectado correctamente a MySQL en Clever Cloud");
  connection.release();
} catch (err) {
  console.error("Error al conectar a MySQL:", err.message);
}
