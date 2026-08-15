"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

interface EventData {
  id: number;
  tmdb_id: number;
  title: string;
  description: string | null;
  poster_url: string | null;
  event_date: string; 
  location: string;
  room: string;
  capacity: number;
  price: string;
}

interface Seat {
  id: number;
  row: string;
  number: number;
  available: boolean;
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setMessage("");

        const response = await fetch(`/api/events/${id}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "Erro ao carregar sessão");
          return;
        }

        setEvent(data.event);
        setSeats(data.seats ?? []);
      } catch (error) {
        console.error("Erro ao buscar sessão:", error);

        setMessage(
          "Não foi possível carregar as informações da sessão."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadEvent();
    }
  }, [id]);

  function handleSeatClick(seat: Seat) {
    if (!seat.available) {
      return;
    }

    setSelectedSeats((currentSeats) => {
      const alreadySelected = currentSeats.includes(seat.id);

      if (alreadySelected) {
        return currentSeats.filter(
          (seatId) => seatId !== seat.id
        );
      }

      return [...currentSeats, seat.id];
    });
  }

  const selectedSeatObjects = useMemo(() => {
    return seats.filter((seat) =>
      selectedSeats.includes(seat.id)
    );
  }, [seats, selectedSeats]);

  const totalPrice = useMemo(() => {
    if (!event) {
      return 0;
    }

    return selectedSeats.length * Number(event.price);
  }, [selectedSeats, event]);

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

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function handleContinue() {

     if (!event) {
    setMessage("Sessão não encontrada.");
    return;
    }

    if (selectedSeats.length === 0) {
      setMessage(
        "Selecione pelo menos um assento para continuar."
      );

      return;
    }

    console.log("Evento:", event?.id);
    console.log("Assentos:", selectedSeats);

    try {
      setMessage("");

      const response = await fetch("/api/reservation", {
        method: "POST",

        headers: {
        "Content-Type": "application/json",
        },

        body: JSON.stringify({
          event_id: event.id,
          seat_ids: selectedSeats,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Não foi possível realizar a reserva.");
          return;
      }

    setMessage("Reserva criada com sucesso!");

    const reservationId = data.reservation.id;

    router.push(`/pagamento/${reservationId}`);
    } catch (error) {
      console.error("Erro ao criar reserva:", error);

      setMessage(
      "Ocorreu um erro ao tentar realizar a reserva.");
      } finally{
        setReserving(false);
      }
  }

  if (loading) {
    return (
      <main className={styles.container}>
        <p className={styles.loading}>
          Carregando sessão...
        </p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className={styles.container}>
        <div className={styles.error}>
          <h1>Sessão não encontrada</h1>

          <p>
            {message ||
              "Não foi possível encontrar essa sessão."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/eventos-disponiveis")
            }
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <section className={styles.eventHeader}>
        <div className={styles.poster}>
          {event.poster_url ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${event.poster_url}`}
              alt={event.title}
            />
          ) : (
            <div className={styles.noPoster}>
              Sem imagem
            </div>
          )}
        </div>

        <div className={styles.eventInfo}>
          <span className={styles.label}>
            SUA SESSÃO
          </span>

          <h1>{event.title}</h1>

          {event.description && (
            <p className={styles.description}>
              {event.description}
            </p>
          )}

          <div className={styles.sessionDetails}>
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
              <strong>{event.location}</strong>
            </div>

            <div>
              <span>Sala</span>
              <strong>{event.room}</strong>
            </div>

            <div>
              <span>Ingresso</span>
              <strong>
                {formatPrice(Number(event.price))}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.seatSection}>
        <div className={styles.seatHeader}>
          <div>
            <span className={styles.label}>
              ESCOLHA SEUS LUGARES
            </span>

            <h2>Mapa de assentos</h2>
          </div>

          <div className={styles.legend}>
            <div>
              <span
                className={`${styles.legendSeat} ${styles.availableLegend}`}
              />
              Disponível
            </div>

            <div>
              <span
                className={`${styles.legendSeat} ${styles.selectedLegend}`}
              />
              Selecionado
            </div>

            <div>
              <span
                className={`${styles.legendSeat} ${styles.unavailableLegend}`}
              />
              Ocupado
            </div>
          </div>
        </div>

        <div className={styles.screenArea}>
          <div className={styles.screen}>
            TELA
          </div>

          <span>
            Frente da sala
          </span>
        </div>

        <div className={styles.seats}>
          {Array.from(
            new Set(seats.map((seat) => seat.row))
          ).map((row) => {
            const rowSeats = seats.filter(
              (seat) => seat.row === row
            );

            return (
              <div
                key={row}
                className={styles.seatRow}
              >
                <span className={styles.rowLabel}>
                  {row}
                </span>

                <div className={styles.rowSeats}>
                  {rowSeats.map((seat) => {
                    const isSelected =
                      selectedSeats.includes(seat.id);

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={!seat.available}
                        onClick={() =>
                          handleSeatClick(seat)
                        }
                        className={`
                          ${styles.seat}
                          ${
                            !seat.available
                              ? styles.unavailableSeat
                              : ""
                          }
                          ${
                            isSelected
                              ? styles.selectedSeat
                              : ""
                          }
                        `}
                        title={`${seat.row}${seat.number}`}
                      >
                        {seat.number}
                      </button>
                    );
                  })}
                </div>

                <span className={styles.rowLabel}>
                  {row}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.summary}>
        <div className={styles.summaryInfo}>
          <div>
            <span>Assentos</span>

            <strong>
              {selectedSeatObjects.length > 0
                ? selectedSeatObjects
                    .map(
                      (seat) =>
                        `${seat.row}${seat.number}`
                    )
                    .join(", ")
                : "Nenhum selecionado"}
            </strong>
          </div>

          <div>
            <span>Quantidade</span>
            <strong>
              {selectedSeats.length}
            </strong>
          </div>

          <div>
            <span>Total</span>
            <strong className={styles.total}>
              {formatPrice(totalPrice)}
            </strong>
          </div>
        </div>

        <button
          type="button"
          className={styles.continueButton}
          disabled={selectedSeats.length === 0 || reserving}
          onClick={handleContinue}
        >
          {reserving
            ? "Reservando..."
            : "Continuar para pagamento"}
        </button>
      </section>

      {message && (
        <p className={styles.message}>
          {message}
        </p>
      )}
    </main>
  );
}