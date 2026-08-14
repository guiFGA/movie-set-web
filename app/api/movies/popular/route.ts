import { NextResponse } from "next/server";
import { getPopularMovies } from "../../tmdb";
import { connectDatabase } from "../../db";

export async function GET() {
  connectDatabase();

    
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