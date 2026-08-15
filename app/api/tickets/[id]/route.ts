import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { Ticket } from "@/app/models/Ticket";
import { Reservation } from "@/app/models/Reservation";
import { Event } from "@/app/models/Event";
import { Seat } from "@/app/models/Seat";

type UserRole = "CUSTOMER" | "ORGANIZER" | "GATE";

interface JwtPayload {
  id: number;
  role: UserRole;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (decoded.role !== "CUSTOMER") {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso não permitido",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    const ticketId = Number(id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do ingresso inválido",
        },
        {
          status: 400,
        }
      );
    }

    const ticket = await Ticket.findByPk(ticketId);

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

    const reservation = await Reservation.findOne({
      where: {
        id: ticket.reservation_id,
        customer_id: decoded.id,
      },
    });

    if (!reservation) {
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

        reservation_id: reservation.id,

        event: {
          id: event.id,
          title: event.title,
          poster_url: event.poster_url,
          event_date: event.event_date,
          location: event.location,
          room: event.room,
        },

        seat: {
          id: seat.id,
          row: seat.row,
          number: seat.number,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar ingresso:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao buscar ingresso",
        details:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },
      {
        status: 500,
      }
    );
  }
}