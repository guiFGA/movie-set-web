import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../api/db";
import { Reservation } from "./Reservation";

enum PaymentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  DECLINED = "DECLINED",
}

interface PaymentAttributes {
  id: number;
  reservation_id: number;
  status: PaymentStatus;
  paid_at: Date | null;
}

interface PaymentCreationAttributes
  extends Optional<PaymentAttributes, "id" | "status" | "paid_at"> {}

class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  declare id: number;
  declare reservation_id: number;
  declare status: PaymentStatus;
  declare paid_at: Date | null;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    reservation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: Reservation,
        key: "id",
      },
    },

    status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING,
    },

    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Payment",
    tableName: "payments",
    timestamps: true,
  }
);

export { Payment, PaymentStatus };