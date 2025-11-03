// --- Global State ---
const API_BASE = "http://localhost:5000";
let CURRENT_USER = null; // { userId, username, token, role }
let SELECTED_SEATS = []; // Array of { seatId, price, category, label }
let CURRENT_SHOW_ID = null;
let ALL_SEATS_DATA = []; // Store all seat data with prices

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authButton = document.getElementById('auth-button');
const authToggle = document.getElementById('auth-toggle');
const authError = document.getElementById('auth-error');
const emailField = document.getElementById('email');
const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');
const logoutButton = document.getElementById('logout-button');
const usernameDisplay = document.getElementById('username-display');
const pageContent = document.getElementById('page-content');

// --- State ---
let isLoginMode = true;

// --- DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('cinebook_token');
    if (token) {
        CURRENT_USER = {
            userId: localStorage.getItem('cinebook_userId'),
            username: localStorage.getItem('cinebook_username'),
            token,
            role: localStorage.getItem('cinebook_role') || 'user'
        };
        showMainApp();
    } else {
        showAuthPage();
    }

    authToggle.addEventListener('click', toggleAuthMode);
    authForm.addEventListener('submit', handleAuthSubmit);
    logoutButton.addEventListener('click', handleLogout);
    document.getElementById('profile-button').addEventListener('click', loadProfilePage);
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('add-movie-form').addEventListener('submit', handleAddMovie);
});

// --- Auth UI ---
function showAuthPage() {
    gsap.to(mainContainer, { opacity: 0, duration: 0.3, onComplete: () => {
        mainContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        gsap.fromTo(authContainer, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5 });
    }});
}

function showMainApp() {
    authContainer.classList.add('hidden');
    mainContainer.classList.remove('hidden');
    usernameDisplay.textContent = `Welcome, ${CURRENT_USER.username}`;
    pageContent.innerHTML = '';

    if (CURRENT_USER.role === 'admin') {
        const addBtn = document.createElement('button');
        addBtn.textContent = "➕ Add New Movie";
        addBtn.className = "add-movie-btn";
        addBtn.addEventListener('click', showAddMovieModal);
        pageContent.appendChild(addBtn);
    }

    loadMoviesPage();
    gsap.fromTo(mainContainer, { opacity: 0 }, { opacity: 1, duration: 0.5 });
}

// --- Logout ---
function handleLogout() {
    CURRENT_USER = null;
    localStorage.clear();
    usernameField.value = '';
    passwordField.value = '';
    emailField.value = '';
    showAuthPage();
}

// --- Toggle Login / Signup ---
function toggleAuthMode(e) {
    if (e) e.preventDefault();
    isLoginMode = !isLoginMode;
    authError.style.display = 'none';

    gsap.to('.auth-box', { scale: 0.95, opacity: 0, duration: 0.3, onComplete: () => {
        const emailGroup = document.getElementById('email-group');
        const toggleQuestion = document.getElementById('toggle-question');
        const toggleLink = document.getElementById('toggle-link');
        
        if (isLoginMode) {
            authTitle.textContent = 'Welcome Back';
            authButton.textContent = 'Continue';
            emailGroup.classList.add('hidden');
            toggleQuestion.textContent = 'New to Cinebook?';
            toggleLink.textContent = 'Create an account';
        } else {
            authTitle.textContent = 'Get Started';
            authButton.textContent = 'Create Account';
            emailGroup.classList.remove('hidden');
            toggleQuestion.textContent = 'Already have an account?';
            toggleLink.textContent = 'Sign in';
        }
        gsap.to('.auth-box', { scale: 1, opacity: 1, duration: 0.3 });
    }});
}

// --- Auth Submit ---
async function handleAuthSubmit(e) {
    e.preventDefault();
    authError.style.display = 'none';
    const username = usernameField.value;
    const password = passwordField.value;

    let url = isLoginMode ? `${API_BASE}/login` : `${API_BASE}/signup`;
    let body = { username, password };
    if (!isLoginMode) body.email = emailField.value;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');

        if (isLoginMode) {
            CURRENT_USER = {
                userId: data.user_id,
                username: data.username,
                token: data.token,
                role: data.role || 'user'
            };
            localStorage.setItem('cinebook_token', data.token);
            localStorage.setItem('cinebook_userId', data.user_id);
            localStorage.setItem('cinebook_username', data.username);
            localStorage.setItem('cinebook_role', data.role || 'user');
            showMainApp();
        } else {
            alert('Signup successful! Please log in.');
            toggleAuthMode();
        }
    } catch (err) {
        authError.textContent = err.message;
        authError.style.display = 'block';
    }
}

