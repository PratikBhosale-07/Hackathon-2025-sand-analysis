// Gallery functionality

let isSelectMode = false;
let selectedPhotos = new Set();

// Locate photo on map
function locatePhotoOnMap(filename, latitude, longitude) {
    // Store the photo location in sessionStorage for the map page
    const photoLocation = {
        filename: filename,
        latitude: latitude,
        longitude: longitude,
        timestamp: new Date().getTime()
    };
    
    sessionStorage.setItem('locatePhoto', JSON.stringify(photoLocation));
    
    // Open map page in new tab/window or navigate to it
    const mapUrl = `/map?locate=${encodeURIComponent(filename)}&lat=${latitude}&lng=${longitude}`;
    window.open(mapUrl, '_blank');
    
    // Show feedback message
    showMessage(`Opening map to show location of "${filename}"`, 'info');
}

// Enhanced selection functionality with dots
function initializeSelectionDots() {
    const selectionDots = document.querySelectorAll('.selection-dot');
    
    selectionDots.forEach(dot => {
        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            const galleryItem = this.closest('.gallery-item');
            const filename = galleryItem.dataset.filename;
            
            if (!isSelectMode) {
                enterSelectionMode();
            }
            
            togglePhotoSelection(filename, this);
        });
    });
}

function enterSelectionMode() {
    isSelectMode = true;
    document.body.classList.add('selection-mode');
    
    // Show selection UI
    showSelectionControls();
    
    console.log('Entered selection mode');
}

function exitSelectionMode() {
    isSelectMode = false;
    selectedPhotos.clear();
    document.body.classList.remove('selection-mode');
    
    // Clear all selected dots
    document.querySelectorAll('.selection-dot.selected').forEach(dot => {
        dot.classList.remove('selected');
    });
    
    // Hide selection UI
    hideSelectionControls();
    
    console.log('Exited selection mode');
}

function togglePhotoSelection(filename, dotElement) {
    if (selectedPhotos.has(filename)) {
        selectedPhotos.delete(filename);
        dotElement.classList.remove('selected');
    } else {
        selectedPhotos.add(filename);
        dotElement.classList.add('selected');
    }
    
    updateSelectionCount();
    
    // Exit selection mode if no photos are selected
    if (selectedPhotos.size === 0) {
        exitSelectionMode();
    }
}

function selectAllPhotos() {
    if (!isSelectMode) {
        enterSelectionMode();
    }
    
    const allDots = document.querySelectorAll('.selection-dot');
    allDots.forEach(dot => {
        const galleryItem = dot.closest('.gallery-item');
        const filename = galleryItem.dataset.filename;
        
        selectedPhotos.add(filename);
        dot.classList.add('selected');
    });
    
    updateSelectionCount();
}

function updateSelectionCount() {
    const countElement = document.getElementById('selection-count');
    if (countElement) {
        countElement.textContent = `${selectedPhotos.size} photo${selectedPhotos.size !== 1 ? 's' : ''} selected`;
    }
}

function showSelectionControls() {
    // Create selection controls if they don't exist
    let selectionControls = document.getElementById('selection-controls');
    if (!selectionControls) {
        selectionControls = document.createElement('div');
        selectionControls.id = 'selection-controls';
        selectionControls.className = 'selection-controls';
        selectionControls.innerHTML = `
            <div class="selection-info">
                <span id="selection-count">0 photos selected</span>
            </div>
            <div class="selection-actions">
                <button class="btn btn-secondary" onclick="selectAllPhotos()">Select All</button>
                <button class="btn btn-danger" onclick="deleteSelectedPhotos()">Delete Selected</button>
                <button class="btn btn-primary" onclick="exitSelectionMode()">Cancel</button>
            </div>
        `;
        
        // Insert at the top of the gallery
        const gallery = document.querySelector('.gallery-grid');
        if (gallery && gallery.parentNode) {
            gallery.parentNode.insertBefore(selectionControls, gallery);
        }
    }
    
    selectionControls.style.display = 'flex';
}

