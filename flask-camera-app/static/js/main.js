// Main application functionality

// Show status messages
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}

// Show/hide loading overlay
function showLoading(show) {
    const loadingEl = document.getElementById('loadingOverlay');
    
    if (!loadingEl) return;
    
    loadingEl.style.display = show ? 'flex' : 'none';
}

// Check if device is mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Initialize the application
async function initializeApp() {
    // Add mobile class to body if on mobile device
    if (isMobile()) {
        document.body.classList.add('mobile');
    }
    
    // Check for camera support and update UI accordingly
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const cameraOption = document.getElementById('cameraOption');
        if (cameraOption) {
            const button = cameraOption.querySelector('button');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Camera Not Supported';
            button.classList.add('disabled');
        }
    } else {
        // Check camera permissions if available
        if (typeof checkCameraPermissions === 'function') {
            try {
                const permission = await checkCameraPermissions();
                console.log('Camera permission status:', permission);
                
                if (permission === 'denied') {
                    showStatus('Camera access was denied. Please enable camera permissions in your browser settings.', 'error');
                }
            } catch (error) {
                console.warn('Could not check camera permissions:', error);
            }
        }
    }
    
    // Add click handlers for escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            // Close camera if open
            const cameraSection = document.getElementById('cameraSection');
            if (cameraSection && cameraSection.style.display !== 'none') {
                hideCamera();
                return;
            }
            
            // Close preview if open
            const previewSection = document.getElementById('previewSection');
            if (previewSection && previewSection.style.display !== 'none') {
                cancelPreview();
                return;
            }
            
            // Close upload preview if open
            closeUploadPreview();
        }
    });
    
    // Add fullscreen support for mobile
    if (isMobile() && document.documentElement.requestFullscreen) {
        const enterFullscreenBtn = document.createElement('button');
        enterFullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
        enterFullscreenBtn.className = 'btn btn-info fullscreen-btn';
        enterFullscreenBtn.onclick = toggleFullscreen;
        
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(enterFullscreenBtn);
        }
    }
    
    console.log('Camera & Gallery App initialized');
}

// Toggle fullscreen mode
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Handle fullscreen change
document.addEventListener('fullscreenchange', function() {
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    if (fullscreenBtn) {
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
        } else {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
        }
    }
});

// Handle service worker registration for PWA-like experience
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/static/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page visibility changes (pause camera when page is hidden)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, pause camera if active
        if (currentStream) {
            currentStream.getTracks().forEach(track => {
                track.enabled = false;
            });
        }
    } else {
        // Page is visible, resume camera if active
        if (currentStream) {
            currentStream.getTracks().forEach(track => {
                track.enabled = true;
            });
        }
    }
});