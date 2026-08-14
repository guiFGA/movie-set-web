import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../api/db";
import { Reservation } from "./Reservation";
import { Seat } from "./Seat";

enum TicketStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  CANCELLED = "CANCELLED",
}

interface TicketAttributes {
  id: number;
  reservation_id: number;
  seat_id: number;
  code: string;
  qr_token_hash: string;
  status: TicketStatus;
  used_at: Date | null;
}

interface TicketCreationAttributes
  extends Optional<
    TicketAttributes,
    "id" | "status" | "used_at"
  > {}

class Ticket
  extends Model<TicketAttributes, TicketCreationAttributes>
  implements TicketAttributes
{
  declare id: number;
  declare reservation_id: number;
  declare seat_id: number;
  declare code: string;
  declare qr_token_hash: string;
  declare status: TicketStatus;
  declare used_at: Date | null;
}

Ticket.init(
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
      unique: true,
      references: {
        model: Seat,
        key: "id",
      },
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    qr_token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    status: {
      type: DataTypes.ENUM(...Object.values(TicketStatus)),
      allowNull: false,
      defaultValue: TicketStatus.ACTIVE,
    },

    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Ticket",
    tableName: "tickets",
    timestamps: true,
  }
);

export { Ticket, TicketStatus };