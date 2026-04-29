// =========================================
// 1. GLOBAL VARIABLES
// =========================================
let map;
let currentRoomMarker;
let collegeMarker;
let routeLine;
let currentRoomCoords = { lat: 0, lng: 0 };
const STORAGE_KEY = 'eduroom_listings'; // Key for Local Storage

// =========================================
// 2. INITIALIZATION & DATA LOADING
// =========================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load Search Listener
  const searchInput = document.getElementById('searchInput');
  if(searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // 2. Load Stored Rooms from Local Storage
  loadStoredRooms();
});

function loadStoredRooms() {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    const rooms = JSON.parse(storedData);
    // Iterate and render each room
    rooms.forEach(room => {
      createAndAppendCard(room);
    });
  }
}

// Helper to create HTML and append to grid
function createAndAppendCard(room) {
  // Check if card already exists to prevent duplicates (optional safety)
  if (document.querySelector(`.room-card[data-id="${room.id}"]`)) return;

  // Generate Icon HTML
  let iconsHtml = '';
  const amenitiesList = room.amenities ? room.amenities.split(',') : [];
  if(amenitiesList.includes('wifi')) iconsHtml += `<i class='bx bx-wifi' title="WiFi"></i>`;
  if(amenitiesList.includes('ac')) iconsHtml += `<i class='bx bx-wind' title="AC"></i>`;
  if(amenitiesList.includes('gym')) iconsHtml += `<i class='bx bx-dumbbell' title="Gym"></i>`;

  const newCardHTML = `
    <img src="${room.image}" alt="${room.title}" onerror="this.src='hero.png'"/>
    <div class="card-details">
      <div class="card-header">
        <h3>${room.title}</h3>
        <i class='bx bx-heart save-btn' onclick="toggleSave(this)"></i>
      </div>
      <p class="price">$${room.price}/month</p>
      <p class="address"><i class='bx bx-map'></i> ${room.address}</p>
      
      <div class="amenities-display">
         ${iconsHtml}
      </div>

      <p class="status active">Status: Active</p>
      <button onclick="viewDetails(this)">View Details & Map</button>
    </div>
  `;

  const newCard = document.createElement('div');
  newCard.className = 'room-card';
  newCard.setAttribute('data-id', room.id);
  newCard.setAttribute('data-title', room.title);
  newCard.setAttribute('data-address', room.address);
  newCard.setAttribute('data-price', room.price);
  newCard.setAttribute('data-lat', room.lat);
  newCard.setAttribute('data-lng', room.lng);
  newCard.setAttribute('data-amenities', room.amenities);
  newCard.setAttribute('data-date', room.date);
  newCard.innerHTML = newCardHTML;

  const grid = document.getElementById('roomsGrid');
  if (grid) {
    grid.prepend(newCard); // Add to top
    // Update Stats
    const countEl = document.getElementById('activeListingsCount');
    if(countEl) countEl.innerText = parseInt(countEl.innerText) + 1;
  }
}

// =========================================
// 3. ADD ROOM LOGIC (Updated with Storage)
// =========================================

async function addNewRoom(event) {
  event.preventDefault();
  
  const title = document.getElementById('newRoomTitle').value;
  const address = document.getElementById('newRoomAddress').value;
  const price = document.getElementById('newRoomPrice').value;
  const image = document.getElementById('newRoomImage').value;

  // Capture Amenities
  const amenities = [];
  if(document.getElementById('checkWifi').checked) amenities.push('wifi');
  if(document.getElementById('checkAc').checked) amenities.push('ac');
  if(document.getElementById('checkGym').checked) amenities.push('gym');

  // Loading State
  const submitBtn = event.target.querySelector('.input-submit');
  const originalText = submitBtn.value;
  submitBtn.value = "Locating Address...";

  // Get Coordinates
  const coords = await getCoordinates(address);
  const lat = coords ? coords.lat : 40.7128; 
  const lng = coords ? coords.lng : -74.0060;
  
  if (!coords) alert("Could not find exact address. Using default location.");

  // Create Data Object
  const newRoomData = {
    id: 'room-' + Date.now(),
    title: title,
    address: address,
    price: price,
    image: image,
    lat: lat,
    lng: lng,
    amenities: amenities.join(','),
    date: new Date().toISOString().split('T')[0]
  };

  // 1. Render to DOM
  createAndAppendCard(newRoomData);

  // 2. Save to Local Storage
  const storedRooms = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  storedRooms.push(newRoomData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedRooms));

  // Reset UI
  submitBtn.value = originalText;
  alert("Room listed successfully!");
  closeAddRoomModal();
  event.target.reset();
  
  // Re-apply filters
  applyFilters();
}

// =========================================
// 4. NAVIGATION & AUTH
// =========================================

function logoutUser() {
  if (confirm("Are you sure you want to log out?")) {
    window.location.href = "index.html";
  }
}