// --- Load Movies Page ---
async function loadMoviesPage() {
    const container = pageContent;
    let movieContainer = document.getElementById('movie-container');
    if (!movieContainer) {
        movieContainer = document.createElement('div');
        movieContainer.id = 'movie-container';
        movieContainer.className = 'movie-container';
        container.appendChild(movieContainer);
    }
    movieContainer.innerHTML = "Loading...";

    try {
        const res = await fetch(`${API_BASE}/movies`);
        const movies = await res.json();
        movieContainer.innerHTML = "";

        movies.forEach(movie => {
            const movieId = movie.movie_id || movie._id;
            const card = document.createElement("div");
            card.className = "movie-card";
            card.innerHTML = `
                <img src="${movie.poster_url}" alt="${movie.movie_name}">
                <div class="movie-card-content">
                    <div class="movie-title">${movie.movie_name}</div>
                    <div class="movie-genre">${movie.genre}</div>
                    ${
                        CURRENT_USER.role === "admin"
                        ? `<button class="delete-btn" onclick="deleteMovie('${movieId}')">🗑 Delete</button>`
                        : ""
                    }
                </div>
            `;
            card.addEventListener("click", () => loadDetailsPage({ ...movie, movie_id: movieId }));
            movieContainer.appendChild(card);
        });

        gsap.fromTo(".movie-card", { opacity: 0, y: 50 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.4 });
    } catch (err) {
        movieContainer.innerHTML = "<p class='error-message'>Could not load movies.</p>";
        console.error(err);
    }
}

function goBackToMovies() {
  // Clear the page content
  pageContent.innerHTML = '';
  
  // Re-add the admin button if user is admin
  if (CURRENT_USER.role === 'admin') {
    const addBtn = document.createElement('button');
    addBtn.textContent = "➕ Add New Movie";
    addBtn.className = "add-movie-btn";
    addBtn.addEventListener('click', showAddMovieModal);
    pageContent.appendChild(addBtn);
  }
  
  // Load movies page
  loadMoviesPage();
}


// Global variable to store selected date
let SELECTED_DATE = new Date().toDateString();

// Global variables for cast/crew management
let CURRENT_MANAGE_MOVIE_ID = null;
let CURRENT_MANAGE_TYPE = null;
let CURRENT_MOVIE_DATA = null;

