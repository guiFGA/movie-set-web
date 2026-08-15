"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface TicketData {
  id: number;
  code: string;
  status: "ACTIVE" | "USED" | "CANCELLED";
  used_at: string | null;

  reservation_id: number;

  seat: {
    id: number;
    row: string;
    number: number;
  };

  event: {
    id: number;
    title: string;
    poster_url: string | null;
    event_date: string;
    location: string;
    room: string;
  };
}

export default function MyTicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        setMessage("");

        const response = await fetch("/api/tickets", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          setMessage(
            data.error ||
              "Não foi possível carregar seus ingressos."
          );

          return;
        }

        setTickets(data.tickets ?? []);
      } catch (error) {
        console.error(
          "Erro ao carregar ingressos:",
          error
        );

        setMessage(
          "Ocorreu um erro ao carregar seus ingressos."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [router]);

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  }

  function formatTime(date: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function getStatusText(status: TicketData["status"]) {
    switch (status) {
      case "ACTIVE":
        return "Válido";

      case "USED":
        return "Utilizado";

      case "CANCELLED":
        return "Cancelado";

      default:
        return status;
    }
  }

  if (loading) {
    return (
      <main className={styles.container}>
        <p className={styles.loading}>
          Carregando seus ingressos...
        </p>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <span>MINHA CONTA</span>

        <h1>Meus ingressos</h1>

        <p>
          Consulte seus ingressos e os dados das
          próximas sessões.
        </p>
      </header>

      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}

      {tickets.length === 0 ? (
        <section className={styles.empty}>
          <h2>Você ainda não possui ingressos</h2>

          <p>
            Quando uma compra for concluída, seus
            ingressos aparecerão aqui.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/eventos-disponiveis")
            }
          >
            Ver sessões disponíveis
          </button>
        </section>
      ) : (
        <section className={styles.ticketGrid}>
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              className={styles.ticketCard}
            >
              <div className={styles.poster}>
                {ticket.event.poster_url ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${ticket.event.poster_url}`}
                    alt={ticket.event.title}
                  />
                ) : (
                  <div className={styles.noPoster}>
                    Sem imagem
                  </div>
                )}
              </div>

              <div className={styles.ticketContent}>
                <div className={styles.ticketTop}>
                  <div>
                    <span className={styles.ticketLabel}>
                      INGRESSO
                    </span>

                    <h2>{ticket.event.title}</h2>
                  </div>

                  <span
                    className={`${styles.status} ${
                      ticket.status === "ACTIVE"
                        ? styles.active
                        : ticket.status === "USED"
                        ? styles.used
                        : styles.cancelled
                    }`}
                  >
                    {getStatusText(ticket.status)}
                  </span>
                </div>

                <div className={styles.details}>
                  <div>
                    <span>Data</span>
                    <strong>
                      {formatDate(
                        ticket.event.event_date
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Horário</span>
                    <strong>
                      {formatTime(
                        ticket.event.event_date
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Local</span>
                    <strong>
                      {ticket.event.location}
                    </strong>
                  </div>

                  <div>
                    <span>Sala</span>
                    <strong>
                      {ticket.event.room}
                    </strong>
                  </div>

                  <div>
                    <span>Assento</span>
                    <strong
                      className={styles.seatNumber}
                    >
                      {ticket.seat.row}
                      {ticket.seat.number}
                    </strong>
                  </div>
                </div>

                <div className={styles.ticketBottom}>
                  <div className={styles.code}>
                    <span>Código do ingresso</span>
                    <strong>{ticket.code}</strong>
                  </div>

                  <button
                    type="button"
                    className={styles.ticketButton}
                    onClick={() =>
                      router.push(
                        `/meus-ingressos/${ticket.id}`
                      )
                    }
                  >
                    Ver ingresso
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}