// Map functionality for photo locations

let map;
let photoMarkers = [];
let photosData = [];
let currentPreviewPhoto = null;
let clusteringEnabled = false;

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    loadPhotosWithLocations();
    
    // Check if we need to locate a specific photo
    checkForPhotoLocation();
});

// Check for photo location from URL parameters or sessionStorage
function checkForPhotoLocation() {
    const urlParams = new URLSearchParams(window.location.search);
    const locateFilename = urlParams.get('locate');
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');
    
    if (locateFilename && lat && lng) {
        // Use URL parameters
        setTimeout(() => {
            locateSpecificPhoto(locateFilename, parseFloat(lat), parseFloat(lng));
        }, 1000); // Wait for map to load
    } else {
        // Check sessionStorage
        const storedLocation = sessionStorage.getItem('locatePhoto');
        if (storedLocation) {
            try {
                const photoLocation = JSON.parse(storedLocation);
                const now = new Date().getTime();
                
                // Check if the stored location is recent (within 1 minute)
                if (now - photoLocation.timestamp < 60000) {
                    setTimeout(() => {
                        locateSpecificPhoto(photoLocation.filename, photoLocation.latitude, photoLocation.longitude);
                    }, 1000);
                }
                
                // Clear the stored location
                sessionStorage.removeItem('locatePhoto');
            } catch (e) {
                console.warn('Could not parse stored photo location:', e);
            }
        }
    }
}