function switchSection(sectionId, navItem) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById(sectionId + '-section').style.display = 'block';
  document.querySelectorAll('.sidebar-menu li').forEach(li => {
    li.classList.remove('active');
  });
  navItem.classList.add('active');
  const titles = {
    'dashboard': 'Overview',
    'saved': 'Saved Rooms',
    'messages': 'Messages',
    'settings': 'Settings'
  };
  document.getElementById('page-title').innerText = titles[sectionId];
}

// =========================================
// 5. FILTERING LOGIC
// =========================================

function toggleFilterPanel() {
  const panel = document.getElementById('filterPanel');
  if (panel.style.display === 'flex') {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'flex';
  }
}

function updatePriceLabel(val) {
  document.getElementById('priceValue').innerText = '$' + val;
}

function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
  const maxPrice = parseInt(document.getElementById('priceRange').value);
  const sortOrder = document.getElementById('sortOrder').value;
  const selectedAmenities = Array.from(document.querySelectorAll('.checkbox-group input:checked')).map(cb => cb.value);

  const roomsGrid = document.getElementById('roomsGrid');
  const cards = Array.from(roomsGrid.getElementsByClassName('room-card'));

  cards.forEach(card => {
    let isVisible = true;
    const title = (card.getAttribute('data-title') || '').toLowerCase();
    const address = (card.getAttribute('data-address') || '').toLowerCase();
    
    if (!title.includes(searchTerm) && !address.includes(searchTerm)) isVisible = false;
    
    const price = parseInt(card.getAttribute('data-price') || 0);
    if (price > maxPrice) isVisible = false;

    const cardAmenities = (card.getAttribute('data-amenities') || '').split(',');
    const hasAllAmenities = selectedAmenities.every(amenity => cardAmenities.includes(amenity));
    if (selectedAmenities.length > 0 && !hasAllAmenities) isVisible = false;

    card.style.display = isVisible ? '' : 'none';
  });

  const visibleCards = cards.filter(c => c.style.display !== 'none');
  visibleCards.sort((a, b) => {
    const priceA = parseInt(a.getAttribute('data-price'));
    const priceB = parseInt(b.getAttribute('data-price'));
    const dateA = new Date(a.getAttribute('data-date') || '2000-01-01');
    const dateB = new Date(b.getAttribute('data-date') || '2000-01-01');

    if (sortOrder === 'price-low') return priceA - priceB;
    if (sortOrder === 'price-high') return priceB - priceA;
    if (sortOrder === 'newest') return dateB - dateA;
    return 0;
  });

  visibleCards.forEach(card => roomsGrid.appendChild(card));
}

// =========================================
// 6. SAVED ROOMS LOGIC
// =========================================

function toggleSave(btn) {
  btn.classList.toggle('bx-heart');
  btn.classList.toggle('bxs-heart');

  const card = btn.closest('.room-card');
  const cardId = card.getAttribute('data-id') || 'room-' + Date.now();
  if(!card.getAttribute('data-id')) card.setAttribute('data-id', cardId);

  const savedGrid = document.getElementById('savedGrid');
  const emptyState = document.getElementById('emptySavedState');

  if (btn.classList.contains('bxs-heart')) {
    const clone = card.cloneNode(true);
    const cloneBtn = clone.querySelector('.save-btn');
    cloneBtn.classList.remove('bx-heart');
    cloneBtn.classList.add('bxs-heart');
    cloneBtn.setAttribute('onclick', 'toggleSave(this)');
    savedGrid.appendChild(clone);
    alert("Room saved to favorites!");
  } else {
    if (card.parentElement.id === 'savedGrid') {
        card.remove();
        const originalCard = document.querySelector(`#roomsGrid .room-card[data-id="${cardId}"] .save-btn`);
        if(originalCard) {
            originalCard.classList.add('bx-heart');
            originalCard.classList.remove('bxs-heart');
        }
    } else {
        const savedCard = document.querySelector(`#savedGrid .room-card[data-id="${cardId}"]`);
        if(savedCard) savedCard.remove();
    }
  }

  if (savedGrid.children.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
  }
}

// =========================================
// 7. MODAL, MAP, & GEOLOCATION
// =========================================

const addRoomModal = document.getElementById('addRoomModal');
function openAddRoomModal() { 
  addRoomModal.classList.add('show');
  document.body.style.overflow = 'hidden'; 
}
function closeAddRoomModal() { 
  addRoomModal.classList.remove('show');
  document.body.style.overflow = ''; 
}

const detailsModal = document.getElementById('roomDetailsModal');
function closeDetailsModal() { 
  detailsModal.classList.remove('show');
  document.body.style.overflow = ''; 
}

