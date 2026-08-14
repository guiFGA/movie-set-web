import { NextResponse } from "next/server";
import { Op } from "sequelize";

import { Event, EventStatus } from "@/app/models/Event";
import { Seat } from "@/app/models/Seat";
import { ReservationSeat } from "@/app/models/Reservation_seat";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const eventId = Number(id);

    // Verifica se o ID recebido é válido
    if (!eventId || isNaN(eventId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do evento inválido",
        },
        {
          status: 400,
        }
      );
    }

    // Busca a sessão
    const event = await Event.findOne({
      where: {
        id: eventId,
        status: EventStatus.PUBLISHED,
        event_date: {
          [Op.gt]: new Date(),
        },
      },

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

    // Caso a sessão não exista
    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Sessão não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    // Busca todos os assentos dessa sessão
    const seats = await Seat.findAll({
      where: {
        event_id: eventId,
      },

      order: [
        ["row", "ASC"],
        ["number", "ASC"],
      ],
    });

    // Pegamos somente os IDs dos assentos
    const seatIds = seats.map((seat) => seat.id);

    // Busca quais desses assentos já possuem reserva
    const reservedSeats = await ReservationSeat.findAll({
      where: {
        seat_id: {
          [Op.in]: seatIds,
        },
      },

      attributes: ["seat_id"],
    });

    // Transforma os IDs reservados em um Set
    const reservedSeatIds = new Set(
      reservedSeats.map((reservationSeat) => reservationSeat.seat_id)
    );

    // Monta os assentos com a informação de disponibilidade
    const seatsWithAvailability = seats.map((seat) => ({
      id: seat.id,
      row: seat.row,
      number: seat.number,

      available: !reservedSeatIds.has(seat.id),
    }));

    return NextResponse.json(
      {
        success: true,

        event: {
          id: event.id,
          tmdb_id: event.tmdb_id,
          title: event.title,
          description: event.description,
          poster_url: event.poster_url,
          event_date: event.event_date,
          location: event.location,
          room: event.room,
          capacity: event.capacity,
          price: event.price,
        },

        seats: seatsWithAvailability,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao buscar sessão:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao buscar sessão",
      },
      {
        status: 500,
      }
    );
  }
}