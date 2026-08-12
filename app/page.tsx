"use client"

import { useEffect, useState } from "react";
import { getPopularMovies, searchMovies } from "./api/tmdb";


import styles from './page.module.css';


interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
}

export default function Home() {
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchMovies(){
      const popular = await getPopularMovies();
      console.log("Filmes Populares: ", popular)
      setMovies(popular);
     
    }
    
    fetchMovies();
  }, []);

  useEffect(() => {
  const timer = setTimeout(async () => {
    if (!search.trim()) {
      const popular = await getPopularMovies();
      setMovies(popular);
      return;
    }

    const results = await searchMovies(search);
    setMovies(results);
  }, 500);

  return () => clearTimeout(timer);
}, [search]);

  return (
    <div className={styles.container}>
      
      <header className={styles.header}>

        <h1 className={styles.title}>
           {search.trim()
            ? `Titulos Semelhantes`
            : "Filmes Populares"}
        </h1>
        <input className={styles.searchInput}
          type="text"
          placeholder="Pesquisar filmes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
      </header>

      <div className={styles.grid}>
        {movies.map((movie) => (
          <div key={movie.id} className={styles.card}>
          
            <img className={styles.poster} src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : "/fallback.png"}/>
            
            <div className={styles.content}>
              <h2 className={styles.movieTitle}>
                {movie.title}
              </h2>

              <p className={styles.rating}>
                ⭐ {movie.vote_average.toFixed(1)}
              </p>

              <p className={styles.overview}>
                {movie.overview}
              </p>
              
            </div>
           
          </div>
        ))}
      </div>
    </div>
  );
}


