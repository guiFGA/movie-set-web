import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "../../tmdb";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        {
          error: "Informe um filme para pesquisar",
        },
        {
          status: 400,
        }
      );
    }

    const movies = await searchMovies(query);

    return NextResponse.json({
      movies,
    });
  } catch (error) {
    console.error("Erro na busca TMDb:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar filmes",
      },
      {
        status: 500,
      }
    );
  }
}