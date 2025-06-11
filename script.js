        // Fonction pour chercher quand on appuie sur Entrée
        function handleEnter(event) {
            if (event.key === 'Enter') {
                searchMovies();
            }
        }

        // Fonction principale de recherche
        async function searchMovies() {
            const searchInput = document.getElementById('searchInput');
            const searchBtn = document.getElementById('searchBtn');
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            const noResults = document.getElementById('noResults');
            const results = document.getElementById('results');
            const movieGrid = document.getElementById('movieGrid');

            // Vérifier si on a tapé quelque chose
            const searchTerm = searchInput.value.trim();
            if (searchTerm === '') {
                showError('Veuillez taper le nom d\'un film ou d\'une série !');
                return;
            }

            // Préparer l'interface
            searchBtn.disabled = true;
            loading.style.display = 'block';
            error.style.display = 'none';
            noResults.style.display = 'none';
            results.style.display = 'none';
            movieGrid.innerHTML = '';

            try {
                // Appeler l'API pour chercher des films et séries
                const movies = await fetchMoviesAndShows(searchTerm);
                
                if (movies.length > 0) {
                    // Afficher les résultats
                    displayResults(movies);
                    results.style.display = 'block';
                } else {
                    // Aucun résultat trouvé
                    noResults.innerHTML = `Aucun film ou série trouvé pour "<strong>${searchTerm}</strong>".<br>Essayez avec un autre nom !`;
                    noResults.style.display = 'block';
                }

            } catch (err) {
                console.error('Erreur:', err);
                showError('Oops ! Il y a eu un problème. Essayez encore dans quelques secondes.');
            } finally {
                // Remettre l'interface normale
                loading.style.display = 'none';
                searchBtn.disabled = false;
            }
        }

        // Fonction pour appeler l'API de films
        async function fetchMoviesAndShows(searchTerm) {
            const API_KEY = 'a07e22bc18f5cb106bfe4cc1f83ad8ed';
            const BASE_URL = 'https://api.themoviedb.org/3';
            
            let allResults = [];

            try {
                // Chercher des films
                const movieUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchTerm)}&language=fr-FR`;
                const movieResponse = await fetch(movieUrl);
                const movieData = await movieResponse.json();
                
                if (movieData.results) {
                    // Marquer comme films
                    const movies = movieData.results.map(item => ({...item, type: 'Film'}));
                    allResults.push(...movies);
                }

                // Chercher des séries TV
                const tvUrl = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(searchTerm)}&language=fr-FR`;
                const tvResponse = await fetch(tvUrl);
                const tvData = await tvResponse.json();
                
                if (tvData.results) {
                    // Marquer comme séries et adapter les noms de propriétés
                    const shows = tvData.results.map(item => ({
                        ...item,
                        type: 'Série',
                        title: item.name, // Les séries utilisent 'name' au lieu de 'title'
                        release_date: item.first_air_date
                    }));
                    allResults.push(...shows);
                }

            } catch (error) {
                console.error('Erreur API:', error);
                throw error;
            }

            // Trier par popularité et garder les 12 premiers
            return allResults
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                .slice(0, 12);
        }
        // Fonction pour afficher les résultats
        function displayResults(movies) {
            const movieGrid = document.getElementById('movieGrid');
            
            movies.forEach(movie => {
                // Créer l'élément pour chaque film/série
                const movieElement = document.createElement('div');
                movieElement.className = 'movie-item';
                
                // URL de l'affiche (image)
                const posterUrl = movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : 'https://via.placeholder.com/500x750/667eea/white?text=Pas+d\'affiche';

                // Année de sortie
                const year = movie.release_date 
                    ? new Date(movie.release_date).getFullYear() 
                    : 'Année inconnue';

                // Note (sur 10)
                const rating = movie.vote_average 
                    ? movie.vote_average.toFixed(1) + '/10'
                    : 'Pas de note';

                // Créer le HTML
                movieElement.innerHTML = `
                    <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" />
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-year">${movie.type} • ${year}</div>
                    <div class="movie-rating">⭐ ${rating}</div>
                `;
                
                movieGrid.appendChild(movieElement);
            });
        }

        // Fonction pour afficher les erreurs
        function showError(message) {
            const error = document.getElementById('error');
            error.textContent = message;
            error.style.display = 'block';
        }

        // Focus automatique sur la zone de texte quand la page se charge
        window.onload = function() {
            document.getElementById('searchInput').focus();
        };