// Locate a specific photo on the map
function locateSpecificPhoto(filename, latitude, longitude) {
    // Set map view to the photo location
    map.setView([latitude, longitude], 16);
    
    // Find the marker for this photo and open its popup
    const targetPhoto = photosData.find(photo => photo.filename === filename);
    if (targetPhoto) {
        const targetMarker = photoMarkers.find(marker => {
            const markerLatLng = marker.getLatLng();
            return Math.abs(markerLatLng.lat - latitude) < 0.000001 && 
                   Math.abs(markerLatLng.lng - longitude) < 0.000001;
        });
        
        if (targetMarker) {
            targetMarker.openPopup();
            showMessage(`Located "${filename}" on the map!`, 'success');
        }
    }
    
    // Add a temporary highlight marker
    const highlightMarker = L.marker([latitude, longitude], {
        icon: L.divIcon({
            className: 'highlight-marker',
            html: '<div class="highlight-pulse"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(map);
    
    // Remove highlight after 5 seconds
    setTimeout(() => {
        map.removeLayer(highlightMarker);
    }, 5000);
}

// Initialize Leaflet map
function initializeMap() {
    // Create map centered on a default location (will be updated when photos are loaded)
    map = L.map('map').setView([40.7128, -74.0060], 2); // Default: New York

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    console.log('Map initialized');
}

// Load photos with location data from the server
async function loadPhotosWithLocations() {
    try {
        const response = await fetch('/api/photos-with-locations');
        const result = await response.json();
        
        if (result.success) {
            photosData = result.photos;
            displayPhotosOnMap();
            updatePhotoCount();
        } else {
            console.error('Failed to load photos:', result.message);
            updatePhotoCount(0);
        }
    } catch (error) {
        console.error('Error loading photos:', error);
        updatePhotoCount(0);
    }
}

// Display photos on map
function displayPhotosOnMap() {
    // Clear existing markers
    clearMarkers();
    
    const photosWithLocation = photosData.filter(photo => photo.location);
    
    if (photosWithLocation.length === 0) {
        updatePhotoCount(0);
        showMessage('No photos with location data found. Enable location access when taking photos to see them on the map.', 'info');
        return;
    }
    
    // Add markers for each photo
    photosWithLocation.forEach(photo => {
        const marker = L.marker([photo.location.latitude, photo.location.longitude])
            .addTo(map);
        
        // Create popup content
        const popupContent = createPopupContent(photo);
        marker.bindPopup(popupContent);
        
        // Add click event to show preview
        marker.on('click', () => {
            showPhotoPreview(photo);
        });
        
        photoMarkers.push(marker);
    });
    
    // Fit map to show all markers
    if (photoMarkers.length > 0) {
        const group = new L.featureGroup(photoMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
    
    updatePhotoCount(photosWithLocation.length, photosData.length);
    console.log(`Displayed ${photosWithLocation.length} photos on map`);
}

// Create popup content for a photo marker
function createPopupContent(photo) {
    const date = photo.created_at ? new Date(photo.created_at).toLocaleDateString() : 'Unknown date';
    const accuracy = photo.location.accuracy ? ` (±${Math.round(photo.location.accuracy)}m)` : '';
    
    return `
        <div class="map-popup">
            <img src="${photo.url}" alt="Photo" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px;">
            <div class="popup-info">
                <h4>${photo.filename}</h4>
                <p><i class="fas fa-calendar"></i> ${date}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${photo.location.latitude.toFixed(6)}, ${photo.location.longitude.toFixed(6)}${accuracy}</p>
                <button class="btn btn-sm btn-primary" onclick="showPhotoPreview('${photo.filename}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        </div>
    `;
}

// Show photo preview modal
function showPhotoPreview(photoOrFilename) {
    let photo;
    if (typeof photoOrFilename === 'string') {
        photo = photosData.find(p => p.filename === photoOrFilename);
    } else {
        photo = photoOrFilename;
    }
    
    if (!photo) return;
    
    currentPreviewPhoto = photo;
    
    document.getElementById('previewImg').src = photo.url;
    document.getElementById('previewFilename').textContent = photo.filename;
    
    if (photo.location) {
        const accuracy = photo.location.accuracy ? ` (±${Math.round(photo.location.accuracy)}m accuracy)` : '';
        document.getElementById('previewLocation').innerHTML = 
            `<i class="fas fa-map-marker-alt"></i> ${photo.location.latitude.toFixed(6)}, ${photo.location.longitude.toFixed(6)}${accuracy}`;
    } else {
        document.getElementById('previewLocation').innerHTML = '<i class="fas fa-map-marker-alt"></i> No location data';
    }
    
    if (photo.created_at) {
        const date = new Date(photo.created_at);
        document.getElementById('previewDate').innerHTML = 
            `<i class="fas fa-calendar"></i> ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
    } else {
        document.getElementById('previewDate').innerHTML = '<i class="fas fa-calendar"></i> Unknown date';
    }
    
    document.getElementById('photoPreview').style.display = 'flex';
}

// Close photo preview
function closePreview() {
    document.getElementById('photoPreview').style.display = 'none';
    currentPreviewPhoto = null;
}

// View photo in gallery
function viewInGallery() {
    window.location.href = '/gallery';
}

// Delete current preview photo
async function deletePhoto() {
    if (!currentPreviewPhoto) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete "${currentPreviewPhoto.filename}"?`);
    if (!confirmDelete) return;
    
    try {
        const response = await fetch('/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filenames: [currentPreviewPhoto.filename] })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Photo deleted successfully', 'success');
            closePreview();
            loadPhotosWithLocations(); // Refresh the map
        } else {
            showMessage('Failed to delete photo: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting photo:', error);
        showMessage('Error deleting photo', 'error');
    }
}

// Find user's current location
function findMyLocation() {
    if (!navigator.geolocation) {
        showMessage('Geolocation is not supported by this browser', 'error');
        return;
    }
    
    const findBtn = document.getElementById('findMeBtn');
    const originalText = findBtn.innerHTML;
    findBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding...';
    findBtn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            map.setView([lat, lng], 15);
            
            // Add a temporary marker for current location
            const currentLocationMarker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup('<b>Your current location</b>')
                .openPopup();
            
            // Remove the marker after 5 seconds
            setTimeout(() => {
                map.removeLayer(currentLocationMarker);
            }, 5000);
            
            showMessage('Found your location!', 'success');
            
            findBtn.innerHTML = originalText;
            findBtn.disabled = false;
        },
        (error) => {
            let errorMessage = 'Could not get your location: ';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Permission denied';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Position unavailable';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Request timeout';
                    break;
                default:
                    errorMessage += 'Unknown error';
                    break;
            }
            
            showMessage(errorMessage, 'error');
            
            findBtn.innerHTML = originalText;
            findBtn.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

// Show all photos on map
function showAllPhotos() {
    displayPhotosOnMap();
    
    // Update button states
    document.getElementById('showAllBtn').classList.add('active');
    document.getElementById('clusterBtn').classList.remove('active');
}

// Toggle clustering (placeholder for future enhancement)
function toggleClustering() {
    clusteringEnabled = !clusteringEnabled;
    
    if (clusteringEnabled) {
        showMessage('Clustering enabled (feature coming soon)', 'info');
        document.getElementById('clusterBtn').classList.add('active');
        document.getElementById('showAllBtn').classList.remove('active');
    } else {
        showMessage('Clustering disabled', 'info');
        document.getElementById('clusterBtn').classList.remove('active');
        document.getElementById('showAllBtn').classList.add('active');
    }
}

// Clear all markers from map
function clearMarkers() {
    photoMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    photoMarkers = [];
}

// Update photo count display
function updatePhotoCount(withLocation = 0, total = 0) {
    const countElement = document.getElementById('photoCount');
    if (total === 0) {
        countElement.textContent = 'No photos found';
    } else if (withLocation === 0) {
        countElement.textContent = `${total} photos (none with location data)`;
    } else {
        countElement.textContent = `${withLocation} of ${total} photos with location`;
    }
}

// Show message to user
function showMessage(message, type = 'info') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Show with animation
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Handle window resize
window.addEventListener('resize', () => {
    if (map) {
        map.invalidateSize();
    }
});