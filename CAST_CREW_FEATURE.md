# Cast & Crew Management Feature

## ✅ Backend Changes Complete

### Database Schema Updated
- Added `cast` array to Movie schema with:
  - `name`: String
  - `role`: String  
  - `photo_url`: String

- Added `crew` array to Movie schema with same structure

### New API Endpoint
**PUT `/movies/:id/cast-crew`** (Admin only)
- Updates cast and crew for a movie
- Requires authentication token
- Returns updated movie data

## ✅ Frontend Changes Complete

### Display Features
1. **Cast Section**
   - Shows cast members from database
   - Displays photo, name, and role
   - Falls back to icon if no photo
   - Shows "No cast information" if empty

2. **Crew Section**
   - Shows crew members from database
   - Displays photo, name, and role
   - Falls back to icon if no photo
   - Shows "No crew information" if empty

3. **Admin Controls**
   - "Manage Cast" button (admin only)
   - "Manage Crew" button (admin only)
   - Section headers with manage buttons

## 🚧 TODO: Add Management Modal

You need to add the `manageCastCrew()` function and modal UI. Here's what to add to `script.js`:

```javascript
// Global variable to store current movie ID for cast/crew management
let CURRENT_MANAGE_MOVIE_ID = null;
let CURRENT_MANAGE_TYPE = null; // 'cast' or 'crew'

// Open cast/crew management modal
async function manageCastCrew(movieId, type) {
    CURRENT_MANAGE_MOVIE_ID = movieId;
    CURRENT_MANAGE_TYPE = type;
    
    // Fetch current movie data
    const res = await fetch(`${API_BASE}/movies`);
    const movies = await res.json();
    const movie = movies.find(m => (m.movie_id || m._id) == movieId);
    
    const members = type === 'cast' ? (movie.cast || []) : (movie.crew || []);
    
    // Create modal HTML
    const modalHTML = `
        <div id="cast-crew-modal" class="modal">
            <div class="modal-content cast-crew-modal-content">
                <span class="close" onclick="closeCastCrewModal()">&times;</span>
                <h2>Manage ${type === 'cast' ? 'Cast' : 'Crew'}</h2>
                
                <div id="members-list">
                    ${members.map((member, index) => `
                        <div class="member-item">
                            <input type="text" placeholder="Name" value="${member.name}" id="${type}-name-${index}">
                            <input type="text" placeholder="Role" value="${member.role}" id="${type}-role-${index}">
                            <input type="text" placeholder="Photo URL" value="${member.photo_url || ''}" id="${type}-photo-${index}">
                            <button onclick="removeMember(${index})">Remove</button>
                        </div>
                    `).join('')}
                </div>
                
                <button onclick="addMemberField()">+ Add Member</button>
                <button onclick="saveCastCrew()">Save Changes</button>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existing = document.getElementById('cast-crew-modal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('cast-crew-modal').classList.remove('hidden');
}

function closeCastCrewModal() {
    const modal = document.getElementById('cast-crew-modal');
    if (modal) modal.remove();
}

function addMemberField() {
    const list = document.getElementById('members-list');
    const index = list.children.length;
    const type = CURRENT_MANAGE_TYPE;
    
    const memberHTML = `
        <div class="member-item">
            <input type="text" placeholder="Name" id="${type}-name-${index}">
            <input type="text" placeholder="Role" id="${type}-role-${index}">
            <input type="text" placeholder="Photo URL" id="${type}-photo-${index}">
            <button onclick="removeMember(${index})">Remove</button>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', memberHTML);
}

function removeMember(index) {
    const items = document.querySelectorAll('.member-item');
    if (items[index]) items[index].remove();
}

async function saveCastCrew() {
    const type = CURRENT_MANAGE_TYPE;
    const items = document.querySelectorAll('.member-item');
    const members = [];
    
    items.forEach((item, index) => {
        const name = document.getElementById(`${type}-name-${index}`)?.value;
        const role = document.getElementById(`${type}-role-${index}`)?.value;
        const photo_url = document.getElementById(`${type}-photo-${index}`)?.value;
        
        if (name && role) {
            members.push({ name, role, photo_url });
        }
    });
    
    try {
        const body = type === 'cast' ? { cast: members, crew: [] } : { cast: [], crew: members };
        
        // If updating only one type, fetch current data first
        const res = await fetch(`${API_BASE}/movies`);
        const movies = await res.json();
        const movie = movies.find(m => (m.movie_id || m._id) == CURRENT_MANAGE_MOVIE_ID);
        
        const updateBody = {
            cast: type === 'cast' ? members : (movie.cast || []),
            crew: type === 'crew' ? members : (movie.crew || [])
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
        loadDetailsPage(movie);
    } catch (err) {
        alert('Error: ' + err.message);
    }
}
```

## CSS Needed

Add to `additional-styles.css`:

```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0;
}

.manage-btn {
  background: #dc3558;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.manage-btn:hover {
  background: #c62947;
}

.cast-image,
.crew-image {
  background-size: cover;
  background-position: center;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 2rem;
  font-style: italic;
}

.cast-crew-modal-content {
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.member-item {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr auto;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  padding: 0.8rem;
  background: #f9f9f9;
  border-radius: 6px;
}

.member-item input {
  padding: 0.5rem;
  border: 1px solid #d5d5d5;
  border-radius: 4px;
}

.member-item button {
  background: #ff4444;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
```

## How It Works

1. Admin clicks "Manage Cast" or "Manage Crew"
2. Modal opens showing current members
3. Admin can:
   - Edit existing members (name, role, photo URL)
   - Add new members
   - Remove members
4. Click "Save Changes"
5. Data sent to backend
6. Page reloads to show updated cast/crew

## Features

✅ Database storage for cast/crew
✅ Photo URL support
✅ Admin-only management
✅ Add/Edit/Remove members
✅ Fallback icons when no photo
✅ Clean UI with manage buttons
✅ Real-time updates

