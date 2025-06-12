// Function to handle Enter key press
function handleEnter(event) {
    if (event.key === 'Enter') {
        searchMovies();
    }
}

// Main search function
async function searchMovies() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const noResults = document.getElementById('noResults');
    const results = document.getElementById('results');
    const movieGrid = document.getElementById('movieGrid');

    // Check if something was entered
    const searchTerm = searchInput.value.trim();
    if (searchTerm === '') {
        showError('Please enter a movie or TV series name!');
        return;
    }

    // Prepare the interface
    searchBtn.disabled = true;
    loading.style.display = 'block';
    error.style.display = 'none';
    noResults.style.display = 'none';
    results.style.display = 'none';
    movieGrid.innerHTML = '';

    try {
        // Call API to search for movies and TV shows
        const movies = await fetchMoviesAndShows(searchTerm);
        
        if (movies.length > 0) {
            // Display results
            displayResults(movies);
            results.style.display = 'block';
        } else {
            // No results found
            noResults.innerHTML = `No movies or TV series found for "<strong>${searchTerm}</strong>".<br>Try again with another name!`;
            noResults.style.display = 'block';
        }

    } catch (err) {
        console.error('Error:', err);
        showError('Sorry! There was a problem. Please try again in a few seconds.');
    } finally {
        // Reset interface to normal
        loading.style.display = 'none';
        searchBtn.disabled = false;
    }
}

// Function to call the movies API
async function fetchMoviesAndShows(searchTerm) {
    const API_KEY = 'a07e22bc18f5cb106bfe4cc1f83ad8ed';
    const BASE_URL = 'https://api.themoviedb.org/3';
    
    let allResults = [];

    try {
        // Search for movies
        const movieUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchTerm)}&language=en-US`;
        const movieResponse = await fetch(movieUrl);
        const movieData = await movieResponse.json();
        
        if (movieData.results) {
            // Mark as movies and get detailed info
            const moviesWithDetails = await Promise.all(
                movieData.results.slice(0, 6).map(async (item) => {
                    const details = await getMovieDetails(item.id, 'movie');
                    return {
                        ...item,
                        ...details,
                        type: 'Movie'
                    };
                })
            );
            allResults.push(...moviesWithDetails);
        }

        // Search for TV series
        const tvUrl = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(searchTerm)}&language=en-US`;
        const tvResponse = await fetch(tvUrl);
        const tvData = await tvResponse.json();
        
        if (tvData.results) {
            // Mark as TV series and adapt property names
            const showsWithDetails = await Promise.all(
                tvData.results.slice(0, 6).map(async (item) => {
                    const details = await getMovieDetails(item.id, 'tv');
                    return {
                        ...item,
                        ...details,
                        type: 'TV Series',
                        title: item.name, // TV series use 'name' instead of 'title'
                        release_date: item.first_air_date
                    };
                })
            );
            allResults.push(...showsWithDetails);
        }

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }

    // Sort by popularity and keep the first 20
    return allResults
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 20);
}

// Function to get detailed information (genres and overview)
async function getMovieDetails(id, type) {
    const API_KEY = 'a07e22bc18f5cb106bfe4cc1f83ad8ed';
    const BASE_URL = 'https://api.themoviedb.org/3';
    
    try {
        const detailUrl = `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=en-US`;
        const response = await fetch(detailUrl);
        const data = await response.json();
        
        return {
            genres: data.genres || [],
            overview: data.overview || ''
        };
    } catch (error) {
        console.error('Error fetching details:', error);
        return {
            genres: [],
            overview: ''
        };
    }
}

// Function to display results
function displayResults(movies) {
    const movieGrid = document.getElementById('movieGrid');
    
    movies.forEach(movie => {
        // Create element for each movie/TV series
        const movieElement = document.createElement('div');
        movieElement.className = 'movie-item';
        
        // Poster URL (image)
        const posterUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : 'https://via.placeholder.com/500x750/667eea/white?text=No+Poster';

        // Release year
        const year = movie.release_date 
            ? new Date(movie.release_date).getFullYear() 
            : 'Unknown Year';

        // Genres
        const genres = movie.genres && movie.genres.length > 0
            ? movie.genres.slice(0, 3).map(genre => genre.name).join(', ')
            : 'Unknown Genre';

        // Overview (limited to 250 characters)
        const overview = movie.overview 
            ? (movie.overview.length > 250 ? movie.overview.substring(0, 250) + '...' : movie.overview)
            : 'No description available.';

        // Create HTML
        movieElement.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" />
            <div class="movie-title">${movie.title}</div>
            <div class="movie-year">${movie.type} • ${year}</div>
            <div class="movie-genres"> ${genres}</div>
            <div class="movie-overview">${overview}</div>
        `;
        
        movieGrid.appendChild(movieElement);
    });
}

// Function to display errors
function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.style.display = 'block';
}

// Auto focus on text input when page loads
window.onload = function() {
    document.getElementById('searchInput').focus();
};