// Scroll to showtimes section
function scrollToShowtimes() {
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
        bookingSection.classList.remove('hidden');
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Handle date selection
function selectDate(dateString, movieId) {
    SELECTED_DATE = dateString;
    
    // Update active state
    document.querySelectorAll('.date-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.date-item').classList.add('active');
    
    // Reload shows for selected date
    loadShowsForDate(movieId, dateString);
}

// Load shows filtered by date
async function loadShowsForDate(movieId, dateString) {
    try {
        const res = await fetch(`${API_BASE}/shows/${movieId}`);
        const shows = await res.json();
        const theatreListEl = document.getElementById('theatre-list');
        theatreListEl.innerHTML = '';

        // Filter shows by selected date
        const selectedDate = new Date(dateString).toDateString();
        const filteredShows = shows.filter(show => {
            const showDate = new Date(show.show_datetime).toDateString();
            return showDate === selectedDate;
        });

        if (!filteredShows.length) {
            theatreListEl.innerHTML = '<p class="no-shows">No shows available for this date.</p>';
            return;
        }

        const theatres = {};
        filteredShows.forEach(show => {
            if (!theatres[show.theatre_name]) theatres[show.theatre_name] = [];
            theatres[show.theatre_name].push(show);
        });

        for (const theatreName in theatres) {
            let showtimeHTML = '';
            theatres[theatreName].forEach(show => {
                const time = new Date(show.show_datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                const deleteBtn = CURRENT_USER.role === 'admin' ? `<button class="delete-show-btn" onclick="deleteShow('${show._id}', '${movieId}')" title="Delete Show">×</button>` : '';
                showtimeHTML += `
                    <div class="showtime-slot-wrapper">
                        <div class="showtime-slot" onclick="loadSeatMap('${show._id}')">
                            <div class="showtime-time">${time}</div>
                            <div class="showtime-availability">Available</div>
                        </div>
                        ${deleteBtn}
                    </div>
                `;
            });
            theatreListEl.innerHTML += `
                <div class="theatre-group">
                    <div class="theatre-header">
                        <div class="theatre-name">
                            <span class="theatre-icon">❤️</span>
                            <span>${theatreName}</span>
                        </div>
                        <div class="theatre-info">
                            <span class="info-icon" title="Theatre Information">ℹ️</span>
                        </div>
                    </div>
                    <div class="showtime-grid">${showtimeHTML}</div>
                </div>
            `;
        }
        gsap.fromTo(".theatre-group", { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.4 });
    } catch (err) {
        document.getElementById('theatre-list').innerHTML = "<p class='error-message'>Could not load showtimes.</p>";
    }
}

// --- Movie Details ---
async function loadDetailsPage(movie) {
    const movieId = movie.movie_id || movie._id;
    if (!movieId) return alert("Invalid movie ID");

    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push({
            day: date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase(),
            date: date.getDate(),
            month: date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
            fullDate: date.toDateString()
        });
    }

    pageContent.innerHTML = `
        <div class="movie-banner" style="background: linear-gradient(90deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0.3) 70%, transparent 100%), url('${movie.poster_url}') center/cover;">
            <div class="movie-banner-content">
                <button class="back-button-banner" onclick="goBackToMovies()">← Back</button>
                <div class="movie-banner-info">
                    <img src="${movie.poster_url}" alt="${movie.movie_name}" class="movie-banner-poster">
                    <div class="movie-banner-details">
                        <h1>${movie.movie_name}</h1>
                        <div class="movie-rating">
                            <span class="rating-star">⭐</span>
                            <span class="rating-value">8.5/10</span>
                            <span class="rating-votes">(45.2K Votes)</span>
                            <button class="rate-button">Rate now</button>
                        </div>
                        <div class="movie-meta">
                            <span class="meta-badge">2D</span>
                            <span class="meta-badge">${movie.genre || 'Movie'}</span>
                        </div>
                        <div class="movie-info">
                            <span>2h 25m</span>
                            <span>•</span>
                            <span>${movie.genre || 'Action, Drama'}</span>
                            <span>•</span>
                            <span>UA 16+</span>
                            ${movie.release_date ? `
                                <span>•</span>
                                <span>${new Date(movie.release_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            ` : ''}
                        </div>
                        <div class="movie-actions">
                            <button class="book-tickets-btn" onclick="scrollToShowtimes()">Book tickets</button>
                            ${CURRENT_USER.role === 'admin' ? `<button class="edit-movie-btn" onclick="showEditMovieModal('${movieId}')">✏️ Edit Movie</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="movie-details-container">
            <div class="about-section">
                <h3>About the movie</h3>
                <p>${movie.description || "Mass Jathara is a Telugu action entertainer directed by Bhanu Bogavarapu, featuring Ravi Teja and Sree Leela in pivotal roles."}</p>
            </div>

            <div class="offers-section">
                <h3>Top offers for you</h3>
                <div class="offers-grid">
                    <div class="offer-card">
                        <div class="offer-icon">🎫</div>
                        <div class="offer-content">
                            <h4>Filmy Pass</h4>
                            <p>Get 50% off on your first booking</p>
                        </div>
                    </div>
                    <div class="offer-card">
                        <div class="offer-icon">💳</div>
                        <div class="offer-content">
                            <h4>HDFC Credit Card</h4>
                            <p>Get 20% cashback up to ₹150</p>
                        </div>
                    </div>
                    <div class="offer-card">
                        <div class="offer-icon">🎁</div>
                        <div class="offer-content">
                            <h4>Paytm Offer</h4>
                            <p>Flat ₹100 cashback on ₹500</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="cast-section">
                <div class="section-header">
                    <h3>Cast</h3>
                    ${CURRENT_USER.role === 'admin' ? `<button class="manage-btn" onclick="manageCastCrew('${movieId}', 'cast')">Manage Cast</button>` : ''}
                </div>
                <div class="cast-grid" id="cast-grid">
                    ${movie.cast && movie.cast.length > 0 ? movie.cast.map(member => `
                        <div class="cast-member">
                            <div class="cast-image" style="${member.photo_url ? `background-image: url('${member.photo_url}'); background-size: cover; background-position: center;` : ''}">
                                ${!member.photo_url ? '👤' : ''}
                            </div>
                            <div class="cast-name">${member.name}</div>
                            <div class="cast-role">${member.role}</div>
                        </div>
                    `).join('') : `
                        <div class="cast-member">
                            <div class="cast-image">👤</div>
                            <div class="cast-name">Lead Actor</div>
                            <div class="cast-role">Actor</div>
                        </div>
                        <div class="cast-member">
                            <div class="cast-image">👤</div>
                            <div class="cast-name">Lead Actress</div>
                            <div class="cast-role">Actor</div>
                        </div>
                        <div class="cast-member">
                            <div class="cast-image">👤</div>
                            <div class="cast-name">Supporting Actor</div>
                            <div class="cast-role">Actor</div>
                        </div>
                        <div class="cast-member">
                            <div class="cast-image">👤</div>
                            <div class="cast-name">Character Artist</div>
                            <div class="cast-role">Actor</div>
                        </div>
                    `}
                </div>
            </div>

            <div class="crew-section">
                <div class="section-header">
                    <h3>Crew</h3>
                    ${CURRENT_USER.role === 'admin' ? `<button class="manage-btn" onclick="manageCastCrew('${movieId}', 'crew')">Manage Crew</button>` : ''}
                </div>
                <div class="crew-grid" id="crew-grid">
                    ${movie.crew && movie.crew.length > 0 ? movie.crew.map(member => `
                        <div class="crew-member">
                            <div class="crew-image" style="${member.photo_url ? `background-image: url('${member.photo_url}'); background-size: cover; background-position: center;` : ''}">
                                ${!member.photo_url ? '🎬' : ''}
                            </div>
                            <div class="crew-name">${member.name}</div>
                            <div class="crew-role">${member.role}</div>
                        </div>
                    `).join('') : `
                        <div class="crew-member">
                            <div class="crew-image">🎬</div>
                            <div class="crew-name">Director Name</div>
                            <div class="crew-role">Director</div>
                        </div>
                        <div class="crew-member">
                            <div class="crew-image">✍️</div>
                            <div class="crew-name">Writer Name</div>
                            <div class="crew-role">Writer</div>
                        </div>
                        <div class="crew-member">
                            <div class="crew-image">🎵</div>
                            <div class="crew-name">Music Composer</div>
                            <div class="crew-role">Music Director</div>
                        </div>
                        <div class="crew-member">
                            <div class="crew-image">📷</div>
                            <div class="crew-name">Cinematographer</div>
                            <div class="crew-role">Director of Photography</div>
                        </div>
                    `}
                </div>
            </div>

            <div class="reviews-section">
                <h3>Top reviews</h3>
                <div class="reviews-container">
                    <div class="review-card">
                        <div class="review-header">
                            <div class="reviewer-info">
                                <div class="reviewer-avatar">👤</div>
                                <div>
                                    <div class="reviewer-name">Rajesh Kumar</div>
                                    <div class="review-rating">⭐⭐⭐⭐⭐</div>
                                </div>
                            </div>
                        </div>
                        <p class="review-text">Excellent movie! Ravi Teja's performance is outstanding. A must-watch for action lovers.</p>
                    </div>
                    <div class="review-card">
                        <div class="review-header">
                            <div class="reviewer-info">
                                <div class="reviewer-avatar">👤</div>
                                <div>
                                    <div class="reviewer-name">Priya Sharma</div>
                                    <div class="review-rating">⭐⭐⭐⭐</div>
                                </div>
                            </div>
                        </div>
                        <p class="review-text">Great entertainment! The action sequences are top-notch and the music is fantastic.</p>
                    </div>
                </div>
            </div>

            <div class="similar-movies-section">
                <h3>You might also like</h3>
                <div class="similar-movies-grid" id="similar-movies">
                    <div class="similar-movie-card">
                        <img src="https://image.tmdb.org/t/p/w500/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg" alt="Movie">
                        <div class="similar-movie-info">
                            <div class="similar-movie-title">Inception</div>
                            <div class="similar-movie-genre">Sci-Fi</div>
                        </div>
                    </div>
                    <div class="similar-movie-card">
                        <img src="https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" alt="Movie">
                        <div class="similar-movie-info">
                            <div class="similar-movie-title">The Dark Knight</div>
                            <div class="similar-movie-genre">Action</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="booking-section" class="booking-section hidden">
                <h2 class="booking-title">Select Date & Showtime</h2>
                
                <div class="date-selector">
                    ${dates.map((d, i) => `
                        <div class="date-item ${i === 0 ? 'active' : ''}" data-date="${d.fullDate}" onclick="selectDate('${d.fullDate}', '${movieId}')">
                            <div class="date-day">${d.day}</div>
                            <div class="date-number">${d.date}</div>
                            <div class="date-month">${d.month}</div>
                        </div>
                    `).join('')}
                </div>

                ${CURRENT_USER.role === 'admin' ? `
                <div class="admin-section">
                    <button class="filter-btn admin-add" onclick="showAddShowModal('${movieId}')">+ Add Show</button>
                </div>
                ` : ''}
                
                <div class="showtimes-section">
                    <div id="theatre-list">Loading showtimes...</div>
                </div>
            </div>
        </div>
    `;

    // Initialize with today's date
    SELECTED_DATE = new Date().toDateString();
    
    try {
        // Load shows for today's date
        loadShowsForDate(movieId, SELECTED_DATE);
    } catch (err) {
        document.getElementById('theatre-list').innerHTML = "<p class='error-message'>Could not load showtimes.</p>";
    }
}

// --- Delete Movie (Admin) ---
async function deleteMovie(movieId) {
    if (!movieId || movieId === "undefined") {
        return alert("Invalid movie ID");
    }
    if (!confirm("Are you sure you want to delete this movie?")) return;

    try {
        const res = await fetch(`${API_BASE}/movies/${movieId}`, {
            method: "DELETE",
            headers: { "token": CURRENT_USER.token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete movie");

        alert("🗑 Movie deleted successfully!");
        goBackToMovies();
    } catch (err) {
        alert(err.message);
    }
}

// --- Delete Show (Admin) ---
async function deleteShow(showId, movieId) {
    if (!confirm("Are you sure you want to delete this show? All seats will be deleted.")) return;

    try {
        const res = await fetch(`${API_BASE}/shows/${showId}`, {
            method: "DELETE",
            headers: { "token": CURRENT_USER.token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete show");

        alert("🗑 Show deleted successfully!");
        // Reload the movie details page
        const movie = { movie_id: movieId };
        loadDetailsPage(movie);
    } catch (err) {
        alert(err.message);
    }
}

// --- Show Add Show Modal ---
let CURRENT_MOVIE_ID = null;

function showAddShowModal(movieId) {
    CURRENT_MOVIE_ID = movieId;
    const modal = document.getElementById('add-show-modal');
    if (!modal) {
        // Create modal if it doesn't exist
        const modalHTML = `
            <div id="add-show-modal" class="modal">
                <div class="modal-content">
                    <span id="close-show-modal" class="close">&times;</span>
                    <h2>Add New Show</h2>
                    <form id="add-show-form">
                        <input type="text" id="show_theatre" placeholder="Theatre Name" required>
                        <input type="datetime-local" id="show_datetime" required>
                        <button type="submit">Add Show</button>
                        <p id="add-show-error" class="error-message"></p>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('close-show-modal').addEventListener('click', closeShowModal);
        document.getElementById('add-show-form').addEventListener('submit', handleAddShow);
    }
    
    // Pre-fill with selected date
    const dateInput = document.getElementById('show_datetime');
    if (dateInput && SELECTED_DATE) {
        const selectedDate = new Date(SELECTED_DATE);
        // Format as datetime-local input value (YYYY-MM-DDTHH:MM)
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}T10:00`;
        dateInput.min = `${year}-${month}-${day}T00:00`;
        dateInput.max = `${year}-${month}-${day}T23:59`;
    }
    
    document.getElementById('add-show-modal').classList.remove('hidden');
    gsap.fromTo('.modal-content', { scale: 0.8, opacity: 0 }, { duration: 0.4, scale: 1, opacity: 1, ease: "power3.out" });
}

function closeShowModal() {
    const modal = document.getElementById('add-show-modal');
    gsap.to('.modal-content', {
        duration: 0.3, scale: 0.8, opacity: 0, ease: "power3.in",
        onComplete: () => modal.classList.add('hidden')
    });
}

async function handleAddShow(e) {
    e.preventDefault();
    const theatre = document.getElementById("show_theatre").value;
    const datetime = document.getElementById("show_datetime").value;
    const errMsg = document.getElementById("add-show-error");

    try {
        const res = await fetch(`${API_BASE}/shows`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "token": CURRENT_USER.token 
            },
            body: JSON.stringify({ 
                movie_id: CURRENT_MOVIE_ID, 
                theatre_name: theatre, 
                show_datetime: datetime 
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add show");

        alert("✅ Show added successfully!");
        closeShowModal();
        // Reload the movie details page
        loadDetailsPage({ movie_id: CURRENT_MOVIE_ID });
    } catch (err) {
        errMsg.textContent = err.message;
        errMsg.style.display = 'block';
    }
}

// --- Seat Map ---
async function loadSeatMap(showId) {
    CURRENT_SHOW_ID = showId;
    SELECTED_SEATS = [];
    ALL_SEATS_DATA = [];

    pageContent.innerHTML = `
        <div class="seat-booking-container">
            <button class="back-button" onclick="goBackToMovies()">← Back</button>
            
            <div class="seat-selection-header">
                <div class="screen-indicator">
                    <div class="screen-line"></div>
                    <p>All eyes this way please!</p>
                </div>
            </div>

            <div id="seat-grid">Loading seats...</div>
            
            <div class="seat-legend">
                <div class="legend-item">
                    <span class="legend-box available"></span>
                    <span>Available</span>
                </div>
                <div class="legend-item">
                    <span class="legend-box selected"></span>
                    <span>Selected</span>
                </div>
                <div class="legend-item">
                    <span class="legend-box booked"></span>
                    <span>Sold</span>
                </div>
            </div>
        </div>
        
        <div id="booking-summary" class="booking-summary">
            <div class="summary-wrapper">
                <div class="summary-left">
                    <button id="book-button" onclick="bookSeats()" disabled>Pay ₹<span id="total-price">0</span></button>
                </div>
                <div class="summary-right">
                    <span class="seats-selected"><span id="selected-count">0</span> Seats</span>
                </div>
            </div>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE}/seats/${showId}`);
        const seats = await res.json();
        ALL_SEATS_DATA = seats;
        const seatGridEl = document.getElementById('seat-grid');
        seatGridEl.innerHTML = '';

        seats.forEach(seat => {
            const btn = document.createElement('button');
            const seatLabel = `${seat.seat_row}${seat.seat_col}`;
            btn.innerHTML = '';
            btn.disabled = seat.is_reserved;
            btn.dataset.seatId = seat._id;
            btn.dataset.price = seat.price;
            btn.dataset.category = seat.category;
            btn.dataset.label = seatLabel;
            btn.title = `${seatLabel} - ₹${seat.price}`;
            
            if (!seat.is_reserved) {
                btn.className = `seat ${seat.category.toLowerCase()}`;
                btn.addEventListener('click', () => toggleSeatSelection(btn, seat));
            } else {
                btn.className = 'seat booked';
            }
            seatGridEl.appendChild(btn);
        });

        gsap.fromTo('.seat', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.02, duration: 0.3 });
    } catch (err) {
        document.getElementById('seat-grid').innerHTML = "<p class='error-message'>Could not load seats.</p>";
    }
}

function toggleSeatSelection(button, seat) {
    const seatId = seat._id;
    const index = SELECTED_SEATS.findIndex(s => s.seatId === seatId);
    
    if (index > -1) {
        SELECTED_SEATS.splice(index, 1);
        button.classList.remove('selected');
    } else {
        if (SELECTED_SEATS.length >= 8) return alert("Max 8 seats");
        SELECTED_SEATS.push({
            seatId: seatId,
            price: seat.price,
            category: seat.category,
            label: `${seat.seat_row}${seat.seat_col}`
        });
        button.classList.add('selected');
    }
    
    updateBookingSummary();
}

function updateBookingSummary() {
    const selectedCount = SELECTED_SEATS.length;
    const totalPrice = SELECTED_SEATS.reduce((sum, seat) => sum + seat.price, 0);
    
    document.getElementById('selected-count').textContent = selectedCount;
    document.getElementById('total-price').textContent = totalPrice;
    
    const bookButton = document.getElementById('book-button');
    bookButton.disabled = selectedCount === 0;
}

// --- Booking ---
async function bookSeats() {
    if (SELECTED_SEATS.length === 0) return alert("Select at least 1 seat");
    
    const totalPrice = SELECTED_SEATS.reduce((sum, seat) => sum + seat.price, 0);
    const seatLabels = SELECTED_SEATS.map(s => s.label).join(', ');
    
    if (!confirm(`Confirm booking?\n\nSeats: ${seatLabels}\nTotal: ₹${totalPrice}`)) {
        return;
    }
    
    try {
        const seatIds = SELECTED_SEATS.map(s => s.seatId);
        const res = await fetch(`${API_BASE}/book`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "token": CURRENT_USER.token
            },
            body: JSON.stringify({
                user_id: CURRENT_USER.userId,
                show_id: CURRENT_SHOW_ID,
                seats: seatIds
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Booking failed");
        alert(`🎟 Booking successful!\n\nBooking ID: ${data.booking_id}\nSeats: ${data.seats_count}\nTotal Paid: ₹${data.total_price}`);
        goBackToMovies();
    } catch (err) {
        alert(err.message);
    }
}

// --- GSAP Modal ---
function showAddMovieModal() {
    const modal = document.getElementById('add-movie-modal');
    modal.classList.remove('hidden');
    gsap.fromTo('.modal-content', { scale: 0.8, opacity: 0 }, { duration: 0.4, scale: 1, opacity: 1, ease: "power3.out" });
}

function closeModal() {
    const modal = document.getElementById('add-movie-modal');
    gsap.to('.modal-content', {
        duration: 0.3, scale: 0.8, opacity: 0, ease: "power3.in",
        onComplete: () => modal.classList.add('hidden')
    });
}

async function handleAddMovie(e) {
    e.preventDefault();
    const name = document.getElementById("movie_name").value;
    const poster = document.getElementById("poster_url").value;
    const genre = document.getElementById("genre").value;
    const releaseDate = document.getElementById("release_date").value;
    const desc = document.getElementById("description").value;
    const errMsg = document.getElementById("add-movie-error");

    try {
        const res = await fetch(`${API_BASE}/movies`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "token": CURRENT_USER.token },
            body: JSON.stringify({ 
                movie_name: name, 
                poster_url: poster, 
                genre, 
                release_date: releaseDate,
                description: desc 
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add movie");

        alert("✅ Movie added successfully!");
        closeModal();
        loadMoviesPage();
    } catch (err) {
        errMsg.textContent = err.message;
        errMsg.style.display = 'block';
    }
}

// --- Cast & Crew Management ---
async function manageCastCrew(movieId, type) {
    CURRENT_MANAGE_MOVIE_ID = movieId;
    CURRENT_MANAGE_TYPE = type;
    
    // Fetch current movie data
    try {
        const res = await fetch(`${API_BASE}/movies`);
        const movies = await res.json();
        const movie = movies.find(m => (m.movie_id || m._id) == movieId);
        CURRENT_MOVIE_DATA = movie;
        
        // Default cast/crew if none exist
        const defaultCast = [
            { name: 'Lead Actor', role: 'Actor', photo_url: '' },
            { name: 'Lead Actress', role: 'Actor', photo_url: '' },
            { name: 'Supporting Actor', role: 'Actor', photo_url: '' },
            { name: 'Character Artist', role: 'Actor', photo_url: '' }
        ];
        
        const defaultCrew = [
            { name: 'Director Name', role: 'Director', photo_url: '' },
            { name: 'Writer Name', role: 'Writer', photo_url: '' },
            { name: 'Music Composer', role: 'Music Director', photo_url: '' },
            { name: 'Cinematographer', role: 'Director of Photography', photo_url: '' }
        ];
        
        let members;
        if (type === 'cast') {
            members = (movie.cast && movie.cast.length > 0) ? movie.cast : defaultCast;
        } else {
            members = (movie.crew && movie.crew.length > 0) ? movie.crew : defaultCrew;
        }
        
        // Create modal HTML
        const modalHTML = `
            <div id="cast-crew-modal" class="modal">
                <div class="modal-content cast-crew-modal-content">
                    <span class="close" onclick="closeCastCrewModal()">&times;</span>
                    <h2>Manage ${type === 'cast' ? 'Cast' : 'Crew'}</h2>
                    <p class="modal-hint">💡 Edit the default entries below or add new members. Add photo URLs for better display!</p>
                    
                    <div id="members-list">
                        ${members.map((member, index) => `
                            <div class="member-item" data-index="${index}">
                                <input type="text" placeholder="Name" value="${member.name}" id="${type}-name-${index}">
                                <input type="text" placeholder="Role" value="${member.role}" id="${type}-role-${index}">
                                <input type="text" placeholder="Photo URL" value="${member.photo_url || ''}" id="${type}-photo-${index}">
                                <button class="remove-member-btn" onclick="removeMember(${index})">×</button>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="modal-actions">
                        <button class="add-member-btn" onclick="addMemberField()">+ Add Member</button>
                        <button class="save-cast-crew-btn" onclick="saveCastCrew()">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existing = document.getElementById('cast-crew-modal');
        if (existing) existing.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('cast-crew-modal').classList.remove('hidden');
        gsap.fromTo('.cast-crew-modal-content', { scale: 0.8, opacity: 0 }, { duration: 0.4, scale: 1, opacity: 1, ease: "power3.out" });
    } catch (err) {
        alert('Error loading movie data: ' + err.message);
    }
}

function closeCastCrewModal() {
    const modal = document.getElementById('cast-crew-modal');
    if (modal) {
        gsap.to('.cast-crew-modal-content', {
            duration: 0.3, scale: 0.8, opacity: 0, ease: "power3.in",
            onComplete: () => modal.remove()
        });
    }
}

function addMemberField() {
    const list = document.getElementById('members-list');
    const index = list.children.length;
    const type = CURRENT_MANAGE_TYPE;
    
    const memberHTML = `
        <div class="member-item" data-index="${index}">
            <input type="text" placeholder="Name" id="${type}-name-${index}">
            <input type="text" placeholder="Role" id="${type}-role-${index}">
            <input type="text" placeholder="Photo URL" id="${type}-photo-${index}">
            <button class="remove-member-btn" onclick="removeMember(${index})">×</button>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', memberHTML);
    gsap.from(list.lastElementChild, { opacity: 0, y: -10, duration: 0.3 });
}

function removeMember(index) {
    const items = document.querySelectorAll('.member-item');
    if (items[index]) {
        gsap.to(items[index], {
            opacity: 0, x: -20, duration: 0.3,
            onComplete: () => items[index].remove()
        });
    }
}

async function saveCastCrew() {
    const type = CURRENT_MANAGE_TYPE;
    const items = document.querySelectorAll('.member-item');
    const members = [];
    
    items.forEach((item) => {
        const index = item.dataset.index;
        const name = document.getElementById(`${type}-name-${index}`)?.value;
        const role = document.getElementById(`${type}-role-${index}`)?.value;
        const photo_url = document.getElementById(`${type}-photo-${index}`)?.value;
        
        if (name && role) {
            members.push({ name, role, photo_url: photo_url || '' });
        }
    });
    
    try {
        const updateBody = {
            cast: type === 'cast' ? members : (CURRENT_MOVIE_DATA.cast || []),
            crew: type === 'crew' ? members : (CURRENT_MOVIE_DATA.crew || [])
        };
        
        const response = await fetch(`${API_BASE}/movies/${CURRENT_MANAGE_MOVIE_ID}/cast-crew`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'token': CURRENT_USER.token
            },
            body: JSON.stringify(updateBody)
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        alert('✅ ' + (type === 'cast' ? 'Cast' : 'Crew') + ' updated successfully!');
        closeCastCrewModal();
        
        // Reload the page to show updated data
        loadDetailsPage(CURRENT_MOVIE_DATA);
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// --- Profile Page ---
async function loadProfilePage() {
pageContent.innerHTML = '<div class="loading">Loading profile...</div>';
    
try {
// Fetch user profile
const profileRes = await fetch(`${API_BASE}/profile/${CURRENT_USER.userId}`, {
headers: { 'token': CURRENT_USER.token }
});
const profile = await profileRes.json();
        
// Fetch booking history
const bookingsRes = await fetch(`${API_BASE}/bookings/${CURRENT_USER.userId}`, {
headers: { 'token': CURRENT_USER.token }
});
const bookings = await bookingsRes.json();
        
pageContent.innerHTML = `
<div class="profile-container">
<button class="back-button" onclick="goBackToMovies()">← Back to Movies</button>
            
<div class="profile-header">
<div class="profile-avatar">
<span class="avatar-icon">👤</span>
</div>
<div class="profile-info">
<h2>${profile.username}</h2>
<p class="profile-role">${profile.role === 'admin' ? '👑 Admin' : '🎬 Movie Lover'}</p>
</div>
</div>
            
<div class="profile-sections">
<div class="profile-details-section">
<h3>Personal Information</h3>
<form id="profile-form" class="profile-form">
<div class="form-group">
<label>Full Name</label>
<input type="text" id="fullName" value="${profile.fullName || ''}" placeholder="Enter your full name">
</div>
<div class="form-group">
<label>Email</label>
<input type="email" id="profileEmail" value="${profile.email || ''}" placeholder="Enter your email">
</div>
<div class="form-group">
<label>Phone</label>
<input type="tel" id="phone" value="${profile.phone || ''}" placeholder="Enter your phone number">
</div>
<div class="form-group">
<label>Username</label>
<input type="text" value="${profile.username}" disabled>
</div>
<button type="submit" class="save-profile-btn">Save Changes</button>
</form>
</div>
<div class="booking-history-section">
<h3>Recent Bookings</h3>
<div class="bookings-list">
${bookings.length > 0 ? bookings.map(booking => `
<div class="booking-card">
<img src="${booking.poster_url}" alt="${booking.movie_name}" class="booking-poster">
<div class="booking-details">
<div class="booking-header-info">
<h4>${booking.movie_name}</h4>
<span class="booking-id">ID: ${booking.booking_id}</span>
</div>
<p class="booking-theatre"> 📍 ${booking.theatre_name}</p>
<p class="booking-datetime"> 🗓️ ${new Date(booking.show_datetime).toLocaleString('en-IN', { 
dateStyle: 'medium', 
timeStyle: 'short' 
})}</p>
<p class="booking-seats"> 🎫 ${booking.seat_count} Seats: ${booking.seats.join(', ')}</p>
<p class="booking-price"> 💰 ₹${booking.total_price}</p>
<p class="booking-time">Booked on: ${new Date(booking.booking_time).toLocaleDateString('en-IN')}</p>
</div>
</div>
`).join('') : '<p class="no-bookings">No bookings yet. Start booking your favorite movies!</p>'}
</div>
</div>
</div>
</div>
`;
        
// Add form submit handler
document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
        
gsap.fromTo('.profile-container', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
} catch (err) {
pageContent.innerHTML = `<p class="error-message">Error loading profile: ${err.message}</p>`;
}
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('phone').value;
    
    try {
        const res = await fetch(`${API_BASE}/profile/${CURRENT_USER.userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'token': CURRENT_USER.token
            },
            body: JSON.stringify({ fullName, email, phone })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        alert('✅ Profile updated successfully!');
    } catch (err) {
        alert('Error updating profile: ' + err.message);
    }
}

// --- Edit Movie ---
let CURRENT_EDIT_MOVIE_ID = null;

async function showEditMovieModal(movieId) {
    CURRENT_EDIT_MOVIE_ID = movieId;
    
    // Fetch current movie data
    try {
        const res = await fetch(`${API_BASE}/movies`);
        const movies = await res.json();
        const movie = movies.find(m => (m.movie_id || m._id) == movieId);
        
        if (!movie) {
            alert('Movie not found');
            return;
        }
        
        const releaseDateValue = movie.release_date ? new Date(movie.release_date).toISOString().split('T')[0] : '';
        
        const modalHTML = `
            <div id="edit-movie-modal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="closeEditMovieModal()">&times;</span>
                    <h2>Edit Movie</h2>
                    <form id="edit-movie-form">
                        <input type="text" id="edit_movie_name" placeholder="Movie Name" value="${movie.movie_name}" required>
                        <input type="text" id="edit_poster_url" placeholder="Poster URL" value="${movie.poster_url}" required>
                        <input type="text" id="edit_genre" placeholder="Genre" value="${movie.genre || ''}">
                        <div class="form-field">
                            <label for="edit_release_date">Release Date</label>
                            <input type="date" id="edit_release_date" value="${releaseDateValue}">
                        </div>
                        <textarea id="edit_description" placeholder="Description" rows="5">${movie.description || ''}</textarea>
                        <button type="submit">Update Movie</button>
                        <p id="edit-movie-error" class="error-message"></p>
                    </form>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existing = document.getElementById('edit-movie-modal');
        if (existing) existing.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('edit-movie-modal').classList.remove('hidden');
        document.getElementById('edit-movie-form').addEventListener('submit', handleEditMovie);
        gsap.fromTo('.modal-content', { scale: 0.8, opacity: 0 }, { duration: 0.4, scale: 1, opacity: 1, ease: "power3.out" });
    } catch (err) {
        alert('Error loading movie data: ' + err.message);
    }
}

function closeEditMovieModal() {
    const modal = document.getElementById('edit-movie-modal');
    if (modal) {
        gsap.to('.modal-content', {
            duration: 0.3, scale: 0.8, opacity: 0, ease: "power3.in",
            onComplete: () => modal.remove()
        });
    }
}

async function handleEditMovie(e) {
    e.preventDefault();
    const name = document.getElementById("edit_movie_name").value;
    const poster = document.getElementById("edit_poster_url").value;
    const genre = document.getElementById("edit_genre").value;
    const releaseDate = document.getElementById("edit_release_date").value;
    const desc = document.getElementById("edit_description").value;
    const errMsg = document.getElementById("edit-movie-error");

    try {
        const res = await fetch(`${API_BASE}/movies/${CURRENT_EDIT_MOVIE_ID}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json", 
                "token": CURRENT_USER.token 
            },
            body: JSON.stringify({ 
                movie_name: name, 
                poster_url: poster, 
                genre,
                release_date: releaseDate,
                description: desc 
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update movie");

        alert("✅ Movie updated successfully!");
        closeEditMovieModal();
        
        // Reload the movie details page with updated data
        const updatedMovie = data.movie;
        loadDetailsPage({ ...updatedMovie, movie_id: CURRENT_EDIT_MOVIE_ID });
    } catch (err) {
        errMsg.textContent = err.message;
        errMsg.style.display = 'block';
    }
}
