// Camera functionality
let currentStream = null;
let facingMode = 'user'; // 'user' for front camera, 'environment' for back camera
let capturedImageData = null;
let capturedLocationData = null;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Check if camera is supported
function isCameraSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Check camera permissions
async function checkCameraPermissions() {
    if (!navigator.permissions) {
        return 'unknown';
    }
    
    try {
        const permission = await navigator.permissions.query({ name: 'camera' });
        return permission.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
        console.warn('Could not check camera permissions:', error);
        return 'unknown';
    }
}

// Show camera interface
async function showCamera() {
    // Show error message popup instead of accessing camera
    showCameraErrorModal();
    return;

    try {
        showLoading(true);
        showStatus('Requesting camera access...', 'info');
        
        document.getElementById('cameraSection').style.display = 'block';
        document.querySelector('.options-container').style.display = 'none';
        
        await startCamera();
        
        showLoading(false);
        showStatus('Camera ready! You can now take photos.', 'success');
        
        // Show switch camera button if multiple cameras are available
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (videoDevices.length > 1) {
                document.getElementById('switchBtn').style.display = 'inline-block';
                console.log(`Found ${videoDevices.length} camera(s)`);
            }
        } catch (enumError) {
            console.warn('Could not enumerate devices:', enumError);
        }
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        showLoading(false);
        
        let errorMessage = 'Failed to access camera: ';
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage += 'Permission denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage += 'No camera found. Please ensure your device has a camera.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage += 'Camera is already in use by another application.';
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            errorMessage += 'Camera settings not supported. Trying with basic settings...';
        } else {
            errorMessage += error.message;
        }
        
        showStatus(errorMessage, 'error');
        hideCamera();
    }
}

// Start camera stream
async function startCamera() {
    try {
        // Stop any existing stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        // More flexible constraints for better compatibility
        const constraints = {
            video: {
                facingMode: facingMode,
                width: { min: 640, ideal: 1920, max: 3840 },
                height: { min: 480, ideal: 1080, max: 2160 },
                frameRate: { ideal: 30, max: 60 }
            },
            audio: false
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        
        // Wait for video to load and set proper dimensions
        return new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
                video.play().then(() => {
                    // Set video dimensions to maintain aspect ratio
                    adjustVideoSize();
                    resolve();
                }).catch(reject);
            };
            
            video.onerror = (error) => {
                reject(new Error('Video playback failed: ' + error.message));
            };
        });
    } catch (error) {
        console.warn('Primary camera constraints failed:', error.message);
        
        // Fallback 1: try without facing mode constraint
        try {
            const fallbackConstraints = {
                video: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 }
                },
                audio: false
            };
            
            currentStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            video.srcObject = currentStream;
            
            return new Promise((resolve, reject) => {
                video.onloadedmetadata = () => {
                    video.play().then(() => {
                        adjustVideoSize();
                        resolve();
                    }).catch(reject);
                };
            });
        } catch (fallbackError) {
            console.warn('Fallback camera constraints failed:', fallbackError.message);
            
            // Fallback 2: try with minimal constraints
            try {
                const minimalConstraints = {
                    video: true,
                    audio: false
                };
                
                currentStream = await navigator.mediaDevices.getUserMedia(minimalConstraints);
                video.srcObject = currentStream;
                
                return new Promise((resolve, reject) => {
                    video.onloadedmetadata = () => {
                        video.play().then(() => {
                            adjustVideoSize();
                            resolve();
                        }).catch(reject);
                    };
                });
            } catch (minimalError) {
                throw new Error('Camera access denied or not available: ' + minimalError.message);
            }
        }
    }
}

