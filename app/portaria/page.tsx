"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

interface EventData {
  id: number;
  title: string;
  event_date: string;
  location: string;
  room: string;
}

type ValidationStatus =
  | "VALID"
  | "INVALID"
  | "ALREADY_USED"
  | "WRONG_EVENT";

interface ValidationResult {
  success: boolean;
  status: ValidationStatus;
  message?: string;
  error?: string;
  used_at?: string | null;

  ticket?: {
    id: number;
    code: string;
    used_at: string | null;
  };

  event?: {
    id: number;
    title: string;
    location: string;
    room: string;
  };
}

export default function GatePage() {
  const router = useRouter();

  const [events, setEvents] = useState<EventData[]>([]);
  const [eventId, setEventId] = useState("");

  const [code, setCode] = useState("");

  const [loadingEvents, setLoadingEvents] =
    useState(true);

  const [validating, setValidating] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [result, setResult] =
    useState<ValidationResult | null>(null);

  /*
    ================================
    CARREGAR EVENTOS
    ================================
  */

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoadingEvents(true);

        const response = await fetch(
          "/api/events",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(
            data.error ||
              "Não foi possível carregar as sessões."
          );

          return;
        }

        setEvents(data.events ?? []);
      } catch (error) {
        console.error(
          "Erro ao carregar sessões:",
          error
        );

        setMessage(
          "Erro ao carregar as sessões."
        );
      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, []);

  /*
    ================================
    VALIDAR CÓDIGO MANUAL
    ================================
  */

  async function handleManualValidation() {
    if (!eventId) {
      setMessage(
        "Selecione uma sessão antes de validar."
      );

      return;
    }

    if (!code.trim()) {
      setMessage(
        "Digite o código do ingresso."
      );

      return;
    }

    try {
      setValidating(true);
      setMessage("");
      setResult(null);

      const response = await fetch(
        "/api/gate/validate",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            event_id: Number(eventId),
            code: code
              .trim()
              .toUpperCase(),
          }),
        }
      );

      const data =
        await response.json();

      setResult(data);

      /*
        Não usamos !response.ok aqui
        para esconder o resultado,
        porque WRONG_EVENT e
        ALREADY_USED podem retornar
        HTTP 409 e ainda queremos
        mostrar o status na tela.
      */

      if (!data.status) {
        setMessage(
          data.error ||
            "Não foi possível validar o ingresso."
        );
      }

      if (data.status === "VALID") {
        setCode("");
      }
    } catch (error) {
      console.error(
        "Erro ao validar ingresso:",
        error
      );

      setMessage(
        "Erro ao validar ingresso."
      );
    } finally {
      setValidating(false);
    }
  }

  /*
    ================================
    FORMATAÇÃO
    ================================
  */

  function formatDate(date: string) {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ).format(new Date(date));
  }

  function formatTime(date: string) {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date(date));
  }

  function getResultTitle(
    status: ValidationStatus
  ) {
    switch (status) {
      case "VALID":
        return "Ingresso válido";

      case "INVALID":
        return "Ingresso inválido";

      case "ALREADY_USED":
        return "Ingresso já utilizado";

      case "WRONG_EVENT":
        return "Evento incorreto";
    }
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <span>CONTROLE DE ACESSO</span>

        <h1>Portaria</h1>

        <p>
          Valide os ingressos da sessão
          selecionada.
        </p>
      </header>

      <section className={styles.content}>
        {/* SELEÇÃO DA SESSÃO */}

        <div className={styles.validationCard}>
          <span className={styles.label}>
            1. SELECIONE A SESSÃO
          </span>

          <h2>Sessão atual</h2>

          {loadingEvents ? (
            <p className={styles.loading}>
              Carregando sessões...
            </p>
          ) : (
            <select
              className={styles.select}
              value={eventId}
              onChange={(e) => {
                setEventId(
                  e.target.value
                );

                setResult(null);
                setMessage("");
              }}
            >
              <option value="">
                Selecione uma sessão
              </option>

              {events.map((event) => (
                <option
                  key={event.id}
                  value={event.id}
                >
                  {event.title} -{" "}
                  {formatDate(
                    event.event_date
                  )}{" "}
                  {formatTime(
                    event.event_date
                  )}
                </option>
              ))}
            </select>
          )}

          {eventId && (
            <div className={styles.selectedEvent}>
              {(() => {
                const selected =
                  events.find(
                    (event) =>
                      event.id ===
                      Number(eventId)
                  );

                if (!selected) {
                  return null;
                }

                return (
                  <>
                    <strong>
                      {selected.title}
                    </strong>

                    <span>
                      {selected.location}
                      {" • "}
                      {selected.room}
                    </span>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* VALIDAÇÃO */}

        <div className={styles.validationCard}>
          <span className={styles.label}>
            2. VALIDAR INGRESSO
          </span>

          <h2>Código manual</h2>

          <p className={styles.description}>
            Digite o código exibido no
            ingresso do cliente.
          </p>

          <input
            type="text"
            className={styles.input}
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value.toUpperCase()
              )
            }
            placeholder="Ex: A31F72B90C12"
            disabled={validating}
          />

          <button
            type="button"
            className={styles.validateButton}
            disabled={
              validating ||
              !eventId ||
              !code.trim()
            }
            onClick={
              handleManualValidation
            }
          >
            {validating
              ? "Validando..."
              : "Validar ingresso"}
          </button>

          <div className={styles.qrDivider}>
            <span>OU</span>
          </div>

          <button
            type="button"
            className={styles.cameraButton}
            disabled={!eventId}
            onClick={() =>
              router.push(
                `/portaria/scan?event=${eventId}`
              )
            }
          >
            Ler QR Code pela câmera
          </button>
        </div>
      </section>

      {/* RESULTADO */}

      {result && result.status && (
        <section
          className={`${styles.resultCard} ${
            result.status === "VALID"
              ? styles.valid
              : result.status ===
                  "ALREADY_USED"
                ? styles.used
                : result.status ===
                    "WRONG_EVENT"
                  ? styles.wrongEvent
                  : styles.invalid
          }`}
        >
          <span className={styles.resultStatus}>
            {result.status}
          </span>

          <h2>
            {getResultTitle(
              result.status
            )}
          </h2>

          <p>
            {result.message ||
              result.error}
          </p>

          {result.ticket && (
            <div className={styles.resultDetails}>
              <div>
                <span>Código</span>

                <strong>
                  {result.ticket.code}
                </strong>
              </div>

              {result.ticket.used_at && (
                <div>
                  <span>
                    Validado em
                  </span>

                  <strong>
                    {new Date(
                      result.ticket.used_at
                    ).toLocaleString(
                      "pt-BR"
                    )}
                  </strong>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}
    </main>
  );
}