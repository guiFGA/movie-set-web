import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../api/db";

interface UserAttributes {
   id: number;
   email: string;
   name: string;
   password_hash: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  declare id: number;
  declare email: string;
  declare name: string;
  declare password_hash: string;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,          // conexão
    modelName: "User",  // nome interno
    tableName: "users", // nome da tabela no banco
  }
);

export { User };
