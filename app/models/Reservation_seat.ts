import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../api/db";
import { Reservation } from "./Reservation";
import { Seat } from "./Seat";

interface ReservationSeatAttributes {
  id: number;
  reservation_id: number;
  seat_id: number;
}

interface ReservationSeatCreationAttributes
  extends Optional<ReservationSeatAttributes, "id"> {}

class ReservationSeat
  extends Model<
    ReservationSeatAttributes,
    ReservationSeatCreationAttributes
  >
  implements ReservationSeatAttributes
{
  declare id: number;
  declare reservation_id: number;
  declare seat_id: number;
}

ReservationSeat.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    reservation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Reservation,
        key: "id",
      },
    },

    seat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Seat,
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "ReservationSeat",
    tableName: "reservation_seats",
    timestamps: true,

    indexes: [

      {
        unique: true,
        fields: ["seat_id"],
      },
    ],
  }
);

export { ReservationSeat };