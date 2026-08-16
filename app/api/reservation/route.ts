import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Op, UniqueConstraintError } from "sequelize";
import { sequelize } from "@/app/api/db";
import { Event, EventStatus } from "@/app/models/Event";
import { Seat } from "@/app/models/Seat";
import { Reservation, ReservationStatus } from "@/app/models/Reservation";
import { ReservationSeat } from "@/app/models/Reservation_seat";

type UserRole = "CUSTOMER" | "ORGANIZER" | "GATE";

interface JwtPayload {
  id: number;
  role: UserRole;
}

export async function POST(request: NextRequest) {
  const transaction = await sequelize.transaction();
  /* Define expiração da reserva em 5 minutos */

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

  try {
    /* VERIFICAR AUTENTICAÇÃO */

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

    /* SOMENTE CUSTOMER */

    if (decoded.role !== "CUSTOMER") {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error: "Apenas clientes podem realizar reservas",
        },
        {
          status: 403,
        }
      );
    }

    /* RECEBER DADOS */

    const body = await request.json();

    const {
      event_id,
      seat_ids,
    } = body;

    /* VALIDAR DADOS */

    if (!event_id) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error: "Evento não informado",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(seat_ids) ||
      seat_ids.length === 0
    ) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error: "Selecione pelo menos um assento",
        },
        {
          status: 400,
        }
      );
    }

    /* Remove IDs duplicados */

    const uniqueSeatIds = [
      ...new Set(
        seat_ids.map((id) => Number(id))
      ),
    ];

    if (
      uniqueSeatIds.some(
        (id) => !Number.isInteger(id) || id <= 0
      )
    ) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error: "Assentos inválidos",
        },
        {
          status: 400,
        }
      );
    }

    /* BUSCA EVENTO */

    const event = await Event.findOne({
      where: {
        id: Number(event_id),

        status: EventStatus.PUBLISHED,

        event_date: {
          [Op.gt]: new Date(),
        },
      },

      transaction,
    });

    if (!event) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error: "Sessão não encontrada ou indisponível",
        },
        {
          status: 404,
        }
      );
    }

    /* BUSCAR ASSENTOS */

    const seats = await Seat.findAll({
      where: {
        id: {
          [Op.in]: uniqueSeatIds,
        },

        event_id: event.id,
      },

      transaction,
    });

    /* Se o cliente mandar 3 IDs, precisa encontrar exatamente 3 assentos pertencentes ao evento */

    if (seats.length !== uniqueSeatIds.length) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error:
            "Um ou mais assentos não pertencem a esta sessão",
        },
        {
          status: 400,
        }
      );
    }

    /* VERIFICA DISPONIBILIDADE */

    const alreadyReserved =
      await ReservationSeat.findAll({
        where: {
          seat_id: {
            [Op.in]: uniqueSeatIds,
          },
        },

        attributes: ["seat_id"],

        transaction,
      });

    if (alreadyReserved.length > 0) {
      await transaction.rollback();

      return NextResponse.json(
        {
          success: false,
          error:
            "Um ou mais assentos já foram reservados",
          unavailable_seats:
            alreadyReserved.map(
              (item) => item.seat_id
            ),
        },
        {
          status: 409,
        }
      );
    }

    /* CALCULAR VALOR */

    const price = Number(event.price);

    const totalPrice =
      price * uniqueSeatIds.length;

    /* CRIAR RESERVA */

    const reservation =
      await Reservation.create(
        {
          customer_id: decoded.id,
          event_id: event.id,

          status: ReservationStatus.PENDING,

          total_price: totalPrice.toFixed(2),

          expires_at: expiresAt,
        },
        {
          transaction,
        }
      );

    /* ASSOCIAR ASSENTOS */

    const reservationSeats =
      uniqueSeatIds.map((seatId) => ({
        reservation_id: reservation.id,
        seat_id: seatId,
      }));

    await ReservationSeat.bulkCreate(
      reservationSeats,
      {
        transaction,
      }
    );

    /* CONFIRMAR TRANSAÇÃO */

    await transaction.commit();

    /* Retorno dos dados necessários para o frontend seguir para pagamento. */

    return NextResponse.json(
      {
        success: true,

        message: "Reserva criada com sucesso",

        reservation: {
          id: reservation.id,
          event_id: event.id,

          seats: seats.map((seat) => ({
            id: seat.id,
            row: seat.row,
            number: seat.number,
          })),

          quantity: seats.length,

          unit_price: event.price,

          total_price:
            reservation.total_price,

          status: reservation.status,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    await transaction.rollback();

    /* A constraint UNIQUE de seat_id também protege contra concorrência */

    if (error instanceof UniqueConstraintError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Um dos assentos acabou de ser reservado por outro cliente",
        },
        {
          status: 409,
        }
      );
    }

    console.error(
      "Erro ao criar reserva:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao criar reserva",
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