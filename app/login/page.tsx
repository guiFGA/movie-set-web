"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(data.message || "Login realizado com sucesso!");

        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        setMessage(data.error || "E-mail ou senha inválidos");
      }
    } catch {
      setMessage("Erro inesperado no servidor");
    }
  }

  return (
    <div className="login-container">

      {/* Lado esquerdo - formulário */}
      <div className="login-left">
        <div className="login-card">

          <h2>Entre na sua conta</h2>

          <form onSubmit={handleSubmit}>

            <label>E-mail</label>
            <input
              type="email"
              placeholder="Digite seu email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">
              Entrar
            </button>

          </form>

          {message && (
            <p className="message">
              {message}
            </p>
          )}

        </div>
      </div>


      {/* Lado direito - texto */}
      <div className="login-right">

        <h1>Bem-vindo de volta!</h1>

        <p>
          Entre na sua conta para acessar seus ingressos,
          acompanhar sessões disponíveis e aproveitar tudo
          que o Movie Set Web oferece.
        </p>

        <p className="register-link">
          Ainda não possui uma conta?{" "}
          <a href="/cadastro">
            Cadastre-se
          </a>
        </p>

      </div>

    </div>
  );
}