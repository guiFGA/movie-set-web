"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

import styles from "./page.module.css";



interface ScannerContentProps {
  eventId: string | null;
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
}

export default function ScannerContent({
  eventId,
}: ScannerContentProps) {
  const router = useRouter();
  const processingRef = useRef(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [scanning, setScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] =
    useState<ValidationResult | null>(null);

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!eventId) {
      setMessage("Nenhuma sessão foi selecionada.");
      return;
    }

    startScanner();

    return () => {
      stopScanner();
    };
  }, [eventId]);

  async function startScanner() {
    try {
      setMessage("");

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        setMessage(
          "Nenhuma câmera foi encontrada neste dispositivo."
        );
        return;
      }

      const selectedCamera =
        cameras[cameras.length - 1];

      const scanner =
        new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;

      await scanner.start(
        selectedCamera.id,
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          await handleQrRead(decodedText);
        },
        () => {}
      );

      setScanning(true);
    } catch (error) {
      console.error(
        "Erro ao iniciar câmera:",
        error
      );

      setMessage(
        "Não foi possível acessar a câmera."
      );
    }
  }

  async function stopScanner() {
    try {
      const scanner = scannerRef.current;

      if (scanner && scanner.isScanning) {
        await scanner.stop();
      }

      scannerRef.current = null;
      setScanning(false);
    } catch (error) {
      console.error(
        "Erro ao parar câmera:",
        error
      );
      scannerRef.current = null;
      setScanning(false);
    }
  }

  async function handleQrRead(
    decodedText: string
  ) {
    if (processingRef.current){
      return;
    }
    processingRef.current = true;

    try {
      setValidating(true);

      const token =
        extractToken(decodedText);

      if (!token) {
        await stopScanner();

        setResult({
          success: false,
          status: "INVALID",
          message:
            "QR Code não pertence a um ingresso válido.",
        });

        return;
      }

      await stopScanner();

      const response = await fetch(
        "/api/gate/validate",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            event_id: Number(eventId),
            token,
          }),
        }
      );

      const data = await response.json();

      setResult(data);
    } catch (error) {
      console.error(
        "Erro ao validar QR:",
        error
      );

      setResult({
        success: false,
        status: "INVALID",
        message:
          "Erro ao validar ingresso.",
      });
    } finally {
      setValidating(false);
    }
  }

  function extractToken(
    decodedText: string
  ): string | null {
    try {
      const url = new URL(decodedText);

      const parts =
        url.pathname.split("/");

      if (
        parts.length >= 3 &&
        parts[1] === "ingresso"
      ) {
        return parts[2];
      }

      return null;
    } catch {
      if (
        decodedText.length >= 32 &&
        !decodedText.includes("/")
      ) {
        return decodedText.trim();
      }

      return null;
    }
  }

  async function handleScanAgain() {
    setResult(null);
    setMessage("");

    processingRef.current = false;
    await startScanner();
  }

 
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <span>CONTROLE DE ACESSO</span>

        <h1>Leitura de QR Code</h1>

        <p>
          Posicione o QR Code do ingresso dentro
          da área da câmera.
        </p>
      </header>

      <section className={styles.scannerCard}>
        {!result && (
          <>
            <div
              id="qr-reader"
              className={styles.reader}
            />

            <div className={styles.status}>
              {validating
                ? "Validando ingresso..."
                : scanning
                  ? "Aguardando QR Code..."
                  : "Iniciando câmera..."}
            </div>
          </>
        )}

        {result && (
          <div
            className={`${styles.result} ${
              result.status === "VALID"
                ? styles.valid
                : result.status ===
                    "ALREADY_USED"
                  ? styles.used
                  : result.status ===
                      "WRONG_EVENT"
                    ? styles.wrong
                    : styles.invalid
            }`}
          >
            <span>{result.status}</span>

            <h2>
              {result.status === "VALID" &&
                "Ingresso válido"}

              {result.status === "INVALID" &&
                "Ingresso inválido"}

              {result.status ===
                "ALREADY_USED" &&
                "Ingresso já utilizado"}

              {result.status ===
                "WRONG_EVENT" &&
                "Evento incorreto"}
            </h2>

            <p>
              {result.message ||
                result.error}
            </p>

            <button
              type="button"
              onClick={handleScanAgain}
            >
              Ler próximo ingresso
            </button>
          </div>
        )}
      </section>

      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}

      <button
        type="button"
        className={styles.backButton}
        onClick={() =>
          router.push("/portaria")
        }
      >
        Voltar para portaria
      </button>
    </main>
  );
}