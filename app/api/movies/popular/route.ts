import { NextResponse } from "next/server";
import { getPopularMovies } from "../../tmdb";


export async function GET() {

  try {
    const movies = await getPopularMovies();

    

    return NextResponse.json({
      movies,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Erro ao buscar filmes populares",
      },
      {
        status: 500,
      }
    );
  }
}