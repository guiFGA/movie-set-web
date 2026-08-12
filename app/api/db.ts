import { Sequelize } from "sequelize";

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: false,
});

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Banco conectado com sucesso.");

    // Use apenas na primeira execução para criar as tabelas.
    // Depois que as tabelas existirem, pode comentar esta linha.
    await sequelize.sync();

    console.log("Banco sincronizado.");
  } catch (error) {
    console.error("Erro ao conectar ao banco:", error);
    throw error;
  }
}

export { sequelize };



