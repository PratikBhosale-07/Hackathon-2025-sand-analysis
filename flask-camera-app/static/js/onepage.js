// One-page website functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navbar functionality
    initializeNavbar();
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    // Initialize scroll animations
    initializeScrollAnimations();
    
    // Initialize map
    initializePhotoMap();
    
    // Update active nav link on scroll
    updateActiveNavOnScroll();
    
    // Initialize upload functionality
    initializeUploadFunctionality();
    
    // Initialize scroll validation
    setTimeout(() => {
        initializeScrollValidation();
    }, 500);
});

// Navigation fun// Load analysis images function
function loadAnalysisImages() {
    const scrollContainer = document.getElementById('validationScroll');
    if (!scrollContainer) return;
    
    // Add loading state
    const originalContent = scrollContainer.innerHTML;
    
    scrollContainer.innerHTML = `
        <div class="analysis-loading" style="text-align: center; padding: 3rem; color: var(--text-light); min-width: 100%;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--accent-blue); margin-bottom: 1rem;"></i>
            <p>Refreshing analysis data...</p>
        </div>
    `;
    
    // Simulate loading delay and restore scroll container
    setTimeout(() => {
        scrollContainer.innerHTML = originalContent;
        console.log('Analysis images refreshed successfully');
        initializeScrollValidation();
    }, 2000);
}

// Navigation functionality
function initializeNavbar() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking on nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

// Smooth scrolling functionality
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for navbar height
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll to section function
function scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
        const offsetTop = target.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Scroll animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const isAnalysisSection = entry.target.id === 'analysis';
            
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                if (isAnalysisSection) {
                    entry.target.classList.remove('animate-out');
                }
            } else {
                // Special handling for analysis section - hide it when not in view
                if (isAnalysisSection) {
                    entry.target.classList.remove('animate-in');
                    entry.target.classList.add('animate-out');
                }
            }
        });
    }, observerOptions);
    
    // Observe all sections and cards
    document.querySelectorAll('section, .option-card, .gallery-item').forEach(el => {
        observer.observe(el);
    });
}

// Update active navigation link based on scroll position
function updateActiveNavOnScroll() {
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link:not(.gallery-btn)');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Gallery Modal functionality
let selectMode = false;
let selectedPhotos = [];

function openGalleryModal() {
    const modal = document.getElementById('galleryModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Load photos when opening modal
        loadGalleryPhotos();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

function closeGalleryModal() {
    const modal = document.getElementById('galleryModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            // Restore body scroll
            document.body.style.overflow = 'auto';
        }, 300);
        
        // Reset selection mode when closing
        if (selectMode) {
            cancelSelectMode();
        }
    }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeGalleryModal();
    }
});

// Upload functionality
function initializeUploadFunctionality() {
    const heroFileInput = document.getElementById('heroFileInput');
    const fileInput = document.getElementById('fileInput');
    
    if (heroFileInput) {
        heroFileInput.addEventListener('change', handleFileUpload);
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        showStatusMessage(`Uploading ${files.length} file(s)...`, 'info');
        
        // Process each file
        for (let i = 0; i < files.length; i++) {
            uploadSingleFile(files[i]);
        }
    }
}

function uploadSingleFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Get location if available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                formData.append('latitude', position.coords.latitude);
                formData.append('longitude', position.coords.longitude);
                performUpload(formData, file.name);
            },
            (error) => {
                console.log('Geolocation error:', error);
                performUpload(formData, file.name);
            },
            { timeout: 5000 }
        );
    } else {
        performUpload(formData, file.name);
    }
}

function performUpload(formData, filename) {
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStatusMessage(`Successfully uploaded ${filename}`, 'success');
            
            // Refresh gallery if it's open
            const modal = document.getElementById('galleryModal');
            if (modal && modal.classList.contains('show')) {
                loadGalleryPhotos();
            }
            
            // Refresh map markers
            if (window.map) {
                loadPhotoMarkers();
            }
        } else {
            showStatusMessage(`Failed to upload ${filename}: ${data.message || 'Unknown error'}`, 'error');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showStatusMessage(`Error uploading ${filename}`, 'error');
    });
}

