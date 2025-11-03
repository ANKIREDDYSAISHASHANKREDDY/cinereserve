// --- CineBook Final Backend ---
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;


// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Schemas ---
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: "user" },
  fullName: { type: String, default: "" },
  phone: { type: String, default: "" }
});

const movieSchema = new mongoose.Schema({
  movie_name: String,
  genre: String,
  description: String,
  poster_url: String,
  release_date: { type: Date, default: null },
  cast: [
    {
      name: String,
      role: String,
      photo_url: String
    }
  ],
  crew: [
    {
      name: String,
      role: String,
      photo_url: String
    }
  ]
});

const showSchema = new mongoose.Schema({
  movie_id: mongoose.Schema.Types.ObjectId,
  theatre_name: String,
  show_datetime: Date,
});

const seatSchema = new mongoose.Schema({
  show_id: mongoose.Schema.Types.ObjectId,
  seat_row: String,
  seat_col: Number,
  is_reserved: { type: Boolean, default: false },
  priority: { type: Number, default: 1 }, // 1=Standard, 2=Premium, 3=VIP
  price: { type: Number, default: 150 }, // Price in rupees
});

// Helper function to get price based on priority
function getPriceByPriority(priority) {
  const priceMap = {
    1: 150,  // Standard
    2: 250,  // Premium
    3: 400   // VIP
  };
  return priceMap[priority] || 150;
}

const bookingSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  show_id: mongoose.Schema.Types.ObjectId,
  seats: [mongoose.Schema.Types.ObjectId],
  total_price: { type: Number, required: true },
  booking_time: { type: Date, default: Date.now },
});

// --- Models ---
const User = mongoose.model("User", userSchema);
const Movie = mongoose.model("Movie", movieSchema);
const Show = mongoose.model("Show", showSchema);
const Seat = mongoose.model("Seat", seatSchema);
const Booking = mongoose.model("Booking", bookingSchema);

