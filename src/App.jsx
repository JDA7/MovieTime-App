import { useState, useEffect } from "react";
import { useDebounce } from "react-use";
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { getTrendingMovies, updateSearchCount } from "./appwrite.js";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: "GET",
    headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_KEY}`,
    },
};

const App = () => {
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [movieList, setMovieList] = useState([]);
    const [errorMesage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [trendingMovies, setTrendingMovies] = useState([]);

    // Debounce the search term by delaying the API call for 750ms (assumption being that is the time until the user stops typing)
    useDebounce(() => setDebouncedSearchTerm(searchTerm), 750, [searchTerm]);

    const fetchMovies = async (query = "") => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
                      query
                  )}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();

            if (data.response === "False") {
                setErrorMessage(data.error || "Error fetching movies");
                setMovieList([]);
                return;
            }

            setMovieList(data.results);

            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }
        } catch (error) {
            console.log(`Error fetching movies: ${error}`);
            setErrorMessage("Error fetching movies. Please try againe later.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies();
            setTrendingMovies(movies);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (
        <main>
            <div className="pattern" />
            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero Banner" />
                    <h1>
                        Find <span className="text-gradient">Movies</span>{" "}
                        You&apos;ll Enjoy Without the Hassle
                    </h1>
                    <Search
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                </header>
                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img
                                        src={movie.poster_url}
                                        alt={movie.title}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <section className="all-movies">
                    <h2>All Movies</h2>
                    {isLoading ? (
                        <Spinner />
                    ) : errorMesage ? (
                        <p className="text-red-500">{errorMesage}</p>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
};
export default App;