function hideSelectionControls() {
    const selectionControls = document.getElementById('selection-controls');
    if (selectionControls) {
        selectionControls.style.display = 'none';
    }
}

function deleteSelectedPhotos() {
    if (selectedPhotos.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedPhotos.size} selected photo${selectedPhotos.size !== 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) return;
    
    // Convert Set to Array for processing
    const photosToDelete = Array.from(selectedPhotos);
    
    // Delete photos sequentially
    deletePhotosSequentially(photosToDelete);
}

function deletePhotosSequentially(filenames) {
    if (filenames.length === 0) {
        // All photos deleted, refresh the page
        window.location.reload();
        return;
    }
    
    const filename = filenames.shift();
    
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
            console.log(`Deleted ${filename}`);
            // Continue with next photo
            deletePhotosSequentially(filenames);
        } else {
            alert(`Failed to delete ${filename}: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error deleting photo:', error);
        alert(`Error deleting ${filename}`);
    });
}

// Handle image click - either open modal or toggle selection
function handleImageClick(imageSrc, filename) {
    if (isSelectMode) {
        // In select mode, toggle the checkbox
        const galleryItem = event.target.closest('.gallery-item');
        const checkbox = galleryItem.querySelector('.photo-select');
        checkbox.checked = !checkbox.checked;
        toggleItemSelection(galleryItem, checkbox.checked);
        updateRemoveButton();
    } else {
        // Normal mode, open modal
        openModal(imageSrc, filename);
    }
}

// Open image in modal
function openModal(imageSrc, filename) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalFilename = document.getElementById('modalFilename');
    
    if (modal && modalImage && modalFilename) {
        modalImage.src = imageSrc;
        modalFilename.textContent = filename;
        modal.style.display = 'flex';
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
    }
}

// Close image modal
function closeModal() {
    const modal = document.getElementById('imageModal');
    
    if (modal) {
        modal.style.display = 'none';
        
        // Restore body scrolling
        document.body.style.overflow = 'auto';
    }
}

// Toggle select mode
function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    
    const selectModeBtn = document.getElementById('selectModeBtn');
    const removeSelectedBtn = document.getElementById('removeSelectedBtn');
    const cancelSelectBtn = document.getElementById('cancelSelectBtn');
    const checkboxes = document.querySelectorAll('.selection-checkbox');
    
    if (isSelectMode) {
        // Enter select mode
        selectModeBtn.style.display = 'none';
        removeSelectedBtn.style.display = 'inline-block';
        cancelSelectBtn.style.display = 'inline-block';
        
        // Show all checkboxes
        checkboxes.forEach(checkbox => {
            checkbox.style.display = 'block';
        });
        
        document.body.classList.add('select-mode');
    } else {
        // Exit select mode
        selectModeBtn.style.display = 'inline-block';
        removeSelectedBtn.style.display = 'none';
        cancelSelectBtn.style.display = 'none';
        
        // Hide all checkboxes and uncheck them
        checkboxes.forEach(checkbox => {
            checkbox.style.display = 'none';
            const input = checkbox.querySelector('input');
            input.checked = false;
        });
        
        // Remove selection styling
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        document.body.classList.remove('select-mode');
    }
}

// Cancel select mode
function cancelSelectMode() {
    toggleSelectMode();
}

// Toggle item selection visual state
function toggleItemSelection(galleryItem, isSelected) {
    if (isSelected) {
        galleryItem.classList.add('selected');
    } else {
        galleryItem.classList.remove('selected');
    }
}

// Update remove button state
function updateRemoveButton() {
    const selectedCheckboxes = document.querySelectorAll('.photo-select:checked');
    const removeBtn = document.getElementById('removeSelectedBtn');
    
    if (selectedCheckboxes.length > 0) {
        removeBtn.innerHTML = `<i class="fas fa-trash"></i> Remove Selected (${selectedCheckboxes.length})`;
        removeBtn.disabled = false;
    } else {
        removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove Selected';
        removeBtn.disabled = true;
    }
}

// Remove selected photos
async function removeSelected() {
    const selectedCheckboxes = document.querySelectorAll('.photo-select:checked');
    
    if (selectedCheckboxes.length === 0) {
        alert('Please select photos to remove');
        return;
    }
    
    const filenames = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    // Confirmation dialog
    const confirmMessage = `Are you sure you want to remove ${filenames.length} photo(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Show loading state
        const removeBtn = document.getElementById('removeSelectedBtn');
        const originalText = removeBtn.innerHTML;
        removeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';
        removeBtn.disabled = true;
        
        const response = await fetch('/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filenames: filenames })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Remove successful items from DOM
            result.removed_files.forEach(filename => {
                const galleryItem = document.querySelector(`[data-filename="${filename}"]`);
                if (galleryItem) {
                    galleryItem.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        galleryItem.remove();
                    }, 300);
                }
            });
            
            // Show success message
            showMessage(result.message, 'success');
            
            // If there were errors, show them
            if (result.errors.length > 0) {
                setTimeout(() => {
                    showMessage('Some files could not be removed: ' + result.errors.join(', '), 'error');
                }, 1000);
            }
            
            // Exit select mode after a delay
            setTimeout(() => {
                if (document.querySelectorAll('.gallery-item').length === 0) {
                    // If no photos left, reload page to show empty state
                    window.location.reload();
                } else {
                    toggleSelectMode();
                }
            }, 1000);
            
        } else {
            showMessage('Error removing photos: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error removing photos:', error);
        showMessage('Network error. Please try again.', 'error');
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

// Handle checkbox change events
document.addEventListener('change', function(event) {
    if (event.target.classList.contains('photo-select')) {
        const galleryItem = event.target.closest('.gallery-item');
        toggleItemSelection(galleryItem, event.target.checked);
        updateRemoveButton();
    }
});

// Handle keyboard navigation in gallery
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('imageModal');
    
    if (modal && modal.style.display === 'flex') {
        if (event.key === 'Escape') {
            closeModal();
        } else if (event.key === 'ArrowLeft') {
            navigateImage('prev');
        } else if (event.key === 'ArrowRight') {
            navigateImage('next');
        }
    }
    
    // Delete key to toggle select mode
    if (event.key === 'Delete' && !isSelectMode) {
        toggleSelectMode();
    }
    
    // Escape to exit select mode
    if (event.key === 'Escape' && isSelectMode) {
        cancelSelectMode();
    }
});

