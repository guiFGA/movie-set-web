import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../api/db";


enum UserRole{
  ORGANIZER = "ORGANIZER",
  CUSTOMER = "CUSTOMER",
  GATE = "GATE",
}

interface UserAttributes {
   id: number;
   email: string;
   name: string;
   password_hash: string;
   role: UserRole;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id" | "role"> {}

class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  declare id: number;
  declare email: string;
  declare name: string;
  declare password_hash: string;
  declare role: UserRole;
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
    role: {
      type:DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.CUSTOMER,
    }
  },
  {
    sequelize,          // conexão
    modelName: "User",  // nome interno
    tableName: "users", // nome da tabela no banco
  }
);

export { User };
