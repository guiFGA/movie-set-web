import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../api/db";
import { Event } from "./Event"

interface SeatAttributes {
  id: number;
  event_id: number;
  row: string;
  number: number;
}

interface SeatCreationAttributes extends Optional<SeatAttributes, "id"> {}

class Seat extends Model<SeatAttributes, SeatCreationAttributes>
  implements SeatAttributes{
  declare id: number;
  declare event_id: number;
  declare row: string;
  declare number: number;
}

Seat.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Event,
        key: "id",
      },
    },

    row: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },

    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
  },
  {
    sequelize,
    modelName: "Seat",
    tableName: "seats",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["event_id", "row", "number"],
      },
    ],
  }
);

export { Seat };