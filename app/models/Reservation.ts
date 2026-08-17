import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../api/db";
import { User } from "./User";
import { Event } from "./Event";
import { Seat } from "./Seat";

enum ReservationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
}

interface ReservationAttributes {
  id: number;
  customer_id: number;
  event_id: number;
  status: ReservationStatus;
  total_price: string;
  expires_at: Date;
}

interface ReservationCreationAttributes
  extends Optional<ReservationAttributes, "id" | "status"> {}

class Reservation
  extends Model<ReservationAttributes, ReservationCreationAttributes>
  implements ReservationAttributes
{
  declare id: number;
  declare customer_id: number;
  declare event_id: number;
  declare status: ReservationStatus;
  declare total_price: string;
  declare expires_at: Date;
}

Reservation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },

    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Event,
        key: "id",
      },
    },

    status: {
      type: DataTypes.ENUM(...Object.values(ReservationStatus)),
      allowNull: false,
      defaultValue: ReservationStatus.PENDING,
    },

    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    expires_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: "Reservation",
    tableName: "reservations",
    timestamps: true,
  }
);

export { Reservation, ReservationStatus };