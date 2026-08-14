import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../api/db";
import { User } from "./User";

enum EventStatus {
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
}

interface EventAttributes {
  id: number;
  organizer_id: number;

  tmdb_id: number;

  title: string;
  description: string | null;
  poster_url: string | null;

  event_date: Date;

  location: string;
  room: string;
  capacity: number;

  price: string;

  status: EventStatus;
}

interface EventCreationAttributes
  extends Optional<
    EventAttributes,
    "id" | "description" | "poster_url" | "status"
    > {}

class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  declare id: number;
  declare organizer_id: number;

  declare tmdb_id: number;

  declare title: string;
  declare description: string | null;
  declare poster_url: string | null;

  declare event_date: Date;

  declare location: string;
  declare room: string;
  declare capacity: number;

  declare price: string;

  declare status: EventStatus;
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    organizer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },

    tmdb_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    poster_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    event_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    room: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },

    status: {
      type: DataTypes.ENUM(...Object.values(EventStatus)),
      allowNull: false,
      defaultValue: EventStatus.PUBLISHED,
    },
  },
  {
    sequelize,
    modelName: "Event",
    tableName: "events",
    timestamps: true,
  }
);

export { Event, EventStatus };