// Adjust video size to maintain proper aspect ratio
function adjustVideoSize() {
    if (video.videoWidth && video.videoHeight) {
        const aspectRatio = video.videoWidth / video.videoHeight;
        const containerWidth = video.parentElement.offsetWidth;
        
        if (aspectRatio > 1) {
            // Landscape orientation
            video.style.width = '100%';
            video.style.height = 'auto';
        } else {
            // Portrait orientation
            video.style.width = 'auto';
            video.style.height = '400px';
            video.style.maxWidth = '100%';
        }
        
        console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}, aspect ratio: ${aspectRatio.toFixed(2)}`);
    }
}

// Switch between front and back camera
async function switchCamera() {
    const previousFacingMode = facingMode;
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    
    try {
        showLoading(true);
        showStatus('Switching camera...', 'info');
        
        await startCamera();
        
        showLoading(false);
        showStatus('Camera switched successfully', 'success');
        
        console.log(`Camera switched to: ${facingMode}`);
    } catch (error) {
        console.error('Error switching camera:', error);
        showLoading(false);
        
        // Revert facing mode on failure
        facingMode = previousFacingMode;
        
        showStatus('Failed to switch camera. Using current camera.', 'error');
        
        // Try to restart the previous camera
        try {
            await startCamera();
        } catch (restartError) {
            console.error('Error restarting camera:', restartError);
            showStatus('Camera error. Please refresh the page.', 'error');
            hideCamera();
        }
    }
}

// Hide camera interface
function hideCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    video.srcObject = null;
    document.getElementById('cameraSection').style.display = 'none';
    document.querySelector('.options-container').style.display = 'flex';
    document.getElementById('switchBtn').style.display = 'none';
}

// Capture photo from video stream
async function capturePhoto() {
    if (!currentStream) {
        showStatus('Camera not active', 'error');
        return;
    }

    if (!video.videoWidth || !video.videoHeight) {
        showStatus('Camera not ready. Please wait a moment and try again.', 'error');
        return;
    }

    try {
        // Get GPS location if available
        let locationData = null;
        try {
            if ('geolocation' in navigator) {
                showStatus('Capturing photo with location...', 'info');
                locationData = await getCurrentLocation();
                console.log('Location captured:', locationData);
            }
        } catch (locationError) {
            console.warn('Could not get location:', locationError);
            // Continue without location data
        }

        // Calculate proper canvas dimensions to maintain aspect ratio and quality
        const videoAspectRatio = video.videoWidth / video.videoHeight;
        let canvasWidth, canvasHeight;
        
        // Set high-quality dimensions while maintaining aspect ratio
        if (videoAspectRatio > 1) {
            // Landscape
            canvasWidth = Math.min(video.videoWidth, 2048); // Max width for quality
            canvasHeight = canvasWidth / videoAspectRatio;
        } else {
            // Portrait
            canvasHeight = Math.min(video.videoHeight, 2048); // Max height for quality
            canvasWidth = canvasHeight * videoAspectRatio;
        }
        
        // Set canvas dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Clear canvas and set high-quality rendering
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // Draw current video frame to canvas with proper scaling
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data as high-quality JPEG (smaller file size, good quality)
        capturedImageData = canvas.toDataURL('image/jpeg', 0.92);
        
        // Store location data for saving
        capturedLocationData = locationData;
        
        // Show preview
        showPreview(capturedImageData);
        
        const statusMessage = locationData 
            ? `Photo captured with location (${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)})!`
            : 'Photo captured! Review and save or retake.';
        showStatus(statusMessage, 'success');
        
        console.log(`Photo captured: ${canvasWidth}x${canvasHeight} (aspect ratio: ${videoAspectRatio.toFixed(2)})`);
    } catch (error) {
        console.error('Error capturing photo:', error);
        showStatus('Failed to capture photo: ' + error.message, 'error');
    }
}

// Show preview of captured photo
function showPreview(imageData) {
    document.getElementById('previewImage').src = imageData;
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('cameraSection').style.display = 'none';
}

// Cancel preview and return to camera
function cancelPreview() {
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('cameraSection').style.display = 'block';
    capturedImageData = null;
}

// Save captured photo
async function savePhoto() {
    if (!capturedImageData) {
        showStatus('No photo to save', 'error');
        return;
    }

    try {
        showLoading(true);
        
        const response = await fetch('/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: capturedImageData,
                location: capturedLocationData
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showStatus(result.message, 'success');
            
            // Reset to main screen
            document.getElementById('previewSection').style.display = 'none';
            hideCamera();
            capturedImageData = null;
            capturedLocationData = null;
        } else {
            showStatus(result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving photo:', error);
        showStatus('Failed to save photo', 'error');
    } finally {
        showLoading(false);
    }
}

// Get current GPS location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                });
            },
            (error) => {
                let errorMessage = 'Location access failed: ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Permission denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Position unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Timeout';
                        break;
                    default:
                        errorMessage += 'Unknown error';
                        break;
                }
                reject(new Error(errorMessage));
            },
            options
        );
    });
}

// Clean up camera when page is unloaded
window.addEventListener('beforeunload', () => {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
});

// Show camera error modal
function showCameraErrorModal() {
    // Create modal if it doesn't exist
    let errorModal = document.getElementById('cameraErrorModal');
    if (!errorModal) {
        errorModal = document.createElement('div');
        errorModal.id = 'cameraErrorModal';
        errorModal.className = 'camera-error-modal';
        errorModal.innerHTML = `
            <div class="error-modal-overlay" onclick="closeCameraErrorModal()"></div>
            <div class="error-modal-content">
                <div class="error-modal-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Camera Not Available</h3>
                </div>
                <div class="error-modal-body">
                    <p>The camera will function properly after it is connected to the hardware.</p>
                </div>
                <div class="error-modal-footer">
                    <button class="btn btn-primary" onclick="closeCameraErrorModal()">
                        <i class="fas fa-check"></i> Understood
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(errorModal);
    }
    
    // Show modal with animation
    errorModal.style.display = 'flex';
    setTimeout(() => {
        errorModal.classList.add('show');
    }, 10);
}

// Close camera error modal
function closeCameraErrorModal() {
    const errorModal = document.getElementById('cameraErrorModal');
    if (errorModal) {
        errorModal.classList.remove('show');
        setTimeout(() => {
            errorModal.style.display = 'none';
        }, 300);
    }
}