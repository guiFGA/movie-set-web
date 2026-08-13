import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../api/db";
import { Ticket } from "./Ticket";
import { User } from "./User";
import { Event } from "./Event";

enum ValidationStatus {
  VALID = "VALID",
  INVALID = "INVALID",
  ALREADY_USED = "ALREADY_USED",
  WRONG_EVENT = "WRONG_EVENT",
}

interface TicketValidationAttributes {
  id: number;
  ticket_id: number;
  gate_user_id: number;
  event_id: number;
  status: ValidationStatus;
  validated_at: Date;
}

interface TicketValidationCreationAttributes
  extends Optional<
    TicketValidationAttributes,
    "id" | "validated_at"
  > {}

class TicketValidation
  extends Model<
    TicketValidationAttributes,
    TicketValidationCreationAttributes
  >
  implements TicketValidationAttributes
{
  declare id: number;
  declare ticket_id: number;
  declare gate_user_id: number;
  declare event_id: number;
  declare status: ValidationStatus;
  declare validated_at: Date;
}

TicketValidation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Ticket,
        key: "id",
      },
    },

    gate_user_id: {
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
      type: DataTypes.ENUM(...Object.values(ValidationStatus)),
      allowNull: false,
    },

    validated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "TicketValidation",
    tableName: "ticket_validations",
    timestamps: true,
  }
);

export { TicketValidation, ValidationStatus };