import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Event } from "../../../models/Event";
import { connectDatabase } from "../../db";

interface JwtPayload {
  id: number;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDatabase();

    const token = request.cookies.get("token")?.value;

    if (!token) {
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
      throw new Error("JWT_SECRET não configurada.");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as JwtPayload;

    if (decoded.role !== "ORGANIZER") {
      return NextResponse.json(
        {
          success: false,
          message: "Acesso permitido apenas para organizadores.",
        },
        {
          status: 403,
        }
      );
    }

    const events = await Event.findAll({
      where: {
        organizer_id: decoded.id,
      },

      order: [
        ["event_date", "ASC"],
      ],
    });

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar eventos do organizador:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar eventos.",
      },
      {
        status: 500,
      }
    );
  }
}