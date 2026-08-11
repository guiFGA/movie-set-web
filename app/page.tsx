"use client"

import { useEffect, useState } from "react";
import { getPopularMovies } from "./api/tmdb";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
}

export default function Home() {
  
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    async function fetchMovies(){
      const popular = await getPopularMovies();
      console.log("Filmes Populares: ", popular)
      setMovies(popular);
     
    }
    
    fetchMovies();
  }, []);

  return (
    <div>
      <h1>Filmes Populares</h1>
      <ul>
        {movies.map(movie => (
          <li key={movie.id}>
            <img
              src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`: "/fallback.png"}
              alt={movie.title}
            />
            <h2>{movie.title}</h2>
            <p>{movie.overview}</p>
            <p>{movie.vote_average}</p>
          </li>
        ))}
      </ul>
    </div>
  );
  

}
