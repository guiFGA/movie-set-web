"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";

import styles from "./page.module.css";

interface PublicTicket {
  id: number;
  code: string;
  status: "ACTIVE" | "USED" | "CANCELLED";
  used_at: string | null;

  event: {
    id: number;
    title: string;
    poster_url: string | null;
    event_date: string;
    location: string;
    room: string;
  };

  seat: {
    row: string;
    number: number;
  };
}

export default function PublicTicketPage() {
  const params = useParams();

  const token = params.token as string;

  const [ticket, setTicket] =
    useState<PublicTicket | null>(null);

  const [ticketUrl, setTicketUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  /*
    ==========================
    BUSCAR INGRESSO
    ==========================
  */

  useEffect(() => {
    async function loadTicket() {
      try {
        setLoading(true);
        setMessage("");

        const response = await fetch(
          `/api/public/ticket/${token}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

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
          "Erro ao carregar ingresso público:",
          error
        );

        setMessage(
          "Ocorreu um erro ao carregar o ingresso."
        );
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadTicket();
    }
  }, [token]);

  /*
    ==========================
    GERAR URL DO QR CODE
    ==========================

    O QR contém o link público do ingresso.

    Exemplo:

    http://localhost:3000/ingresso/TOKEN
  */

  useEffect(() => {
    if (!token) {
      return;
    }

    const url =
      `${window.location.origin}/ingresso/${token}`;

    setTicketUrl(url);
  }, [token]);

  /*
    ==========================
    FORMATAÇÃO
    ==========================
  */

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

  function getStatusText(
    status: PublicTicket["status"]
  ) {
    switch (status) {
      case "ACTIVE":
        return "Ingresso válido";

      case "USED":
        return "Ingresso utilizado";

      case "CANCELLED":
        return "Ingresso cancelado";

      default:
        return status;
    }
  }

  /*
    ==========================
    LOADING
    ==========================
  */

  if (loading) {
    return (
      <main className={styles.container}>
        <p className={styles.loading}>
          Carregando ingresso...
        </p>
      </main>
    );
  }

  /*
    ==========================
    INGRESSO NÃO ENCONTRADO
    ==========================
  */

  if (!ticket) {
    return (
      <main className={styles.container}>
        <section className={styles.error}>
          <h1>Ingresso inválido</h1>

          <p>
            {message ||
              "Não foi possível localizar este ingresso."}
          </p>
        </section>
      </main>
    );
  }

  /*
    ==========================
    PÁGINA
    ==========================
  */

  return (
    <main className={styles.container}>
      <header className={styles.pageHeader}>
        <span>MOVIE SET WEB</span>

        <h1>Ingresso digital</h1>

        <p>
          Apresente o QR Code abaixo na entrada da sessão.
        </p>
      </header>

      <article className={styles.ticket}>
        {/* DADOS DO FILME */}

        <section className={styles.movieSection}>
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

          <div className={styles.movieInfo}>
            {/* STATUS */}

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

            <h2>{ticket.event.title}</h2>

            {/* INFORMAÇÕES DA SESSÃO */}

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
        </section>

        <div className={styles.separator} />

        {/* QR CODE + CÓDIGO MANUAL */}

        <section className={styles.accessSection}>
          <div className={styles.qrArea}>
            {ticketUrl && (
              <QRCode
                value={ticketUrl}
                size={220}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            )}
          </div>

          <div className={styles.codeArea}>
            <span className={styles.accessLabel}>
              CÓDIGO DO INGRESSO
            </span>

            <strong className={styles.code}>
              {ticket.code}
            </strong>

            <p>
              Apresente o QR Code na portaria. Caso a
              leitura pela câmera não esteja disponível,
              informe este código manualmente.
            </p>
          </div>
        </section>

        {/* INGRESSO UTILIZADO */}

        {ticket.status === "USED" && (
          <div className={styles.warning}>
            Este ingresso já foi utilizado.
          </div>
        )}

        {/* INGRESSO CANCELADO */}

        {ticket.status === "CANCELLED" && (
          <div className={styles.warning}>
            Este ingresso foi cancelado.
          </div>
        )}
      </article>

      <p className={styles.footer}>
        Movie Set Web • Ingresso digital
      </p>
    </main>
  );
}