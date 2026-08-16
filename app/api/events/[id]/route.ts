import { NextRequest, NextResponse } from "next/server";
import { Op } from "sequelize";

import { Event, EventStatus } from "@/app/models/Event";
import { Seat } from "@/app/models/Seat";
import { ReservationSeat } from "@/app/models/Reservation_seat";
import { Reservation, ReservationStatus } from "../../../models/Reservation";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: number;
  role: string;
}

export async function GET(
  request: NextRequest,
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
        "organizer_id",
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

    //liberar reservas pendentes que expiraram
    const expiredReservations = await Reservation.findAll({
      where: {
        event_id: event.id,
        status: ReservationStatus.PENDING,

        expires_at: {
          [Op.lt]: new Date(),
        },
      },

      attributes: ["id"],
    });
    const expiredReservationIds = expiredReservations.map(
      (reservation) => reservation.id
    );

    if (expiredReservationIds.length > 0) {
      await ReservationSeat.destroy({
        where: {
          reservation_id: {
            [Op.in]: expiredReservationIds,
          },
        },
      });

      await Reservation.update(
        {
          status: ReservationStatus.CANCELLED,
        },
        {
          where: {
            id: {
              [Op.in]: expiredReservationIds,
            },
          },
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

    let organizerStats: {
          soldSeats: number;
          revenue: number;
        } | null = null;

    const token = request.cookies.get("token")?.value;

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        ) as JwtPayload;
      
        const isEventOwner =
          decoded.role === "ORGANIZER" &&
          decoded.id === event.organizer_id;

        if (isEventOwner) {
          const confirmedReservations =
            await Reservation.findAll({
              where: {
                event_id: event.id,
                status: ReservationStatus.CONFIRMED,
              },

              attributes: ["id", "total_price"],
            });

          const reservationIds = confirmedReservations.map(
            (reservation) => reservation.id
          );

          let soldSeats = 0;

          if (reservationIds.length > 0) {
            soldSeats = await ReservationSeat.count({
              where: {
                reservation_id: {
                  [Op.in]: reservationIds,
                },
              },
            });
          }

          const revenue = confirmedReservations.reduce(
            (total, reservation) => {
              return total + Number(reservation.total_price);
            },
            0
          );

          organizerStats = {
            soldSeats,
            revenue,
          };
        }
      } catch (error) {
        console.log(
          "Token inválido ao verificar estatísticas do organizador."
        );
      }
    }

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
        organizerStats,
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