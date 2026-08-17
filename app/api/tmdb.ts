const BASE_URL = "https://api.themoviedb.org/3";

export async function getPopularMovies(){
    const API_KEY = process.env.TMDB_API_KEY;
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR`);
    const data = await res.json();
    return data.results;
}


//API para fazer pesquisa de filmes 
export async function searchMovies(query: string) {
  const API_KEY = process.env.TMDB_API_KEY;
  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`
  );

  const data = await response.json();

  return data.results;
}