// Navigate between images in modal
function navigateImage(direction) {
    const currentImage = document.getElementById('modalImage');
    const currentSrc = currentImage.src;
    
    // Get all gallery images
    const galleryImages = Array.from(document.querySelectorAll('.gallery-item img'));
    const currentIndex = galleryImages.findIndex(img => img.src === currentSrc);
    
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % galleryImages.length;
    } else {
        newIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    }
    
    const newImage = galleryImages[newIndex];
    const galleryItem = newImage.closest('.gallery-item');
    const filename = galleryItem.getAttribute('data-filename');
    
    openModal(newImage.src, filename);
}

// Add touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
});

document.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    
    const modal = document.getElementById('imageModal');
    if (modal && modal.style.display === 'flex') {
        handleSwipe();
    }
});

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
            // Swipe right - go to previous image
            navigateImage('prev');
        } else {
            // Swipe left - go to next image
            navigateImage('next');
        }
    }
}

// Lazy loading for gallery images
function initializeLazyLoading() {
    const images = document.querySelectorAll('.gallery-item img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeLazyLoading();
    initializeSelectionDots();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            exitSelectionMode();
        } else if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            selectAllPhotos();
        }
    });
    
    // Add animation to gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('fade-in');
    });
    
    console.log('Gallery initialized with', galleryItems.length, 'images');
});