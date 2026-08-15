"use client";

import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();

  const reservationId = params.id as string;

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <div className={styles.successIcon}>
          ✓
        </div>

        <span className={styles.status}>
          PAGAMENTO APROVADO
        </span>

        <h1>Compra realizada com sucesso!</h1>

        <p className={styles.description}>
          Seu pagamento foi aprovado e seus ingressos
          já foram gerados.
        </p>

        <button
          type="button"
          className={styles.ticketsButton}
          onClick={() =>
            router.push("/meus-ingressos")
          }
        >
          Ver meus ingressos
        </button>

        <button
          type="button"
          className={styles.homeButton}
          onClick={() => router.push("/")}
        >
          Voltar para o início
        </button>
      </section>
    </main>
  );
}