import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

import { Event, EventStatus } from "../../models/Event";
import { Seat } from "../../models/Seat";

interface JwtPayload {
  id: number;
  role: "CUSTOMER" | "ORGANIZER" | "GATE";
}

interface CreateEventBody {
  tmdb_id: number;
  title: string;
  description: string | null;
  poster_url: string | null;

  date: string;
  time: string;

  price: string;

  location: string;
  room: string;
  capacity: number;
}

//FUNÇAO PARA CRIAÇÂO DOS ASSENTOS
function getRowLabel(index: number): string {
  let label = "";
  let value = index;

  while (value >= 0) {
    label =
      String.fromCharCode((value % 26) + 65) +
      label;

    value = Math.floor(value / 26) - 1;
  }

  return label;
}

//CRIAÇÃO DE EVENTOS

export async function POST(request: NextRequest) {
  try {
   
    // VERIFICA O TOKEN


    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET não configurado");
    }

    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as JwtPayload;


    // VERIFICA FUNÇÃO DO USUÁRIO
   

    if (decoded.role !== "ORGANIZER") {
      return NextResponse.json(
        {
          success: false,
          error: "Apenas organizadores podem criar sessões",
        },
        {
          status: 403,
        }
      );
    }

    // RECEBE DADOS

    const {
      tmdb_id,
      title,
      description,
      poster_url,
      date,
      time,
      price,
      location,
      room,
      capacity,
    }: CreateEventBody = await request.json();

    // VALIDAÇÃO

    if (
      !tmdb_id ||
      !title ||
      !date ||
      !time ||
      !price ||
      !location ||
      !room ||
      !capacity
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Preencha todos os dados da sessão",
        },
        {
          status: 400,
        }
      );
    }

    if (capacity <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A capacidade deve ser maior que zero",
        },
        {
          status: 400,
        }
      );
    }

    // DATA + HORÁRIO PARA EVENT_DATE

    const eventDate = new Date(`${date}T${time}`);

    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Data ou horário inválido",
        },
        {
          status: 400,
        }
      );
    }

    // CRIA O EVENTO

    const event = await Event.create({
      organizer_id: decoded.id,

      tmdb_id,
      title,

      description: description || null,
      poster_url: poster_url || null,

      event_date: eventDate,

      location,
      room,
      capacity,

      price,
    });

    // CRIA ASSENTOs

    const seats = [];

    const seatsPerRow = 10;

    for (let i = 0; i < capacity; i++) {
      const rowIndex = Math.floor(
        i/seatsPerRow
      );
      
      const row = getRowLabel(rowIndex);
      const number =
        (i % seatsPerRow) + 1;

      seats.push({
        event_id: event.id,
        row,
        number,
      });
    }

    await Seat.bulkCreate(seats);

    return NextResponse.json(
      {
        success: true,
        message: "Sessão criada com sucesso",
        event,
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      "Erro ao criar sessão:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao criar sessão",
      },
      {
        status: 500,
      }
    );
  }
}

//RETORNAR EVENTOS DISPONÍVEIS
export async function GET() {
  try {
    const events = await Event.findAll({
      where: {
        status: EventStatus.PUBLISHED,

        event_date: {
          [Op.gt]: new Date(),
        },
      },

      order: [
        ["event_date", "ASC"],
      ],

      attributes: [
        "id",
        "tmdb_id",
        "title",
        "description",
        "poster_url",
        "event_date",
        "location",
        "room",
        "capacity",
        "price",
      ],
    });

    return NextResponse.json(
      {
        success: true,
        events,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar eventos disponíveis",
      },
      {
        status: 500,
      }
    );
  }
}