function initMap(lat, lng) {
  if (map) map.remove();
  map = L.map('map').setView([lat, lng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  currentRoomMarker = L.marker([lat, lng]).addTo(map).bindPopup("<b>Room Location</b>").openPopup();
}

function viewDetails(buttonElement) {
  const card = buttonElement.closest('.room-card');
  const title = card.getAttribute('data-title');
  const address = card.getAttribute('data-address');
  const lat = parseFloat(card.getAttribute('data-lat'));
  const lng = parseFloat(card.getAttribute('data-lng'));

  document.getElementById('detailTitle').innerText = title;
  document.getElementById('detailAddress').innerHTML = `<i class='bx bx-map'></i> ${address}`;
  document.getElementById('distanceResult').innerText = "";
  document.getElementById('collegeAddress').value = "";
  const dateInput = document.getElementById('visitDate');
  if(dateInput) dateInput.value = ""; 

  currentRoomCoords = { lat, lng };
  detailsModal.classList.add('show');
  document.body.style.overflow = 'hidden'; 
  setTimeout(() => { initMap(lat, lng); map.invalidateSize(); }, 300);
}

async function getCoordinates(address) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await response.json();
    if (data && data.length > 0) return { lat: data[0].lat, lng: data[0].lon };
    else throw new Error("Address not found");
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

async function calculateDistance() {
  const collegeName = document.getElementById('collegeAddress').value;
  if (!collegeName) return alert("Please enter a college name.");
  const collegeCoords = await getCoordinates(collegeName);
  if (!collegeCoords) return alert("College address not found.");

  if (collegeMarker) map.removeLayer(collegeMarker);
  collegeMarker = L.marker([collegeCoords.lat, collegeCoords.lng]).addTo(map).bindPopup("<b>" + collegeName + "</b>").openPopup();

  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline([[currentRoomCoords.lat, currentRoomCoords.lng], [collegeCoords.lat, collegeCoords.lng]], {color: 'red'}).addTo(map);
  map.fitBounds(routeLine.getBounds());

  const dist = getDistanceFromLatLonInKm(currentRoomCoords.lat, currentRoomCoords.lng, collegeCoords.lat, collegeCoords.lng);
  document.getElementById('distanceResult').innerText = `Distance: ${dist.toFixed(2)} km`;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; 
  var dLat = deg2rad(lat2-lat1);  
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}
function deg2rad(deg) { return deg * (Math.PI/180) }

// =========================================
// 8. CHAT & VISIT LOGIC
// =========================================

function requestVisit() {
  const dateInput = document.getElementById('visitDate').value;
  if (!dateInput) return alert("Please select a date and time.");
  
  const roomTitle = document.getElementById('detailTitle').innerText;
  const visitDate = new Date(dateInput).toLocaleString();
  const btn = document.querySelector('.scheduling-section button');
  const originalText = btn.innerText;
  
  btn.innerText = "Requesting...";
  btn.disabled = true;
  
  setTimeout(() => {
    alert(`Visit requested for ${roomTitle} on ${visitDate}. Check messages!`);
    addSystemMessage(roomTitle, visitDate);
    btn.innerText = originalText;
    btn.disabled = false;
    closeDetailsModal();
  }, 1000);
}

function addSystemMessage(roomTitle, date) {
  const msgList = document.getElementById('inboxList');
  if(!msgList) return; 
  const newMsgHTML = `
      <div class="msg-info"><h4 style="color: #27ae60">System Notification</h4><p>Visit pending: ${roomTitle}</p></div>
      <span class="msg-time">Just now</span>`;
  const tempDiv = document.createElement('div');
  tempDiv.className = "msg-item";
  tempDiv.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/10309/10309282.png" alt="System" style="padding:5px;">` + newMsgHTML;
  msgList.prepend(tempDiv);
  
  const badge = document.getElementById('msgCount');
  if(badge) badge.innerText = (parseInt(badge.innerText)||0) + 1 + " New";
}

const conversations = {
  'user1': { name: 'John Doe', status: 'Online', messages: [{text:'Hi, is this available?', type:'received'}] },
  'user2': { name: 'Jane Smith', status: 'Offline', messages: [{text:'Can I visit tomorrow?', type:'received'}] }
};
let currentChatUser = 'user1';

function switchChat(userId, element) {
  currentChatUser = userId;
  document.querySelectorAll('.msg-item').forEach(item => item.classList.remove('active'));
  if (element) element.classList.add('active');
  
  const data = conversations[userId];
  if (!data) return;
  
  document.querySelector('.chat-header h4').innerText = data.name;
  document.querySelector('.chat-header span').innerText = data.status;
  
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.innerHTML = '';
  data.messages.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${msg.type}`;
    bubble.innerText = msg.text;
    chatWindow.appendChild(bubble);
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function handleChatKey(event) { if (event.key === 'Enter') sendMessage(); }

function sendMessage() {
  const input = document.getElementById('chatInput');
  const txt = input.value.trim();
  if (!txt) return;
  
  // Create bubble
  const chatWindow = document.getElementById('chatWindow');
  const bubble = document.createElement('div');
  bubble.className = 'bubble sent';
  bubble.innerText = txt;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  input.value = "";
  
  // Save to history (optional)
  if(conversations[currentChatUser]) conversations[currentChatUser].messages.push({text:txt, type:'sent'});

  // Mock Reply
  setTimeout(() => {
    const reply = document.createElement('div');
    reply.className = 'bubble received';
    reply.innerText = "Thanks for your message! I'll get back to you shortly.";
    chatWindow.appendChild(reply);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 1500);
}

// Global Close
window.onclick = function(event) {
  if (event.target == addRoomModal) closeAddRoomModal();
  if (event.target == detailsModal) closeDetailsModal();
}