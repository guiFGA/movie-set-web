import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { User } from "../../models/User";
import { connectDatabase } from "../db";

export async function POST(req: Request) {
  //connectDatabase() comentado para nao ficar sincronizando com o banco de dados
  try {
    const { email, name, password } = await req.json();

    // Valida campos obrigatórios
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Verifica se já existe usuário com esse email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Usuário já existe" },
        { status: 400 }
      );
    }

    // Criptografa a senha
    const password_hash = await bcrypt.hash(password, 10);

    // Cria usuário no banco
    const user = await User.create({
      email,
      name,
      password_hash,
    });

    return NextResponse.json({
      success: true, 
      message: "Cadastro realizado com sucesso!",
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Erro interno no cadastro" },
      { status: 500 }
    );
  }
}