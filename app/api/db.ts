import { Sequelize } from "sequelize";


declare global {
    var sequelize: Sequelize | undefined;
}

if (!global.sequelize) {
  global.sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: "postgres",
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  });
  global.sequelize.sync({ alter:true })
    .then(()=>{
        console.log("Tabelas sincronizadas com sucesso")
    })
    .catch((err) => {
        console.error("Erro ao sincronizar tabelas: ", err);
    });
    
}

const sequelize = global.sequelize;

export { sequelize };