// --- Auth Routes ---
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const exists = await User.findOne({ username });
    if (exists)
      return res.status(400).json({ error: "Username already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "secretkey"
    );

    res.json({
      token,
      user_id: user._id,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "secretkey"
    );

    res.json({
      token,
      user_id: user._id,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User Profile Routes ---
// Get user profile
app.get("/profile/:userId", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
app.put("/profile/:userId", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.userId !== req.params.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { fullName, phone, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { fullName, phone, email },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user bookings with movie and show details
app.get("/bookings/:userId", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const bookings = await Booking.find({ user_id: req.params.userId })
      .sort({ booking_time: -1 })
      .limit(10);
    
    // Populate with movie and show details
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const show = await Show.findById(booking.show_id);
        const movie = show ? await Movie.findById(show.movie_id) : null;
        const seats = await Seat.find({ _id: { $in: booking.seats } });
        
        return {
          booking_id: booking._id,
          movie_name: movie?.movie_name || "Unknown",
          poster_url: movie?.poster_url || "",
          theatre_name: show?.theatre_name || "Unknown",
          show_datetime: show?.show_datetime || null,
          total_price: booking.total_price,
          booking_time: booking.booking_time,
          seat_count: seats.length,
          seats: seats.map(s => `${s.seat_row}${s.seat_col}`)
        };
      })
    );
    
    res.json(bookingsWithDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Movie Routes ---
app.get("/movies", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(
      movies.map((m) => ({
        movie_id: m._id,
        movie_name: m.movie_name,
        description: m.description,
        poster_url: m.poster_url,
        genre: m.genre || "",
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/movies", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.role !== "admin")
      return res.status(403).json({ error: "Access denied" });

    const { movie_name, description, poster_url, genre, release_date } = req.body;
    if (!movie_name || !poster_url)
      return res.status(400).json({ error: "Missing fields" });

    const movie = new Movie({ 
      movie_name, 
      description, 
      poster_url, 
      genre,
      release_date: release_date ? new Date(release_date) : null
    });
    await movie.save();
    res.json({ message: "Movie added successfully", movie_id: movie._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update movie details (Admin only)
app.put("/movies/:id", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.role !== "admin")
      return res.status(403).json({ error: "Access denied" });

    const { movie_name, description, poster_url, genre, release_date } = req.body;
    const updateData = { 
      movie_name, 
      description, 
      poster_url, 
      genre,
      release_date: release_date ? new Date(release_date) : null
    };
    
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json({ message: "Movie updated successfully", movie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/movies/:id", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.role !== "admin")
      return res.status(403).json({ error: "Access denied" });

    const deleted = await Movie.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Movie not found" });
    res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update cast and crew (Admin only)
app.put("/movies/:id/cast-crew", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.role !== "admin")
      return res.status(403).json({ error: "Access denied" });

    const { cast, crew } = req.body;
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { cast, crew },
      { new: true }
    );
    
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json({ message: "Cast and crew updated successfully", movie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Shows & Seats ---
app.get("/shows/:movie_id", async (req, res) => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only return shows from today onwards
    const shows = await Show.find({ 
      movie_id: req.params.movie_id,
      show_datetime: { $gte: today }
    }).sort({ show_datetime: 1 });
    
    res.json(shows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new show (Admin only)
app.post("/shows", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.role !== "admin")
      return res.status(403).json({ error: "Access denied" });

    const { movie_id, theatre_name, show_datetime } = req.body;
    if (!movie_id || !theatre_name || !show_datetime)
      return res.status(400).json({ error: "Missing required fields" });

    const show = new Show({ movie_id, theatre_name, show_datetime });
    await show.save();

    // Create seats for the new show
    await createSeatsForShow(show._id);

    res.json({ message: "Show added successfully", show_id: show._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a show (Admin only)
app.delete("/shows/:id", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.role !== "admin")
      return res.status(403).json({ error: "Access denied" });

    // Delete all seats associated with this show
    await Seat.deleteMany({ show_id: req.params.id });
    
    // Delete the show
    const deleted = await Show.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Show not found" });
    
    res.json({ message: "Show and associated seats deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/seats/:show_id", async (req, res) => {
  try {
    const seats = await Seat.find({ show_id: req.params.show_id });
    // Return seats with price information
    const seatsWithPrice = seats.map(seat => ({
      _id: seat._id,
      seat_row: seat.seat_row,
      seat_col: seat.seat_col,
      is_reserved: seat.is_reserved,
      priority: seat.priority,
      price: seat.price || getPriceByPriority(seat.priority),
      category: seat.priority === 3 ? 'VIP' : seat.priority === 2 ? 'Premium' : 'Standard'
    }));
    res.json(seatsWithPrice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Booking ---
app.post("/book", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    const { show_id, seats } = req.body;
    if (!show_id || !seats?.length)
      return res.status(400).json({ error: "Missing booking data" });

    // Fetch seat details to calculate total price
    const seatDetails = await Seat.find({ _id: { $in: seats } });
    
    // Check if any seat is already reserved
    const alreadyReserved = seatDetails.filter(seat => seat.is_reserved);
    if (alreadyReserved.length > 0) {
      return res.status(400).json({ error: "Some seats are already reserved" });
    }

    // Calculate total price
    const totalPrice = seatDetails.reduce((sum, seat) => {
      const price = seat.price || getPriceByPriority(seat.priority);
      return sum + price;
    }, 0);

    const booking = new Booking({
      user_id: decoded.userId,
      show_id,
      seats,
      total_price: totalPrice,
    });
    await booking.save();

    await Seat.updateMany(
      { _id: { $in: seats } },
      { $set: { is_reserved: true } }
    );

    res.json({ 
      message: "Booking successful", 
      booking_id: booking._id,
      total_price: totalPrice,
      seats_count: seats.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Get My Bookings ---
app.get("/bookings/:user_id", async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    if (decoded.userId !== req.params.user_id)
      return res.status(403).json({ error: "Access denied" });

    const bookings = await Booking.find({ user_id: decoded.userId })
      .populate("show_id")
      .lean();

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Function to create seats for a show ---
async function createSeatsForShow(showId) {
  const existingSeats = await Seat.findOne({ show_id: showId });
  if (existingSeats) return; // Skip if seats already exist

  const seats = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let col = 1; col <= 10; col++) {
      let priority = 1; // Standard by default
      
      // VIP seats (first 2 rows)
      if (i < 2) {
        priority = 3;
      }
      // Premium seats (middle rows)
      else if (i >= 2 && i < 5) {
        priority = 2;
      }
      // Standard seats (back rows)
      else {
        priority = 1;
      }
      
      seats.push({
        show_id: showId,
        seat_row: row,
        seat_col: col,
        is_reserved: false,
        priority: priority,
        price: getPriceByPriority(priority)
      });
    }
  }
  
  await Seat.insertMany(seats);
}

// --- Seed Database with Admin, Movies, Shows, and Seats ---
async function seedDatabase() {
  try {
    // Create admin if doesn't exist
    const admin = await User.findOne({ username: "admin" });
    if (!admin) {
      const hashed = await bcrypt.hash("admin123", 10);
      await User.create({
        username: "admin",
        email: "admin@cinebook.com",
        password: hashed,
        role: "admin",
      });
      console.log("✅ Admin created: admin/admin123");
    }

    // Check if movies exist
    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      const movies = await Movie.insertMany([
        {
          movie_name: "Inception",
          description: "A dream heist thriller by Christopher Nolan.",
          poster_url: "https://image.tmdb.org/t/p/original/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg",
          genre: "Sci-Fi",
        },
        {
          movie_name: "The Dark Knight",
          description: "Batman faces the Joker in Gotham City.",
          poster_url: "https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
          genre: "Action",
        },
      ]);
      console.log(`✅ ${movies.length} movies created!`);

      // Create shows for each movie
      const today = new Date();
      const shows = [];

      for (const movie of movies) {
        const theatres = ["PVR Cinemas", "INOX", "Cinepolis"];
        const times = [10, 14, 18]; // 10 AM, 2 PM, 6 PM

        for (let i = 0; i < theatres.length; i++) {
          const showDate = new Date(today);
          showDate.setHours(times[i], 0, 0, 0);
          
          shows.push({
            movie_id: movie._id,
            theatre_name: theatres[i],
            show_datetime: showDate,
          });
        }
      }

      const createdShows = await Show.insertMany(shows);
      console.log(`✅ ${createdShows.length} shows created!`);

      // Create seats for each show
      for (const show of createdShows) {
        await createSeatsForShow(show._id);
      }
      
      console.log(`✅ ${createdShows.length * 80} seats created!`);
      console.log("🎬 Database seeded successfully!");
    }
  } catch (err) {
    console.error("❌ Seeding error:", err);
  }
}
seedDatabase();

// --- Reset Database Endpoint (Development Only) ---
app.post("/reset-db", async (req, res) => {
  try {
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Show.deleteMany({});
    await Seat.deleteMany({});
    await Booking.deleteMany({});
    
    console.log("🗑️ Database cleared!");
    
    // Re-seed the database
    await seedDatabase();
    
    res.json({ message: "Database reset and reseeded successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Serve Frontend ---
// ✅ STATIC FILE SERVING FOR RENDER (Serve HTML, CSS, JS)
// ✅ STATIC FILE SERVING FOR RENDER (Frontend outside backend folder)
// ✅ STATIC FILE SERVING FOR RENDER — Frontend root folder
// ✅ Serve static frontend files (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, "../")));

// ✅ Handle client-side routing for SPA (Fix for Node.js v22)
app.get(/.*/, (_req, res) =>
  res.sendFile(path.join(__dirname, "../index.html"))
);

// --- Start Server ---
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
