import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

import { sequelize } from "../../../../db";
import {
  Event,
  EventStatus,
} from "../../../../../models/Event";
import {
  Reservation,
  ReservationStatus,
} from "../../../../../models/Reservation";
import { ReservationSeat } from "../../../../../models/Reservation_seat";
import {
  Ticket,
  TicketStatus,
} from "../../../../../models/Ticket";

interface JwtPayload {
  id: number;
  role: string;
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const transaction =
    await sequelize.transaction();

  try {
    const token =
      request.cookies.get("token")?.value;

    if (!token) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          message: "Não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET não configurada."
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as JwtPayload;

    if (decoded.role !== "ORGANIZER") {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          message:
            "Apenas organizadores podem cancelar eventos.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await context.params;

    const eventId = Number(id);

    if (
      !Number.isInteger(eventId) ||
      eventId <= 0
    ) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          message: "Evento inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const event = await Event.findOne({
      where: {
        id: eventId,
        organizer_id: decoded.id,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!event) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          message:
            "Evento não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      event.status ===
      EventStatus.CANCELLED
    ) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          message:
            "Este evento já está cancelado.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      1. Cancela o evento
    */
    event.status =
      EventStatus.CANCELLED;

    await event.save({
      transaction,
    });

    /*
      2. Busca reservas relacionadas
    */
    const reservations =
      await Reservation.findAll({
        where: {
          event_id: event.id,

          status: {
            [Op.in]: [
              ReservationStatus.PENDING,
              ReservationStatus.CONFIRMED,
            ],
          },
        },

        transaction,
      });

    const reservationIds =
      reservations.map(
        (reservation) =>
          reservation.id
      );

    if (
      reservationIds.length > 0
    ) {
      /*
        3. Cancela as reservas
      */
      await Reservation.update(
        {
          status:
            ReservationStatus.CANCELLED,
        },
        {
          where: {
            id: {
              [Op.in]:
                reservationIds,
            },
          },

          transaction,
        }
      );

      /*
        4. Cancela ingressos ativos
      */
      await Ticket.update(
        {
          status:
            TicketStatus.CANCELLED,
        },
        {
          where: {
            reservation_id: {
              [Op.in]:
                reservationIds,
            },

            status:
              TicketStatus.ACTIVE,
          },

          transaction,
        }
      );

      /*
        5. Libera os assentos

        ReservationSeat é quem representa
        que um assento está ocupado.
      */
      await ReservationSeat.destroy({
        where: {
          reservation_id: {
            [Op.in]:
              reservationIds,
          },
        },

        transaction,
      });
    }

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message:
        "Evento cancelado com sucesso.",
    });
  } catch (error) {
    await transaction.rollback();

    console.error(
      "Erro ao cancelar evento:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro ao cancelar evento.",
      },
      {
        status: 500,
      }
    );
  }
}