import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: number;
  role: "CUSTOMER" | "ORGANIZER" | "GATE";
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({
        logged: false,
        role: null,
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET não configurado");
    }

    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as JwtPayload;

    return NextResponse.json({
      logged: true,
      userId: decoded.id,
      role: decoded.role,
    });

  } catch {
    return NextResponse.json(
      {
        logged: false,
        role: null,
      },
      {
        status: 401,
      }
    );
  }
}