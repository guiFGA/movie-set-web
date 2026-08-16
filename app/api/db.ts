import { Sequelize } from "sequelize";
import pg from "pg";

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  dialectModule: pg,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: false,
});

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Banco conectado com sucesso.");

   

    console.log("Banco sincronizado.");
  } catch (error) {
    console.error("Erro ao conectar ao banco:", error);
    throw error;
  }
}

export { sequelize };



