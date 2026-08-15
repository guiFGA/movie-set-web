import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { sequelize } from "@/app/api/db";

import {
  Ticket,
  TicketStatus,
} from "@/app/models/Ticket";

import { Reservation } from "@/app/models/Reservation";
import { Event } from "@/app/models/Event";

import {
  TicketValidation,
  ValidationStatus,
} from "@/app/models/Ticket_validation";

type UserRole = "CUSTOMER" | "ORGANIZER" | "GATE";

interface JwtPayload {
  id: number;
  role: UserRole;
}

export async function POST(request: NextRequest) {
  const transaction = await sequelize.transaction();

  try {
    // =========================
    // 1. AUTENTICAÇÃO
    // =========================

    const authToken =
      request.cookies.get("token")?.value;

    if (!authToken) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          error: "Usuário não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET não configurado"
      );
    }

    const decoded = jwt.verify(
      authToken,
      jwtSecret
    ) as JwtPayload;

    // Somente usuário GATE pode validar
    if (decoded.role !== "GATE") {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          error:
            "Apenas a portaria pode validar ingressos",
        },
        {
          status: 403,
        }
      );
    }

    // =========================
    // 2. DADOS RECEBIDOS
    // =========================

    const body = await request.json();

    const eventId = Number(body.event_id);

    const qrToken =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const code =
      typeof body.code === "string"
        ? body.code.trim().toUpperCase()
        : "";

    if (
      !Number.isInteger(eventId) ||
      eventId <= 0
    ) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          error: "Evento inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (!qrToken && !code) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          error:
            "Informe o QR Code ou código do ingresso",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // 3. EVENTO SELECIONADO
    // =========================

    const selectedEvent = await Event.findByPk(
      eventId,
      {
        transaction,
      }
    );

    if (!selectedEvent) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          error: "Evento não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    // =========================
    // 4. BUSCAR INGRESSO
    // =========================

    const ticket = await Ticket.findOne({
      where: qrToken
        ? {
            qr_token: qrToken,
          }
        : {
            code,
          },

      /*
        O lock impede duas validações
        simultâneas do mesmo ingresso.
      */
      lock: transaction.LOCK.UPDATE,

      transaction,
    });

    // =========================
    // 5. INGRESSO INEXISTENTE
    // =========================

    if (!ticket) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          message: "Ingresso inválido",
        },
        {
          status: 404,
        }
      );
    }

    // =========================
    // 6. BUSCAR RESERVA
    // =========================

    const reservation =
      await Reservation.findByPk(
        ticket.reservation_id,
        {
          transaction,
        }
      );

    if (!reservation) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          message: "Reserva não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    // =========================
    // 7. EVENTO ERRADO
    // =========================

    if (
      reservation.event_id !== selectedEvent.id
    ) {
      await TicketValidation.create(
        {
          ticket_id: ticket.id,
          gate_user_id: decoded.id,
          event_id: selectedEvent.id,
          status: ValidationStatus.WRONG_EVENT,
          validated_at: new Date(),
        },
        {
          transaction,
        }
      );

      await transaction.commit();

      return NextResponse.json(
        {
          success: false,
          status: "WRONG_EVENT",
          message:
            "Este ingresso pertence a outro evento",
        },
        {
          status: 409,
        }
      );
    }

    // =========================
    // 8. JÁ UTILIZADO
    // =========================

    if (ticket.status === TicketStatus.USED) {
      await TicketValidation.create(
        {
          ticket_id: ticket.id,
          gate_user_id: decoded.id,
          event_id: selectedEvent.id,
          status:
            ValidationStatus.ALREADY_USED,
          validated_at: new Date(),
        },
        {
          transaction,
        }
      );

      await transaction.commit();

      return NextResponse.json(
        {
          success: false,
          status: "ALREADY_USED",
          message:
            "Este ingresso já foi utilizado",
          used_at: ticket.used_at,
        },
        {
          status: 409,
        }
      );
    }

    // =========================
    // 9. CANCELADO / INVÁLIDO
    // =========================

    if (
      ticket.status !== TicketStatus.ACTIVE
    ) {
      await TicketValidation.create(
        {
          ticket_id: ticket.id,
          gate_user_id: decoded.id,
          event_id: selectedEvent.id,
          status: ValidationStatus.INVALID,
          validated_at: new Date(),
        },
        {
          transaction,
        }
      );

      await transaction.commit();

      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          message:
            "Este ingresso não está ativo",
        },
        {
          status: 409,
        }
      );
    }

    // =========================
    // 10. VALIDAR INGRESSO
    // =========================

    ticket.status = TicketStatus.USED;
    ticket.used_at = new Date();

    await ticket.save({
      transaction,
    });

    // Registra a validação no histórico
    await TicketValidation.create(
      {
        ticket_id: ticket.id,
        gate_user_id: decoded.id,
        event_id: selectedEvent.id,
        status: ValidationStatus.VALID,
        validated_at: new Date(),
      },
      {
        transaction,
      }
    );

    // =========================
    // 11. CONFIRMAR TRANSAÇÃO
    // =========================

    await transaction.commit();

    return NextResponse.json(
      {
        success: true,

        status: "VALID",

        message: "Ingresso válido",

        ticket: {
          id: ticket.id,
          code: ticket.code,
          used_at: ticket.used_at,
        },

        event: {
          id: selectedEvent.id,
          title: selectedEvent.title,
          location: selectedEvent.location,
          room: selectedEvent.room,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    await transaction.rollback();

    console.error(
      "Erro ao validar ingresso:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        status: "INVALID",
        error:
          "Erro interno ao validar ingresso",

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