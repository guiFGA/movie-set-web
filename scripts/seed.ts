import bcrypt from "bcryptjs";

import { sequelize } from "../app/api/db";

import {
  User,
  UserRole,
} from "../app/models/User";

import {
  Event,
  EventStatus,
} from "../app/models/Event";

import { Seat } from "../app/models/Seat";

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
}

async function getSeedMovie(): Promise<TmdbMovie> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "TMDB_API_KEY não configurada."
    );
  }

  const response = await fetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-BR`
  );

  if (!response.ok) {
    const error = await response.text();

    console.error(
      "Erro retornado pelo TMDb:",
      error
    );

    throw new Error(
      `Erro ao buscar filme no TMDb. Status: ${response.status}`
    );
  }

  const data = await response.json();

  if (
    !data.results ||
    data.results.length === 0
  ) {
    throw new Error(
      "Nenhum filme encontrado no TMDb."
    );
  }

  return data.results[0];
}

async function seed() {
  try {
    console.log(
      "Iniciando seed..."
    );

    await sequelize.authenticate();

    console.log(
      "Banco conectado com sucesso."
    );

    const passwordHash =
      await bcrypt.hash(
        "12345678",
        10
      );

    // ==========================
    // ORGANIZADOR
    // ==========================

    const [organizer] =
      await User.findOrCreate({
        where: {
          email:
            "organizer@movieset.com",
        },

        defaults: {
          name:
            "Organizador Teste",

          email:
            "organizer@movieset.com",

          password_hash:
            passwordHash,

          role:
            UserRole.ORGANIZER,
        },
      });

    console.log(
      "Organizador pronto."
    );

    // ==========================
    // CLIENTE 1
    // ==========================

    await User.findOrCreate({
      where: {
        email:
          "cliente1@movieset.com",
      },

      defaults: {
        name: "Cliente Um",

        email:
          "cliente1@movieset.com",

        password_hash:
          passwordHash,

        role:
          UserRole.CUSTOMER,
      },
    });

    console.log(
      "Cliente 1 pronto."
    );

    // ==========================
    // CLIENTE 2
    // ==========================

    await User.findOrCreate({
      where: {
        email:
          "cliente2@movieset.com",
      },

      defaults: {
        name: "Cliente Dois",

        email:
          "cliente2@movieset.com",

        password_hash:
          passwordHash,

        role:
          UserRole.CUSTOMER,
      },
    });

    console.log(
      "Cliente 2 pronto."
    );

    // ==========================
    // PORTARIA
    // ==========================

    await User.findOrCreate({
      where: {
        email:
          "portaria@movieset.com",
      },

      defaults: {
        name:
          "Portaria Teste",

        email:
          "portaria@movieset.com",

        password_hash:
          passwordHash,

        role:
          UserRole.GATE,
      },
    });

    console.log(
      "Usuário de portaria pronto."
    );

    // ==========================
    // FILME TMDB
    // ==========================

    console.log(
      "Buscando filme no TMDb..."
    );

    const movie =
      await getSeedMovie();

    console.log(
      `Filme selecionado: ${movie.title}`
    );

    // ==========================
    // EVENTO
    // ==========================

    const eventDate =
      new Date();

    // Evento daqui a 7 dias
    eventDate.setDate(
      eventDate.getDate() + 7
    );

    // Horário 20:00
    eventDate.setHours(
      20,
      0,
      0,
      0
    );

    const [event, eventCreated] =
      await Event.findOrCreate({
        where: {
          organizer_id:
            organizer.id,

          tmdb_id:
            movie.id,
        },

        defaults: {
          organizer_id:
            organizer.id,

          tmdb_id:
            movie.id,

          title:
            movie.title,

          description:
            movie.overview ||
            "Evento criado automaticamente para avaliação do desafio.",

          poster_url:
            movie.poster_path,

          event_date:
            eventDate,

          location:
            "Shopping Taguatinga",

          room:
            "Sala 1",

          capacity:
            50,

          price:
            "30.00",

          status:
            EventStatus.PUBLISHED,
        },
      });

    // ==========================
    // ASSENTOS
    // ==========================

    if (eventCreated) {
      console.log(
        "Evento criado. Gerando assentos..."
      );

      const seats = [];

      const seatsPerRow = 10;

      for (
        let i = 0;
        i < event.capacity;
        i++
      ) {
        const rowIndex =
          Math.floor(
            i / seatsPerRow
          );

        const row =
          String.fromCharCode(
            65 + rowIndex
          );

        const number =
          (i % seatsPerRow) + 1;

        seats.push({
          event_id:
            event.id,

          row,

          number,
        });
      }

      await Seat.bulkCreate(
        seats
      );

      console.log(
        `${seats.length} assentos criados.`
      );
    } else {
      console.log(
        "Evento já existe. Nenhum novo evento foi criado."
      );

      /*
       * Segurança extra:
       * caso o evento exista,
       * mas esteja sem assentos.
       */

      const existingSeats =
        await Seat.count({
          where: {
            event_id:
              event.id,
          },
        });

      if (existingSeats === 0) {
        console.log(
          "Evento sem assentos. Gerando assentos..."
        );

        const seats = [];

        const seatsPerRow =
          10;

        for (
          let i = 0;
          i < event.capacity;
          i++
        ) {
          const rowIndex =
            Math.floor(
              i /
                seatsPerRow
            );

          const row =
            String.fromCharCode(
              65 +
                rowIndex
            );

          const number =
            (i %
              seatsPerRow) +
            1;

          seats.push({
            event_id:
              event.id,

            row,

            number,
          });
        }

        await Seat.bulkCreate(
          seats
        );

        console.log(
          `${seats.length} assentos criados.`
        );
      }
    }

    // ==========================
    // RESULTADO
    // ==========================

    console.log("");
    console.log(
      "=============================="
    );

    console.log(
      "SEED CONCLUÍDA COM SUCESSO"
    );

    console.log(
      "=============================="
    );

    console.log("");

    console.log(
      "Usuários para avaliação:"
    );

    console.log("");

    console.log(
      "ORGANIZADOR"
    );

    console.log(
      "E-mail: organizer@movieset.com"
    );

    console.log(
      "Senha: 12345678"
    );

    console.log("");

    console.log(
      "CLIENTE 1"
    );

    console.log(
      "E-mail: cliente1@movieset.com"
    );

    console.log(
      "Senha: 12345678"
    );

    console.log("");

    console.log(
      "CLIENTE 2"
    );

    console.log(
      "E-mail: cliente2@movieset.com"
    );

    console.log(
      "Senha: 12345678"
    );

    console.log("");

    console.log(
      "PORTARIA"
    );

    console.log(
      "E-mail: portaria@movieset.com"
    );

    console.log(
      "Senha: 12345678"
    );

    console.log("");

    console.log(
      "Evento:"
    );

    console.log(
      `${event.title} - ID ${event.id}`
    );

    console.log("");

    await sequelize.close();

    process.exit(0);
  } catch (error) {
    console.error(
      "Erro ao executar seed:",
      error
    );

    await sequelize.close();

    process.exit(1);
  }
}

seed();