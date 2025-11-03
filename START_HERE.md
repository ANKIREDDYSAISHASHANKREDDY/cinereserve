# 🎬 Quick Start Guide

## Step 1: Start MongoDB
Make sure MongoDB is running on your system.

## Step 2: Start Backend Server

Open terminal in the `backend` folder and run:

```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on http://localhost:5000
✅ MongoDB Connected
```

## Step 3: Seed Database (First Time Only)

In another terminal:

```bash
cd backend
npm run seed
```

Or visit: http://localhost:5000/reset-db (POST request)

You should see:
```
✅ Movies created!
✅ 6 shows created!
✅ 480 seats created!
🎬 Database seeded successfully!
```

## Step 4: Open Application

Open `index.html` in your browser or visit:
http://localhost:5000

## Step 5: Login

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Or create a new user account**

## What You Should See

### Homepage
- 2 movies (Inception & The Dark Knight)
- Movie posters with titles and genres
- "Add Movie" button (admin only)

### Movie Details (Click on a movie)
- Movie banner with poster background
- Date selector (7 days)
- Filter options
- Theatre list with showtimes
- Green "Available" time slots

### Seat Selection (Click on a time)
- Screen indicator at top
- 80 seats in grid (8 rows x 10 columns)
- Green seats = Available
- Gray seats = Sold
- Click to select (adds black border)
- Bottom bar shows: "Pay ₹X" and "X Seats"

### After Booking
- Confirmation alert with booking ID
- Redirects to homepage

## Troubleshooting

### Nothing displays?
1. Check browser console (F12) for errors
2. Verify backend is running: http://localhost:5000/movies
3. Check Network tab for failed requests

### No movies showing?
1. Database not seeded
2. Run: `npm run seed` in backend folder

### Can't login?
1. Check console for errors
2. Verify backend is running
3. Try resetting database

### Seats not showing?
1. No shows in database
2. Re-seed database
3. Or add show as admin

## Quick Test Commands

### Test Backend (in browser console or terminal)

```bash
# Test if server is running
curl http://localhost:5000/movies

# Or in PowerShell
Invoke-WebRequest -Uri http://localhost:5000/movies

# Reset database
Invoke-WebRequest -Uri http://localhost:5000/reset-db -Method POST
```

### In Browser Console (F12)

```javascript
// Check if movies load
fetch('http://localhost:5000/movies').then(r => r.json()).then(console.log)

// Check current user
console.log(CURRENT_USER)

// Check if you're on seat page
console.log(SELECTED_SEATS)
```

## File Structure

```
moviebookingss/
├── backend/
│   ├── server.js          # Main backend file
│   ├── package.json       # Dependencies
│   └── seed.js           # (not needed - integrated in server.js)
├── index.html            # Main HTML file
├── script.js             # Frontend JavaScript
├── style.css             # All styles
├── TESTING_GUIDE.md      # Detailed testing guide
└── START_HERE.md         # This file
```

## Common Issues

### 1. "Cannot use import statement"
**Fix**: Check backend/package.json has `"type": "module"`

### 2. "CORS error"
**Fix**: Backend has cors() enabled - should work

### 3. "Connection refused"
**Fix**: Backend not running - run `npm start`

### 4. "MongoDB connection error"
**Fix**: Start MongoDB service

### 5. Styles look broken
**Fix**: Hard refresh (Ctrl+Shift+R)

## Need Help?

1. Check TESTING_GUIDE.md for detailed testing
2. Open browser DevTools (F12)
3. Check Console tab for errors
4. Check Network tab for API calls
5. Verify all steps above are completed

## Features Checklist

- ✅ User authentication (login/signup)
- ✅ Admin panel (add/delete movies and shows)
- ✅ Movie listing with posters
- ✅ Movie details with banner
- ✅ Date selector (7 days)
- ✅ Theatre and showtime listing
- ✅ Seat selection with pricing
- ✅ Three seat categories (VIP, Premium, Standard)
- ✅ Real-time price calculation
- ✅ Booking confirmation
- ✅ BookMyShow-inspired UI

Enjoy your movie booking system! 🎟️