// Analysis functionality
function loadAnalysisData() {
    const analysisGrid = document.getElementById('analysisGrid');
    if (!analysisGrid) return;
    
    analysisGrid.innerHTML = `
        <div class="analysis-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading analysis data...</p>
        </div>
    `;
    
    fetch('/api/photos-with-locations')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.photos) {
                displayAnalysisData(data.photos);
            } else {
                analysisGrid.innerHTML = '<div class="analysis-loading"><i class="fas fa-exclamation-triangle"></i><p>No analysis data available</p></div>';
            }
        })
        .catch(error => {
            console.error('Error loading analysis data:', error);
            analysisGrid.innerHTML = '<div class="analysis-loading"><i class="fas fa-exclamation-triangle"></i><p>Error loading analysis data</p></div>';
        });
}

function displayAnalysisData(photos) {
    const analysisGrid = document.getElementById('analysisGrid');
    if (!analysisGrid) return;
    
    if (photos.length === 0) {
        analysisGrid.innerHTML = '<div class="analysis-loading"><i class="fas fa-camera"></i><p>No photos to analyze yet</p></div>';
        return;
    }
    
    // Generate mock analysis data for demonstration
    analysisGrid.innerHTML = photos.map(photo => {
        const analysisData = generateMockAnalysis(photo);
        return `
            <div class="analysis-item">
                <img src="${photo.url}" alt="Photo" class="analysis-image" loading="lazy">
                <div class="analysis-data">
                    <h4>${photo.filename}</h4>
                    <div class="analysis-details">
                        <div class="analysis-detail">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">${analysisData.status}</span>
                        </div>
                        <div class="analysis-detail">
                            <span class="detail-label">Confidence:</span>
                            <span class="detail-value">${analysisData.confidence}%</span>
                        </div>
                        <div class="analysis-detail">
                            <span class="detail-label">Objects Detected:</span>
                            <span class="detail-value">${analysisData.objects}</span>
                        </div>
                        <div class="analysis-detail">
                            <span class="detail-label">Quality Score:</span>
                            <span class="detail-value">${analysisData.quality}/10</span>
                        </div>
                        <div class="analysis-detail">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">${photo.location ? 'Available' : 'No GPS'}</span>
                        </div>
                        <div class="analysis-detail">
                            <span class="detail-label">Date Analyzed:</span>
                            <span class="detail-value">${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function generateMockAnalysis(photo) {
    // Generate realistic mock analysis data
    const statuses = ['Validated', 'Pending Review', 'Approved', 'In Progress'];
    const objects = ['Person, Vehicle', 'Building, Sky', 'Nature, Trees', 'Indoor, Furniture', 'Food, Kitchen'];
    
    return {
        status: statuses[Math.floor(Math.random() * statuses.length)],
        confidence: Math.floor(Math.random() * 30 + 70), // 70-100%
        objects: objects[Math.floor(Math.random() * objects.length)],
        quality: Math.floor(Math.random() * 3 + 7) // 7-10
    };
}

function filterAnalysis() {
    const filter = document.getElementById('analysisFilter').value;
    const items = document.querySelectorAll('.analysis-item');
    
    items.forEach(item => {
        const status = item.querySelector('.detail-value').textContent.toLowerCase();
        
        if (filter === 'all') {
            item.style.display = 'block';
        } else if (filter === 'validated' && status.includes('validated')) {
            item.style.display = 'block';
        } else if (filter === 'pending' && status.includes('pending')) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function loadGalleryPhotos() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    fetch('/api/photos-with-locations')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.photos) {
                displayPhotos(data.photos);
            } else {
                galleryGrid.innerHTML = '<div class="no-photos"><i class="fas fa-camera"></i><p>No photos yet. Start capturing!</p></div>';
            }
        })
        .catch(error => {
            console.error('Error loading photos:', error);
            galleryGrid.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Error loading photos</p></div>';
        });
}

function displayPhotos(photos) {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    if (photos.length === 0) {
        galleryGrid.innerHTML = '<div class="no-photos"><i class="fas fa-camera"></i><p>No photos yet. Start capturing!</p></div>';
        return;
    }
    
    galleryGrid.innerHTML = photos.map(photo => `
        <div class="gallery-item" data-filename="${photo.filename}">
            <div class="selection-checkbox" style="display: none;">
                <input type="checkbox" class="photo-select" value="${photo.filename}">
                <div class="selection-dot"></div>
            </div>
            <img src="${photo.url}" alt="Photo" loading="lazy">
            <div class="photo-info">
                ${photo.location ? `<i class="fas fa-map-marker-alt"></i>` : ''}
                <span class="photo-date">${formatDate(photo.created_at)}</span>
            </div>
            <div class="photo-actions">
                <button class="action-btn delete-btn" onclick="deletePhoto('${photo.filename}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function toggleSelectMode() {
    selectMode = !selectMode;
    const selectModeBtn = document.getElementById('selectModeBtn');
    const removeSelectedBtn = document.getElementById('removeSelectedBtn');
    const cancelSelectBtn = document.getElementById('cancelSelectBtn');
    const checkboxes = document.querySelectorAll('.selection-checkbox');
    
    if (selectMode) {
        selectModeBtn.style.display = 'none';
        removeSelectedBtn.style.display = 'inline-block';
        cancelSelectBtn.style.display = 'inline-block';
        checkboxes.forEach(cb => cb.style.display = 'block');
    } else {
        selectModeBtn.style.display = 'inline-block';
        removeSelectedBtn.style.display = 'none';
        cancelSelectBtn.style.display = 'none';
        checkboxes.forEach(cb => cb.style.display = 'none');
        selectedPhotos = [];
        document.querySelectorAll('.photo-select').forEach(cb => cb.checked = false);
    }
}

function cancelSelectMode() {
    selectMode = false;
    toggleSelectMode();
}

function deletePhoto(filename) {
    if (confirm('Are you sure you want to delete this photo?')) {
        fetch('/delete_photo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: filename })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadGalleryPhotos(); // Reload gallery
                if (window.map) {
                    loadPhotoMarkers(); // Reload map markers
                }
                showStatusMessage('Photo deleted successfully', 'success');
            } else {
                showStatusMessage('Failed to delete photo: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting photo:', error);
            showStatusMessage('Error deleting photo', 'error');
        });
    }
}

// Map functionality
let map = null;
let photoMarkers = [];

function initializePhotoMap() {
    const mapElement = document.getElementById('photoMap');
    if (!mapElement) return;
    
    // Initialize map
    map = L.map('photoMap').setView([20.5937, 78.9629], 5); // Default to India
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Load photo markers
    loadPhotoMarkers();
    
    // Load Excel locations
    loadExcelLocations();
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 10);
            },
            (error) => {
                console.log('Geolocation error:', error);
            },
            { timeout: 5000 }
        );
    }
}

