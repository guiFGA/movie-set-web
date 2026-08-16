"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import styles from "./page.module.css";

interface Seat {
  id: number;
  row: string;
  number: number;
}

interface EventData {
  id: number;
  title: string;
  poster_url: string | null;
  event_date: string;
  location: string;
  room: string;
  price: string;
}

interface ReservationData {
  id: number;
  status: string;
  total_price: string;
  event: EventData;
  seats: Seat[];
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [reservation, setReservation] =
    useState<ReservationData | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadReservation() {
      try {
        setLoading(true);
        setMessage("");

        const response = await fetch(
          `/api/reservation/${id}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(
            data.error ||
              "Não foi possível carregar a reserva."
          );

          return;
        }

        setReservation(data.reservation);
      } catch (error) {
        console.error(
          "Erro ao carregar reserva:",
          error
        );

        setMessage(
          "Erro ao carregar os dados da reserva."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadReservation();
    }
  }, [id]);

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

  function formatPrice(value: string | number) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function handlePayment(
    result: "APPROVED" | "DECLINED"
  ) {
    if (!reservation) {
      return;
    }

    try {
      setProcessing(true);
      setMessage("");

      /*
        Essa rota ainda vamos criar
        no próximo passo.
      */

      const response = await fetch(
        `/api/payment/${reservation.id}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            result,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Não foi possível processar o pagamento."
        );

        return;
      }

      if (result === "APPROVED") {
        router.push(
          `/pagamento/sucesso/${reservation.id}`
        );
      } else {
        setMessage("Pagamento recusado, você será redirecionado...");
        await sleep(4000);
        router.push(`/eventos-disponiveis`);;
      }
    } catch (error) {
      console.error(
        "Erro ao processar pagamento:",
        error
      );

      setMessage(
        "Ocorreu um erro ao processar o pagamento."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.container}>
        <p className={styles.loading}>
          Carregando pagamento...
        </p>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main className={styles.container}>
        <div className={styles.error}>
          <h1>Reserva não encontrada</h1>

          <p>
            {message ||
              "Não foi possível localizar essa reserva."}
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
      <div className={styles.header}>
        <span>FINALIZAÇÃO DA COMPRA</span>
        <h1>Pagamento</h1>

        <p>
          Confira os dados da sua reserva antes de
          finalizar.
        </p>
      </div>

      <div className={styles.content}>
        {/* RESUMO DA RESERVA */}

        <section className={styles.reservationCard}>
          <div className={styles.movie}>
            <div className={styles.poster}>
              {reservation.event.poster_url ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${reservation.event.poster_url}`}
                  alt={reservation.event.title}
                />
              ) : (
                <div className={styles.noPoster}>
                  Sem imagem
                </div>
              )}
            </div>

            <div className={styles.movieInfo}>
              <span>SUA SESSÃO</span>

              <h2>
                {reservation.event.title}
              </h2>

              <div className={styles.sessionData}>
                <div>
                  <span>Data</span>

                  <strong>
                    {formatDate(
                      reservation.event.event_date
                    )}
                  </strong>
                </div>

                <div>
                  <span>Horário</span>

                  <strong>
                    {formatTime(
                      reservation.event.event_date
                    )}
                  </strong>
                </div>

                <div>
                  <span>Local</span>

                  <strong>
                    {reservation.event.location}
                  </strong>
                </div>

                <div>
                  <span>Sala</span>

                  <strong>
                    {reservation.event.room}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.purchaseDetails}>
            <div>
              <span>Assentos</span>

              <strong>
                {reservation.seats
                  .map(
                    (seat) =>
                      `${seat.row}${seat.number}`
                  )
                  .join(", ")}
              </strong>
            </div>

            <div>
              <span>Quantidade</span>

              <strong>
                {reservation.seats.length}
              </strong>
            </div>

            <div>
              <span>Valor unitário</span>

              <strong>
                {formatPrice(
                  reservation.event.price
                )}
              </strong>
            </div>
          </div>

          <div className={styles.totalArea}>
            <span>Total</span>

            <strong>
              {formatPrice(
                reservation.total_price
              )}
            </strong>
          </div>
        </section>

        {/* PAGAMENTO */}

        <section className={styles.paymentCard}>
          <span className={styles.smallTitle}>
            PAGAMENTO SIMULADO
          </span>

          <h2>Finalizar compra</h2>


          <div className={styles.fakeCard}>
            <span>MOVIE SET</span>

            <div className={styles.cardNumber}>
              •••• •••• •••• 2026
            </div>

            <div className={styles.cardBottom}>
              <div>
                <small>TITULAR</small>
                <strong>CLIENTE</strong>
              </div>

              <div>
                <small>VALIDADE</small>
                <strong>12/30</strong>
              </div>
            </div>
          </div>

          <div className={styles.paymentTotal}>
            <span>Valor da compra</span>

            <strong>
              {formatPrice(
                reservation.total_price
              )}
            </strong>
          </div>

          <button
            type="button"
            className={styles.approveButton}
            disabled={processing}
            onClick={() =>
              handlePayment("APPROVED")
            }
          >
            {processing
              ? "Processando..."
              : "Aprovar pagamento"}
          </button>

          <button
            type="button"
            className={styles.declineButton}
            disabled={processing}
            onClick={() =>
              handlePayment("DECLINED")
            }
          >
            Recusar pagamento
          </button>

          <p className={styles.simulationWarning}>
            Esta tela representa apenas uma
            simulação de pagamento.
          </p>
        </section>
      </div>

      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}
    </main>
  );
}