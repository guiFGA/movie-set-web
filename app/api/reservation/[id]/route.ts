import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { Reservation } from "@/app/models/Reservation";
import { Event } from "@/app/models/Event";
import { Seat } from "@/app/models/Seat";
import { ReservationSeat } from "@/app/models/Reservation_seat";

type UserRole = "CUSTOMER" | "ORGANIZER" | "GATE";

interface JwtPayload {
  id: number;
  role: UserRole;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não autenticado",
        },
        { status: 401,}
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
        { status: 403, }
      );
    }

    const { id } = await params;

    const reservationId = Number(id);

    if (!reservationId || isNaN(reservationId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Reserva inválida",
        },
        { status: 400, }
      );
    }

    const reservation = await Reservation.findOne({
      where: {
        id: reservationId,
        customer_id: decoded.id,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        {
          success: false,
          error: "Reserva não encontrada",
        },
        { status: 404, }
      );
    }

    const event = await Event.findByPk(
      reservation.event_id
    );

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Evento da reserva não encontrado",
        },
        { status: 404, }
      );
    }

    const reservationSeats =
      await ReservationSeat.findAll({
        where: {
          reservation_id: reservation.id,
        },
      });

    const seatIds = reservationSeats.map(
      (item) => item.seat_id
    );

    const seats = await Seat.findAll({
      where: {
        id: seatIds,
      },

      order: [
        ["row", "ASC"],
        ["number", "ASC"],
      ],
    });

    return NextResponse.json({
      success: true,

      reservation: {
        id: reservation.id,
        status: reservation.status,
        total_price: reservation.total_price,

        event: {
          id: event.id,
          title: event.title,
          poster_url: event.poster_url,
          event_date: event.event_date,
          location: event.location,
          room: event.room,
          price: event.price,
        },

        seats: seats.map((seat) => ({
          id: seat.id,
          row: seat.row,
          number: seat.number,
        })),
      },
    });
  } catch (error) {
    console.error(
      "Erro ao buscar reserva:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao buscar reserva",
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