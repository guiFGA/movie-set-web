"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import QRCode from "react-qr-code";

interface TicketData {
  id: number;
  code: string;
  qr_token: string;
  status: "ACTIVE" | "USED" | "CANCELLED";
  used_at: string | null;
  reservation_id: number;

  event: {
    id: number;
    title: string;
    poster_url: string | null;
    event_date: string;
    location: string;
    room: string;
  };

  seat: {
    id: number;
    row: string;
    number: number;
  };
}

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [ticket, setTicket] =
    useState<TicketData | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");

  useEffect(() => {
    async function loadTicket() {
      try {
        setLoading(true);
        setMessage("");

        const response = await fetch(
          `/api/tickets/${id}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          setMessage(
            data.error ||
              "Não foi possível carregar o ingresso."
          );

          return;
        }

        setTicket(data.ticket);

        
      } catch (error) {
        console.error(
          "Erro ao carregar ingresso:",
          error
        );

        setMessage(
          "Ocorreu um erro ao carregar o ingresso."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadTicket();
    }
  }, [id, router]);

  useEffect(() => {
    if (!ticket) {
      return;
    }

    const url =
      `${window.location.origin}/ingresso/${ticket.qr_token}`;

    setTicketUrl(url);
  }, [ticket]);

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

  function getStatusLabel(
    status: TicketData["status"]
  ) {
    switch (status) {
      case "ACTIVE":
        return "Ingresso válido";

      case "USED":
        return "Ingresso utilizado";

      case "CANCELLED":
        return "Ingresso cancelado";
    }
  }

  async function handleShare() {
    if (!ticket) {
      return;
    }

    try{
        if (navigator.share) {
          await navigator.share({
            title: `Ingresso para ${ticket.event.title}`,
            text: `Aqui está o meu ingresso para o evento "${ticket.event.title}".`,
            url: ticketUrl,
          });
          return;
        }
        await navigator.clipboard.writeText(ticketUrl);

        setMessage("Link do ingresso copiado para a área de transferência");
    } catch (error) {
      console.error("Erro ao compartilhar ingresso:", error);
    }
  }

  if (loading) {
    return (
      <main className={styles.container}>
        <p className={styles.loading}>
          Carregando ingresso...
        </p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className={styles.container}>
        <section className={styles.error}>
          <h1>Ingresso não encontrado</h1>

          <p>
            {message ||
              "Não foi possível localizar esse ingresso."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/meus-ingressos")
            }
          >
            Voltar para meus ingressos
          </button>
        </section>
      </main>
    );
  }


  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <span>MEU INGRESSO</span>

        <h1>{ticket.event.title}</h1>

        <p>
          Apresente este ingresso na entrada do evento.
        </p>
      </header>

      <section className={styles.ticket}>
        <div className={styles.movieSection}>
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

          <div className={styles.info}>
            <div className={styles.statusArea}>
              <span
                className={`${styles.status} ${
                  ticket.status === "ACTIVE"
                    ? styles.active
                    : ticket.status === "USED"
                    ? styles.used
                    : styles.cancelled
                }`}
              >
                {getStatusLabel(ticket.status)}
              </span>
            </div>

            <h2>{ticket.event.title}</h2>

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

                <strong className={styles.seat}>
                  {ticket.seat.row}
                  {ticket.seat.number}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.separator} />

        <div className={styles.accessSection}>
          <div className={styles.qrPlaceholder}>
            {ticketUrl && (
              <QRCode
                value={ticketUrl}
                size={250}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            )}
          </div>

          <div className={styles.codeArea}>
            <span>Código manual</span>

            <strong>{ticket.code}</strong>

            <p>
              Caso a leitura do QR Code não seja
              possível, informe este código na entrada.
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() =>
              router.push("/meus-ingressos")
            }
          >
            Voltar
          </button>

          <button
            type="button"
            className={styles.shareButton}
            onClick={handleShare}
          >
            Compartilhar ingresso
          </button>
        </div>
      </section>

      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}
    </main>
  );
}