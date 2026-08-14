"use client";

import { useEffect, useState } from "react";
import "./criar-eventos.css";
import { useRouter } from "next/navigation";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
}

export default function CreateEventPage() {
  const [search, setSearch] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");

  const [location, setLocation] = useState("");
  const [room, setRoom] = useState("");
  const [capacity, setCapacity] = useState("");

  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const router = useRouter();

  // =========================
  // BUSCA DINÂMICA DE FILMES
  // =========================

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = search.trim();

      if (query.length < 2) {
        setMovies([]);
        setSearching(false);
        return;
      }

      try {
        setSearching(true);
        setMessage("");

        const res = await fetch(
          `/api/movies/search?query=${encodeURIComponent(query)}`
        );

        const data = await res.json();

        if (!res.ok) {
          setMovies([]);
          setMessage(data.error || "Erro ao buscar filmes.");
          return;
        }

        setMovies(data.movies ?? []);
      } catch (error) {
        console.error("Erro ao buscar filmes:", error);

        setMovies([]);
        setMessage("Erro ao buscar filmes.");
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // =========================
  // CRIAR EVENTO
  // =========================

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedMovie) {
      setMessage("Selecione um filme.");
      return;
    }

    if (
      !date ||
      !time ||
      !price ||
      !location ||
      !room ||
      !capacity
    ) {
      setMessage("Preencha todos os dados da sessão.");
      return;
    }

    if (Number(price) < 0) {
      setMessage("O preço não pode ser negativo.");
      return;
    }

    if (Number(capacity) <= 0) {
      setMessage("A capacidade deve ser maior que zero.");
      return;
    }

    try {
      setCreating(true);
      setMessage("");

      const res = await fetch("/api/events", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          tmdb_id: selectedMovie.id,
          title: selectedMovie.title,
          description: selectedMovie.overview,
          poster_url: selectedMovie.poster_path,

          date,
          time,

          price,

          location,
          room,
          capacity: Number(capacity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Erro ao criar sessão.");
        return;
      }

      if (data.success) {
        setMessage("Sessão criada com sucesso!");

        setSearch("");
        setMovies([]);
        setSelectedMovie(null);

        setDate("");
        setTime("");
        setPrice("");

        setLocation("");
        setRoom("");
        setCapacity("");
        
        setTimeout(() => {
          router.push("/eventos-disponiveis");
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao criar sessão:", error);

      setMessage("Erro inesperado ao criar sessão.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="create-event-container">

      {/* CABEÇALHO */}

      <div className="create-event-header">
        <h1>Criar nova sessão</h1>

        <p>
          Pesquise um filme e configure os dados da sessão.
        </p>
      </div>

      {/* BUSCA DE FILMES */}

      <section className="movie-search-section">

        <label>Pesquisar filme</label>

        <div className="search-box">
          <input
            type="text"
            placeholder="Digite o nome do filme..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);

              // Se alterar a pesquisa depois de selecionar
              // um filme, remove a seleção anterior.
              if (selectedMovie) {
                setSelectedMovie(null);
              }
            }}
          />
        </div>

        {searching && (
          <p className="search-status">
            Buscando filmes...
          </p>
        )}

      </section>

      {/* RESULTADOS DA BUSCA */}

      {movies.length > 0 && !selectedMovie && (
        <section className="movie-results">

          <h2>Resultados</h2>

          <div className="movie-grid">

            {movies.map((movie) => (
              <button
                type="button"
                key={movie.id}
                className="movie-card"
                onClick={() => {
                  setSelectedMovie(movie);
                  setMovies([]);
                  setSearch(movie.title);
                  setMessage("");
                }}
              >

                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                    alt={movie.title}
                  />
                ) : (
                  <div className="no-poster">
                    Sem imagem
                  </div>
                )}

                <div className="movie-info">

                  <strong>
                    {movie.title}
                  </strong>

                  {movie.release_date && (
                    <span>
                      {movie.release_date.substring(0, 4)}
                    </span>
                  )}

                </div>

              </button>
            ))}

          </div>

        </section>
      )}

      {/* FILME SELECIONADO + FORMULÁRIO */}

      {selectedMovie && (
        <section className="session-section">

          <h2>Dados da sessão</h2>

          <div className="selected-movie">

            {selectedMovie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w185${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
              />
            ) : (
              <div className="selected-no-poster">
                Sem imagem
              </div>
            )}

            <div>
              <span>Filme selecionado</span>

              <h3>
                {selectedMovie.title}
              </h3>

              <p>
                {selectedMovie.overview ||
                  "Sinopse não disponível."}
              </p>

              <button
                type="button"
                className="change-movie-button"
                onClick={() => {
                  setSelectedMovie(null);
                  setSearch("");
                  setMovies([]);
                }}
              >
                Escolher outro filme
              </button>
            </div>

          </div>

          <form
            className="session-form"
            onSubmit={handleCreateEvent}
          >

            {/* DATA */}

            <div className="form-group">
              <label>Data</label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* HORÁRIO */}

            <div className="form-group">
              <label>Horário</label>

              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>

            {/* PREÇO */}

            <div className="form-group">
              <label>Preço do ingresso</label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 35.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            {/* LOCAL */}

            <div className="form-group">
              <label>Local</label>

              <input
                type="text"
                placeholder="Ex: Shopping Taguatinga"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            {/* SALA */}

            <div className="form-group">
              <label>Sala</label>

              <input
                type="text"
                placeholder="Ex: Sala 3"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                required
              />
            </div>

            {/* CAPACIDADE */}

            <div className="form-group">
              <label>Capacidade da sala</label>

              <input
                type="number"
                min="1"
                placeholder="Ex: 60"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>

            {/* BOTÃO */}

            <button
              className="create-button"
              type="submit"
              disabled={creating}
            >
              {creating
                ? "Criando sessão..."
                : "Criar sessão"}
            </button>

          </form>

        </section>
      )}

      {message && (
        <p className="event-message">
          {message}
        </p>
      )}

    </main>
  );
}