function loadPhotoMarkers() {
    if (!map) return;
    
    // Clear existing markers
    photoMarkers.forEach(marker => map.removeLayer(marker));
    photoMarkers = [];
    
    fetch('/api/photos-with-locations')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.photos) {
                data.photos.forEach(photo => {
                    if (photo.location && photo.location.lat && photo.location.lng) {
                        const marker = L.marker([photo.location.lat, photo.location.lng])
                            .addTo(map)
                            .bindPopup(`
                                <div class="map-popup">
                                    <img src="${photo.url}" alt="Photo" style="width: 200px; height: auto; border-radius: 8px;">
                                    <p><strong>${formatDate(photo.created_at)}</strong></p>
                                    <p>📍 ${photo.location.lat.toFixed(6)}, ${photo.location.lng.toFixed(6)}</p>
                                </div>
                            `);
                        photoMarkers.push(marker);
                    }
                });
                
                if (photoMarkers.length > 0) {
                    const group = new L.featureGroup(photoMarkers);
                    map.fitBounds(group.getBounds().pad(0.1));
                }
            }
        })
        .catch(error => {
            console.error('Error loading photo locations:', error);
        });
}

function loadExcelLocations() {
    if (!map) return;
    
    fetch('/api/excel-locations')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.locations) {
                console.log(`Loading ${data.locations.length} locations from Excel`);
                
                data.locations.forEach(location => {
                    if (location.lat && location.lng) {
                        // Create custom icon for Excel locations (different from photo markers)
                        const excelIcon = L.divIcon({
                            className: 'excel-marker',
                            html: '<i class="fas fa-map-pin" style="color: #e74c3c; font-size: 20px;"></i>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 20]
                        });
                        
                        // Create popup content
                        let popupContent = `
                            <div class="excel-popup">
                                <h4>Location ${location.index}</h4>
                                <p><strong>Coordinates:</strong><br>
                                   📍 ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</p>
                        `;
                        
                        // Add date if available
                        if (location.date && location.date !== 'nan') {
                            popupContent += `<p><strong>Date:</strong><br>📅 ${location.date}</p>`;
                        }
                        
                        // Add image preview if available
                        if (location.image && location.image !== 'nan') {
                            // Check if image exists in uploads folder
                            const imageUrl = `/uploads/${location.image}`;
                            popupContent += `
                                <div class="image-preview">
                                    <img src="${imageUrl}" alt="Location Image" 
                                         style="width: 150px; height: auto; border-radius: 8px; margin-top: 8px;"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                    <p style="display: none; color: #999; font-size: 12px;">Image: ${location.image}</p>
                                </div>
                            `;
                        }
                        
                        popupContent += '</div>';
                        
                        // Create marker and add to map
                        const marker = L.marker([location.lat, location.lng], { icon: excelIcon })
                            .addTo(map)
                            .bindPopup(popupContent);
                        
                        photoMarkers.push(marker); // Add to photoMarkers for showAllPhotos function
                    }
                });
                
                console.log(`Added ${data.locations.length} Excel locations to map`);
                
                // Show status message if locations were loaded
                if (data.locations.length > 0) {
                    setTimeout(() => {
                        showStatusMessage(`📍 Loaded ${data.locations.length} locations from Excel file`, 'success');
                    }, 1000);
                }
            } else {
                console.log('No Excel locations found or error:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading Excel locations:', error);
        });
}

function centerMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 15);
            },
            (error) => {
                console.log('Geolocation error:', error);
                showStatusMessage('Could not get your location', 'error');
            }
        );
    }
}

function showAllPhotos() {
    if (photoMarkers.length > 0) {
        const group = new L.featureGroup(photoMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    } else {
        showStatusMessage('No photos with location data found', 'info');
    }
}

// Status message function
function showStatusMessage(message, type = 'info') {
    const statusDiv = document.getElementById('statusMessage');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

// Load analysis images function
function loadAnalysisImages() {
    const gallery = document.getElementById('analysisGallery');
    if (!gallery) return;
    
    // Add loading state
    gallery.innerHTML = `
        <div class="analysis-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading analysis images...</p>
        </div>
    `;
    
    // Simulate loading delay and restore gallery
    setTimeout(() => {
        gallery.innerHTML = `
            <div class="gallery-container">
                <div class="image-item" data-analysis="Sand Quality: High purity silica content detected. Grain size: 0.2-0.5mm (fine sand). Suitable for construction applications.">
                    <img src="/uploads/img1.jpg" alt="Analysis Image 1" onerror="this.src='/static/images/placeholder.svg'">
                    <div class="analysis-tooltip">
                        <h4>Sand Analysis - Sample 1</h4>
                        <p><strong>Quality:</strong> High purity silica</p>
                        <p><strong>Grain Size:</strong> 0.2-0.5mm (fine)</p>
                        <p><strong>Status:</strong> ✅ Suitable for construction</p>
                        <p><strong>Location:</strong> Mumbai Beach</p>
                    </div>
                </div>
                
                <div class="image-item" data-analysis="Sand Quality: Medium grade silica with minor impurities. Grain size: 0.5-1mm (medium sand). Good for general construction.">
                    <img src="/uploads/img2.jpg" alt="Analysis Image 2" onerror="this.src='/static/images/placeholder.svg'">
                    <div class="analysis-tooltip">
                        <h4>Sand Analysis - Sample 2</h4>
                        <p><strong>Quality:</strong> Medium grade silica</p>
                        <p><strong>Grain Size:</strong> 0.5-1mm (medium)</p>
                        <p><strong>Status:</strong> ✅ Good for construction</p>
                        <p><strong>Location:</strong> Coastal Area</p>
                    </div>
                </div>
                
                <div class="image-item" data-analysis="Sand Quality: Premium grade with high silica content. Grain size: 0.1-0.3mm (very fine). Excellent for specialized applications.">
                    <img src="/uploads/img3.jpg" alt="Analysis Image 3" onerror="this.src='/static/images/placeholder.svg'">
                    <div class="analysis-tooltip">
                        <h4>Sand Analysis - Sample 3</h4>
                        <p><strong>Quality:</strong> Premium grade</p>
                        <p><strong>Grain Size:</strong> 0.1-0.3mm (very fine)</p>
                        <p><strong>Status:</strong> ⭐ Excellent quality</p>
                        <p><strong>Location:</strong> Shore Line</p>
                    </div>
                </div>
                
                <div class="image-item" data-analysis="Sand Quality: Standard grade with acceptable purity. Grain size: 0.3-0.8mm. Suitable for basic construction needs.">
                    <img src="/uploads/img4.jpg" alt="Analysis Image 4" onerror="this.src='/static/images/placeholder.svg'">
                    <div class="analysis-tooltip">
                        <h4>Sand Analysis - Sample 4</h4>
                        <p><strong>Quality:</strong> Standard grade</p>
                        <p><strong>Grain Size:</strong> 0.3-0.8mm</p>
                        <p><strong>Status:</strong> ✅ Basic construction</p>
                        <p><strong>Location:</strong> Beach Area</p>
                    </div>
                </div>
                
                <div class="image-item" data-analysis="Sand Quality: High-grade silica with minimal impurities. Grain size: 0.4-0.7mm. Ideal for concrete mixing.">
                    <img src="/uploads/img5.jpg" alt="Analysis Image 5" onerror="this.src='/static/images/placeholder.svg'">
                    <div class="analysis-tooltip">
                        <h4>Sand Analysis - Sample 5</h4>
                        <p><strong>Quality:</strong> High-grade silica</p>
                        <p><strong>Grain Size:</strong> 0.4-0.7mm</p>
                        <p><strong>Status:</strong> ⭐ Ideal for concrete</p>
                        <p><strong>Location:</strong> Sampling Point 5</p>
                    </div>
                </div>
                
                <div class="image-item" data-analysis="Sand Quality: Good quality with uniform grain distribution. Grain size: 0.2-0.6mm. Recommended for masonry work.">
                    <img src="/uploads/img6.jpg" alt="Analysis Image 6" onerror="this.src='/static/images/placeholder.svg'">
                    <div class="analysis-tooltip">
                        <h4>Sand Analysis - Sample 6</h4>
                        <p><strong>Quality:</strong> Good uniform distribution</p>
                        <p><strong>Grain Size:</strong> 0.2-0.6mm</p>
                        <p><strong>Status:</strong> ✅ Masonry grade</p>
                        <p><strong>Location:</strong> Coastal Zone</p>
                    </div>
                </div>
                
                <div class="image-item" data-analysis="Sand Quality: Excellent purity with consistent grain structure. Grain size: 0.15-0.4mm. Perfect for fine construction work.">
                    <img src="/uploads/img7.jpg" alt="Analysis Image 7" onerror="this.src='/static/images/placeholder.svg'">
                    <div class="analysis-tooltip">
                        <h4>Sand Analysis - Sample 7</h4>
                        <p><strong>Quality:</strong> Excellent purity</p>
                        <p><strong>Grain Size:</strong> 0.15-0.4mm</p>
                        <p><strong>Status:</strong> ⭐ Fine construction</p>
                        <p><strong>Location:</strong> Premium Zone</p>
                    </div>
                </div>
                
                <div class="image-item" data-analysis="Sand Quality: Standard construction grade. Grain size: 0.5-1.2mm (coarse). Suitable for foundation work.">
                    <img src="/uploads/img8.jpg" alt="Analysis Image 8" onerror="this.src='/static/images/placeholder.svg'">
                    <div class="analysis-tooltip">
                        <h4>Sand Analysis - Sample 8</h4>
                        <p><strong>Quality:</strong> Construction grade</p>
                        <p><strong>Grain Size:</strong> 0.5-1.2mm (coarse)</p>
                        <p><strong>Status:</strong> ✅ Foundation work</p>
                        <p><strong>Location:</strong> Collection Point 8</p>
                    </div>
                </div>
            </div>
        `;
        
        console.log('Analysis images loaded successfully');
        initializeCarousel();
    }, 1000);
}

// OLD Carousel functionality (commented out - replaced with scroll validation)
/*
let currentSlide = 0;
const totalSlides = 8; // Total number of slides

function initializeCarousel() {
    const track = document.getElementById('carouselTrack');
    const indicators = document.getElementById('carouselIndicators');
    
    if (!track || !indicators) return;
    
    // Create indicators
    indicators.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const indicator = document.createElement('div');
        indicator.className = `carousel-indicator ${i === 0 ? 'active' : ''}`;
        indicator.addEventListener('click', () => goToSlide(i));
        indicators.appendChild(indicator);
    }
    
    // Initialize carousel position
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const slides = track.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    if (!track || slides.length === 0) return;
    
    // Calculate transform to center the current slide
    // Each slide is now 72% width with 2rem gap (20% increase from 60%)
    // We need to account for the slide width and gaps to center each slide
    const slideWidthPercent = 72;
    const gapRem = 2; // 2rem gap
    
    // Convert rem to percentage (approximately 2rem ≈ 3.6% for larger slides)
    const gapPercent = 3.6;
    
    // Calculate the offset needed to center the current slide
    const totalSlideWithGap = slideWidthPercent + gapPercent;
    const offset = currentSlide * totalSlideWithGap;
    
    track.style.transform = `translateX(-${offset}%)`;
    
    // Update slide classes (center slide effect)
    slides.forEach((slide, index) => {
        slide.classList.remove('center');
        // The current slide is always the center one
        if (index === currentSlide) {
            slide.classList.add('center');
        }
    });
    
    // Update indicators
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
    
    // Update button states
    updateButtonStates();
}

function updateButtonStates() {
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    
    if (prevBtn && nextBtn) {
        // Disable previous button at first slide
        if (currentSlide === 0) {
            prevBtn.disabled = true;
            prevBtn.style.opacity = '0.3';
            prevBtn.style.cursor = 'not-allowed';
        } else {
            prevBtn.disabled = false;
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
        }
        
        // Disable next button at last slide
        if (currentSlide === totalSlides - 1) {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.3';
            nextBtn.style.cursor = 'not-allowed';
        } else {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }
    }
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateCarousel();
    }
}

function previousSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateCarousel();
    }
}

function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    updateCarousel();
}
*/

// Initialize scroll validation functionality
function initializeScrollValidation() {
    const scrollContainer = document.getElementById('validationScroll');
    if (!scrollContainer) return;
    
    // Add wheel scrolling support
    scrollContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
    });
    
    // Add interactive click effects to analysis cards
    const analysisCards = document.querySelectorAll('.analysis-card');
    analysisCards.forEach(card => {
        card.addEventListener('click', function() {
            // Click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Optional: Add a subtle flash effect
            this.style.boxShadow = '0 0 30px rgba(109, 148, 197, 0.4)';
            setTimeout(() => {
                this.style.boxShadow = '';
            }, 300);
        });
        
        // Add smooth hover transition
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
    });
    
    console.log('Scroll validation initialized successfully');
}

// Hardware Modal Functions
function showHardwareModal() {
    const modal = document.getElementById('hardwareErrorModal');
    if (modal) {
        modal.classList.add('show');
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
    }
}

function closeHardwareModal() {
    const modal = document.getElementById('hardwareErrorModal');
    if (modal) {
        modal.classList.remove('show');
        // Restore body scrolling
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside the content
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('hardwareErrorModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeHardwareModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeHardwareModal();
        }
    });
});