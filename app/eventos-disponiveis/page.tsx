"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./eventos.css";

type UserRole = "CUSTOMER" | "ORGANIZER" | "GATE";

interface Event {
  id: number;
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  event_date: string;
  location: string;
  room: string;
  price: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [logged, setLogged] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function loadPage() {
      try {
        // Busca eventos
        const eventsRes = await fetch("/api/events", {
          cache: "no-store",
        });

        const eventsData = await eventsRes.json();

        if (eventsRes.ok) {
          setEvents(eventsData.events ?? []);
        } else {
          setMessage(
            eventsData.error || "Erro ao carregar eventos."
          );
        }

        // Verifica autenticação
        const authRes = await fetch("/api/auth/status", {
          cache: "no-store",
        });

        const authData = await authRes.json();

        if (authRes.ok && authData.logged) {
          setLogged(true);
          setRole(authData.role);
        } else {
          setLogged(false);
          setRole(null);
        }

      } catch (error) {
        console.error(error);

        setMessage(
          "Erro inesperado ao carregar a página."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, []);

  function handleOpenEvent(eventId: number) {
    if (!logged) {
      setMessage(
        "Você precisa fazer login para reservar ingressos."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1000);

      return;
    }

    if (role !== "CUSTOMER") {
      setMessage(
        "Apenas clientes podem reservar ingressos."
      );

      return;
    }

    router.push(`/eventos/${eventId}`);
  }

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

  function formatPrice(price: string) {
    return Number(price).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (loading) {
    return (
      <main className="events-container">
        <p className="events-message">
          Carregando eventos...
        </p>
      </main>
    );
  }

  return (
    <main className="events-container">

      <div className="events-header">
        <h1>Eventos disponíveis</h1>

        <p>
          Confira as sessões disponíveis e escolha
          onde assistir ao seu próximo filme.
        </p>
      </div>

      {message && (
        <p className="events-message">
          {message}
        </p>
      )}

      <div className="events-grid">

        {events.map((event) => (
          <article
            key={event.id}
            className="event-card"
          >

            <div className="poster-container">

              {event.poster_url ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${event.poster_url}`}
                  alt={event.title}
                />
              ) : (
                <div className="no-poster">
                  Sem imagem
                </div>
              )}

            </div>

            <div className="event-info">

              <h2>{event.title}</h2>

              <div className="event-details">

                <div>
                  <span>Data</span>
                  <strong>
                    {formatDate(event.event_date)}
                  </strong>
                </div>

                <div>
                  <span>Horário</span>
                  <strong>
                    {formatTime(event.event_date)}
                  </strong>
                </div>

                <div>
                  <span>Local</span>
                  <strong>
                    {event.location}
                  </strong>
                </div>

                <div>
                  <span>Sala</span>
                  <strong>
                    {event.room}
                  </strong>
                </div>

              </div>

              <div className="event-footer">

                <div className="event-price">
                  <span>Preço</span>

                  <strong>
                    {formatPrice(event.price)}
                  </strong>
                </div>

                <button
                  type="button"
                  className="event-button"
                  onClick={() =>
                    handleOpenEvent(event.id)
                  }
                >
                  Ver sessão
                </button>

              </div>

            </div>

          </article>
        ))}

      </div>

    </main>
  );
}