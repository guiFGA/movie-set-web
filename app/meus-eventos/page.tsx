"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

interface Event {
  id: number;
  title: string;
  description: string | null;
  poster_url: string | null;
  event_date: string;
  location: string;
  room: string;
  capacity: number;
  price: string;
  status: "PUBLISHED" | "CANCELLED";
}



type DisplayStatus =
  | "PUBLISHED"
  | "ENDED"
  | "CANCELLED";

export default function MyEventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] =
    useState("");

  const [cancellingId, setCancellingId] =
    useState<number | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/organizer/events",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Não foi possível carregar seus eventos."
        );

        return;
      }

      setEvents(data.events || []);
    } catch (error) {
      console.error(
        "Erro ao carregar eventos:",
        error
      );

      setMessage(
        "Erro ao carregar seus eventos."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    );
  }

  function formatPrice(price: string) {
    return Number(price).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function getPosterUrl(
    posterUrl: string | null
  ) {
    if (!posterUrl) {
      return null;
    }

    if (posterUrl.startsWith("http")) {
      return posterUrl;
    }

    return `https://image.tmdb.org/t/p/w500${posterUrl}`;
  }

  function getEventStatus(
    event: Event
  ): DisplayStatus {
    if (event.status === "CANCELLED") {
      return "CANCELLED";
    }

    if (
      new Date(event.event_date).getTime() <
      Date.now()
    ) {
      return "ENDED";
    }

    return "PUBLISHED";
  }

  function getStatusLabel(
    status: DisplayStatus
  ) {
    switch (status) {
      case "CANCELLED":
        return "Cancelado";

      case "ENDED":
        return "Encerrado";

      default:
        return "Publicado";
    }
  }

  function getStatusClass(
    status: DisplayStatus
  ) {
    switch (status) {
      case "CANCELLED":
        return styles.cancelled;

      case "ENDED":
        return styles.ended;

      default:
        return styles.published;
    }
  }

  async function handleCancelEvent(
    event: Event
  ) {
    const confirmed = window.confirm(
      `Tem certeza que deseja cancelar o evento "${event.title}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(event.id);
      setMessage("");

      const response = await fetch(
        `/api/organizer/events/${event.id}/cancel`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Não foi possível cancelar o evento."
        );

        return;
      }

      /*
       * Atualiza o estado local.
       * Não precisamos buscar tudo novamente.
       */
      setEvents((currentEvents) =>
        currentEvents.map(
          (currentEvent) =>
            currentEvent.id === event.id
              ? {
                  ...currentEvent,
                  status: "CANCELLED",
                }
              : currentEvent
        )
      );

      setMessage(
        `O evento "${event.title}" foi cancelado com sucesso.`
      );
    } catch (error) {
      console.error(
        "Erro ao cancelar evento:",
        error
      );

      setMessage(
        "Erro ao cancelar o evento."
      );
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.content}>
          <p className={styles.loading}>
            Carregando eventos...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <span className={styles.label}>
              ORGANIZADOR
            </span>

            <h1>Meus eventos</h1>

            <p>
              Visualize e gerencie as sessões
              criadas por você.
            </p>
          </div>

          <button
            type="button"
            className={styles.createButton}
            onClick={() =>
              router.push("/criar-evento")
            }
          >
            Criar novo evento
          </button>
        </header>

        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}

        {events.length === 0 && (
          <section className={styles.empty}>
            <h2>
              Nenhum evento criado
            </h2>

            <p>
              Você ainda não publicou nenhuma
              sessão.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/criar-evento"
                )
              }
            >
              Criar evento
            </button>
          </section>
        )}

        {events.length > 0 && (
          <section className={styles.grid}>
            {events.map((event) => {
              const posterUrl =
                getPosterUrl(
                  event.poster_url
                );

              const displayStatus =
                getEventStatus(event);

              const canManage =
                displayStatus ===
                "PUBLISHED";

              return (
                <article
                  key={event.id}
                  className={`${styles.card} ${
                    !canManage
                      ? styles.inactiveCard
                      : ""
                  }`}
                >
                  <div
                    className={
                      styles.posterArea
                    }
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={event.title}
                      />
                    ) : (
                      <div
                        className={
                          styles.noPoster
                        }
                      >
                        Sem imagem
                      </div>
                    )}

                    {!canManage && (
                      <div
                        className={
                          styles.posterOverlay
                        }
                      />
                    )}
                  </div>

                  <div
                    className={
                      styles.cardContent
                    }
                  >
                    <div
                      className={
                        styles.cardTop
                      }
                    >
                      <h2>
                        {event.title}
                      </h2>

                      <span
                        className={`${
                          styles.status
                        } ${getStatusClass(
                          displayStatus
                        )}`}
                      >
                        {getStatusLabel(
                          displayStatus
                        )}
                      </span>
                    </div>

                    <div
                      className={
                        styles.details
                      }
                    >
                      <p>
                        <strong>
                          Data:
                        </strong>{" "}
                        {formatDate(
                          event.event_date
                        )}
                      </p>

                      <p>
                        <strong>
                          Local:
                        </strong>{" "}
                        {event.location}
                      </p>

                      <p>
                        <strong>
                          Sala:
                        </strong>{" "}
                        {event.room}
                      </p>

                      <p>
                        <strong>
                          Capacidade:
                        </strong>{" "}
                        {event.capacity}
                      </p>

                      <p>
                        <strong>
                          Preço:
                        </strong>{" "}
                        {formatPrice(
                          event.price
                        )}
                      </p>
                    </div>

                    {canManage ? (
                      <div
                        className={
                          styles.actions
                        }
                      >
                        <button
                          type="button"
                          className={
                            styles.viewButton
                          }
                          onClick={() =>
                            router.push(
                              `/eventos/${event.id}`
                            )
                          }
                        >
                          Visualizar
                        </button>

                        <button
                          type="button"
                          className={
                            styles.cancelButton
                          }
                          disabled={
                            cancellingId ===
                            event.id
                          }
                          onClick={() =>
                            handleCancelEvent(
                              event
                            )
                          }
                        >
                          {cancellingId ===
                          event.id
                            ? "Cancelando..."
                            : "Cancelar"}
                        </button>
                      </div>
                    ) : (
                      <div
                        className={
                          styles.unavailable
                        }
                      >
                        {displayStatus ===
                        "CANCELLED"
                          ? "Este evento foi cancelado."
                          : "Este evento já foi encerrado."}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}