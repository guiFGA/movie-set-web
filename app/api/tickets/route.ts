import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

import { Reservation } from "@/app/models/Reservation";
import { ReservationSeat } from "@/app/models/Reservation_seat";
import { Ticket } from "@/app/models/Ticket";
import { Event } from "@/app/models/Event";
import { Seat } from "@/app/models/Seat";

type UserRole = "CUSTOMER" | "ORGANIZER" | "GATE";

interface JwtPayload {
  id: number;
  role: UserRole;
}

export async function GET(request: NextRequest) {
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
          error: "Apenas clientes podem acessar ingressos",
        },
        {
          status: 403,
        }
      );
    }

    const reservations = await Reservation.findAll({
      where: {
        customer_id: decoded.id,
      },

      attributes: [
        "id",
        "event_id",
        "status",
        "total_price",
      ],
    });

    if (reservations.length === 0) {
      return NextResponse.json({
        success: true,
        tickets: [],
      });
    }

    const reservationIds = reservations.map(
      (reservation) => reservation.id
    );

    const tickets = await Ticket.findAll({
      where: {
        reservation_id: {
          [Op.in]: reservationIds,
        },
      },

      order: [["id", "DESC"]],
    });

    const result = [];

    for (const ticket of tickets) {
      const reservation = reservations.find(
        (item) =>
          item.id === ticket.reservation_id
      );

      if (!reservation) {
        continue;
      }

      const event = await Event.findByPk(
        reservation.event_id
      );

      const seat = await Seat.findByPk(
        ticket.seat_id
      );

      if (!event || !seat) {
        continue;
      }

      result.push({
        id: ticket.id,
        code: ticket.code,
        status: ticket.status,
        used_at: ticket.used_at,

        reservation_id: reservation.id,

        seat: {
          id: seat.id,
          row: seat.row,
          number: seat.number,
        },

        event: {
          id: event.id,
          title: event.title,
          poster_url: event.poster_url,
          event_date: event.event_date,
          location: event.location,
          room: event.room,
        },
      });
    }

    return NextResponse.json({
      success: true,
      tickets: result,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar ingressos:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao buscar ingressos",
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