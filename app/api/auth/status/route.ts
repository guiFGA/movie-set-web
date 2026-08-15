import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { User } from "@/app/models/User";

type UserRole = "CUSTOMER" | "ORGANIZER" | "GATE";

interface JwtPayload {
  id: number;
  role: UserRole;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({
        logged: false,
        role: null,
        name: null,
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

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return NextResponse.json({
        logged: false,
        role: null,
        name: null,
      },
      {
        status: 404,
       }
      );
    }

    return NextResponse.json({
      logged: true,
      userId: user.id,
      role: user.role,
      name: user.name,
    });

  } catch {
    return NextResponse.json(
      {
        logged: false,
        role: null,
        name: null,
      },
      {
        status: 401,
      }
    );
  }
}