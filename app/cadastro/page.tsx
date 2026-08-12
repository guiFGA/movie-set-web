"use client";

import { useState } from "react";
import "./cadastro.css"; // importa o CSS separado
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter()
  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });


    let data;
    try{
      data = await res.json()
    }catch{
      setMessage("Erro inesperado no servidor")
      return;
    }
    if (res.ok && data.success) {
      setMessage(data.message);
      setEmail("");
      setName("");
      setPassword("");
      setTimeout(()=>{
        router.push("/login")
      }, 1500);
      
    } else {
      setMessage(data.error || "Erro no cadastro");
    }
  }

  return (
    <div className="register-container">
      {/* Lado esquerdo */}
      <div className="register-left">
        <h1>Seja bem-vindo ao Movie Set Web</h1>
        <p>
          Cadastre-se para obter acesso a todas as funcionalidades e fazer parte
          da nossa comunidade.
        </p>
        <p className="login-link">
          Já possui uma conta? <a href="/login">Login</a>
        </p>
      </div>

      {/* Lado direito */}
      <div className="register-right">
        <div className="register-card">
          <h2>Crie sua conta</h2>
          <form onSubmit={handleSubmit}>
            <label>E-mail</label>
            <input
              type="email"
              placeholder="Digite seu email..."
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <label>Nome completo</label>
            <input
              type="text"
              placeholder="Digite seu nome completo..."
              value={name}
              onChange={e => setName(e.target.value)}
            />

            <label>Senha</label>
            <input
              type="password"
              placeholder="Crie sua senha..."
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <button type="submit">Enviar</button>
          </form>
          {message && <p className="message">{message}</p>}
        </div>
      </div>
    </div>
  );
}
