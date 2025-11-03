# Movie Booking System - Testing Guide

## Current Setup

### Backend (server.js)
- Port: 5000
- Database: MongoDB (mongodb://127.0.0.1:27017/cinebook_final_db)
- ES Modules enabled

### Features Implemented

#### 1. Authentication
- Login/Signup system
- Admin user: username: `admin`, password: `admin123`
- JWT token-based authentication

#### 2. Movie Management
- View all movies
- Admin can add/delete movies
- Movie details with poster and description

#### 3. Show Management
- Admin can add/delete shows
- Shows grouped by theatre
- Date selector (7 days)
- Filter options

#### 4. Seat Selection
- 80 seats per show (8 rows x 10 columns)
- Three categories: VIP (₹400), Premium (₹250), Standard (₹150)
- Visual seat map
- Real-time price calculation

#### 5. Booking
- Select multiple seats (max 8)
- Calculate total price
- Confirm booking
- Store booking in database

## Known Issues to Check

### 1. Server Not Running
**Problem**: If server isn't running, nothing will work
**Solution**: 
```bash
cd backend
npm start
```

### 2. Database Not Seeded
**Problem**: No movies/shows/seats in database
**Solution**:
```bash
cd backend
npm run seed
```
Or use the reset endpoint:
```bash
Invoke-WebRequest -Uri http://localhost:5000/reset-db -Method POST
```

### 3. ES Modules Error
**Problem**: "Cannot use import statement outside a module"
**Check**: backend/package.json should have `"type": "module"`

### 4. MongoDB Not Running
**Problem**: Connection errors
**Solution**: Start MongoDB service

### 5. CORS Issues
**Problem**: Frontend can't connect to backend
**Check**: Backend has `cors()` middleware enabled

## UI Components to Test

### Homepage
- [ ] Movie cards display
- [ ] Movie posters load
- [ ] Click on movie navigates to details
- [ ] Admin sees "Add Movie" button
- [ ] Admin can delete movies

### Movie Details Page
- [ ] Movie banner displays with poster background
- [ ] Date selector shows 7 days
- [ ] Filter buttons visible
- [ ] Theatre cards show with heart icon
- [ ] Showtime slots display with time and "Available"
- [ ] Click on time slot navigates to seat selection
- [ ] Admin sees "+ Add Show" button
- [ ] Admin can delete shows (× button)

### Seat Selection Page
- [ ] Screen indicator at top
- [ ] Seat grid displays (8 rows x 10 columns)
- [ ] Seats are color-coded (all green for available)
- [ ] Legend shows: Available, Selected, Sold
- [ ] Click seat to select (adds black border)
- [ ] Selected count updates
- [ ] Total price updates
- [ ] "Pay ₹X" button enables when seats selected
- [ ] Book button works and shows confirmation
- [ ] Redirects to homepage after booking

## Common Problems & Solutions

### 1. "Cannot read properties of undefined"
**Cause**: Data not loaded from backend
**Fix**: Check network tab, verify API responses

### 2. Seats not displaying
**Cause**: No seats in database for that show
**Fix**: Re-seed database or add show through admin panel

### 3. Booking button not enabling
**Cause**: JavaScript not detecting seat selection
**Fix**: Check browser console for errors

### 4. Styles not applying
**Cause**: CSS file not loaded or cached
**Fix**: Hard refresh (Ctrl+Shift+R) or clear cache

### 5. Admin features not showing
**Cause**: Not logged in as admin
**Fix**: Login with admin/admin123

## Testing Checklist

### As Regular User
1. Sign up with new account
2. Login
3. Browse movies
4. Click on a movie
5. Select a date
6. Choose a theatre and time
7. Select seats
8. Complete booking
9. Verify booking confirmation

### As Admin
1. Login as admin (admin/admin123)
2. Add a new movie
3. Click on movie
4. Add a show
5. Delete a show
6. Go back to homepage
7. Delete a movie

## API Endpoints

### Authentication
- POST `/signup` - Create new user
- POST `/login` - Login user

### Movies
- GET `/movies` - Get all movies
- POST `/movies` - Add movie (admin)
- DELETE `/movies/:id` - Delete movie (admin)

### Shows
- GET `/shows/:movie_id` - Get shows for movie
- POST `/shows` - Add show (admin)
- DELETE `/shows/:id` - Delete show (admin)

### Seats
- GET `/seats/:show_id` - Get seats for show

### Booking
- POST `/book` - Book seats
- GET `/bookings/:user_id` - Get user bookings

### Utility
- POST `/reset-db` - Reset and reseed database

## Browser Console Commands for Testing

```javascript
// Check if API is reachable
fetch('http://localhost:5000/movies').then(r => r.json()).then(console.log)

// Check current user
console.log(CURRENT_USER)

// Check selected seats
console.log(SELECTED_SEATS)

// Check all seats data
console.log(ALL_SEATS_DATA)
```

## Next Steps if Still Not Working

1. Open browser DevTools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed API calls
4. Verify MongoDB is running
5. Verify backend server is running on port 5000
6. Check if database has data (use MongoDB Compass or mongosh)
