import { NextResponse } from "next/server";

import { Ticket } from "@/app/models/Ticket";
import { Reservation } from "@/app/models/Reservation";
import { Event } from "@/app/models/Event";
import { Seat } from "@/app/models/Seat";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Token inválido",
        },
        {
          status: 400,
        }
      );
    }

    const ticket = await Ticket.findOne({
      where: {
        qr_token: token,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          error: "Ingresso não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const reservation = await Reservation.findByPk(
      ticket.reservation_id
    );

    if (!reservation) {
      return NextResponse.json(
        {
          success: false,
          error: "Reserva não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    const event = await Event.findByPk(
      reservation.event_id
    );

    const seat = await Seat.findByPk(
      ticket.seat_id
    );

    if (!event || !seat) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados do ingresso incompletos",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      ticket: {
        id: ticket.id,
        code: ticket.code,
        status: ticket.status,
        used_at: ticket.used_at,

        event: {
          id: event.id,
          title: event.title,
          poster_url: event.poster_url,
          event_date: event.event_date,
          location: event.location,
          room: event.room,
        },

        seat: {
          row: seat.row,
          number: seat.number,
        },
      },
    });
  } catch (error) {
    console.error(
      "Erro ao buscar ingresso público:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao buscar ingresso",
      },
      {
        status: 500,
      }
    );
  }
}