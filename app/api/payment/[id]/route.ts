import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { sequelize } from "@/app/api/db";

import {
  Reservation,
  ReservationStatus,
} from "@/app/models/Reservation";

import {
  Payment,
  PaymentStatus,
} from "@/app/models/Payment";

import { ReservationSeat } from "@/app/models/Reservation_seat";
import { Ticket, TicketStatus } from "@/app/models/Ticket";

type UserRole = "CUSTOMER" | "ORGANIZER" | "GATE";

interface JwtPayload {
  id: number;
  role: UserRole;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const transaction = await sequelize.transaction();

  try {
    /* AUTENTICAÇÃO */

    const token = request.cookies.get("token")?.value;

    if (!token) {
      await transaction.rollback();

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
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error: "Apenas clientes podem realizar pagamentos",
        },
        {
          status: 403,
        }
      );
    }

    /* ID DA RESERVA */

    const { id } = await params;

    const reservationId = Number(id);

    if (
      !Number.isInteger(reservationId) ||
      reservationId <= 0
    ) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error: "ID da reserva inválido",
        },
        {
          status: 400,
        }
      );
    }

    /* RESULTADO SIMULADO */

    const body = await request.json();

    const result = body.result;

    if (
      result !== "APPROVED" &&
      result !== "DECLINED"
    ) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error: "Resultado de pagamento inválido",
        },
        {
          status: 400,
        }
      );
    }

    /* BUSCA RESERVA */

    const reservation = await Reservation.findOne({
      where: {
        id: reservationId,
        customer_id: decoded.id,
      },

      transaction,
    });

    if (!reservation) {
      await transaction.rollback();

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

    /* Uma reserva já confirmada ou cancelada não deve receber outro pagament */

    if (
      reservation.status !==
      ReservationStatus.PENDING
    ) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error: "Esta reserva já foi processada",
        },
        {
          status: 409,
        }
      );
    }

    /*  BUSCA ASSENTOS */

    const reservationSeats =
      await ReservationSeat.findAll({
        where: {
          reservation_id: reservation.id,
        },

        transaction,
      });

    if (reservationSeats.length === 0) {
      throw new Error(
        "Reserva não possui assentos associados"
      );
    }

    /* CRIAR PAGAMENTO */

    const payment = await Payment.create(
      {
        reservation_id: reservation.id,

        status:
          result === "APPROVED"
            ? PaymentStatus.APPROVED
            : PaymentStatus.DECLINED,

        paid_at:
          result === "APPROVED"
            ? new Date()
            : null,
      },
      {
        transaction,
      }
    );

    /* PAGAMENTO RECUSADO */

    if (result === "DECLINED") {
      reservation.status =
        ReservationStatus.CANCELLED;

      await reservation.save({
        transaction,
      });

      /* Remover ReservationSeat para liberar os lugares novamente */

      await ReservationSeat.destroy({
        where: {
          reservation_id: reservation.id,
        },

        transaction,
      });

      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: "Pagamento recusado",
        payment: {
          id: payment.id,
          status: payment.status,
        },
      });
    }

    /* PAGAMENTO APROVADO */

    reservation.status =
      ReservationStatus.CONFIRMED;

    await reservation.save({
      transaction,
    });

    /* CRIAR TICKETS */

    const tickets = [];

    for (const reservationSeat of reservationSeats) {
      /* Código para digitação manual */

      const code = crypto
        .randomBytes(6)
        .toString("hex")
        .toUpperCase();

      /* Token real que  vai dentro do QR Code */

      const qrToken = crypto
        .randomBytes(32)
        .toString("hex");

      /* Guarda somente o hash no banco */

      const qrTokenHash = crypto
        .createHash("sha256")
        .update(qrToken)
        .digest("hex");

      const ticket = await Ticket.create(
        { 
          reservation_id: reservation.id,
          seat_id: reservationSeat.seat_id,

          code,
          qr_token_hash: qrTokenHash,

          status: TicketStatus.ACTIVE,
          used_at: null,
        },
        {
          transaction,
        }
      );

      /* O qrToken é devolvido */

      tickets.push({
        id: ticket.id,
        seat_id: ticket.seat_id,
        code: ticket.code,
        qr_token: qrToken,
        status: ticket.status,
      });
    }

    /* COMMIT */

    await transaction.commit();

    return NextResponse.json(
      {
        success: true,

        message: "Pagamento aprovado",

        payment: {
          id: payment.id,
          status: payment.status,
        },

        reservation: {
          id: reservation.id,
          status: reservation.status,
        },

        tickets,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    await transaction.rollback();

    console.error(
      "Erro ao processar pagamento:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao processar pagamento",

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