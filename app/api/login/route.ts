import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../../models/User";
import { connectDatabase } from "../db";

export async function POST(request: NextRequest) {

    connectDatabase();

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "E-mail e senha são obrigatórios",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Email ou senha inválida",
        },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { 
          success: false,
          error: "Email ou senha inválida",
        },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "20m",
      }
    );

    const response = NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development",
      sameSite: "lax",
      maxAge: 60 * 20,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}