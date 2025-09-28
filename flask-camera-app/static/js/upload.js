// Gallery upload functionality
const fileInput = document.getElementById('fileInput');

// Open file dialog for gallery selection
function openGallery() {
    fileInput.click();
}

// Handle file selection
fileInput.addEventListener('change', async function(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showStatus('Please select a valid image file (PNG, JPG, JPEG, GIF, or WebP)', 'error');
        fileInput.value = ''; // Clear the input
        return;
    }

    // Validate file size (16MB max)
    const maxSize = 16 * 1024 * 1024; // 16MB in bytes
    if (file.size > maxSize) {
        showStatus('File size too large. Please select a file smaller than 16MB', 'error');
        fileInput.value = ''; // Clear the input
        return;
    }

    try {
        showLoading(true);
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            showStatus(result.message, 'success');
            
            // Show a preview of the uploaded image
            showUploadedImagePreview(file);
        } else {
            showStatus(result.message, 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showStatus('Failed to upload file. Please try again.', 'error');
    } finally {
        showLoading(false);
        fileInput.value = ''; // Clear the input for next use
    }
});

// Show preview of uploaded image
function showUploadedImagePreview(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // Create a temporary preview modal or notification
        const previewHtml = `
            <div class="upload-preview" id="uploadPreview">
                <div class="upload-preview-content">
                    <h3>✓ Upload Successful!</h3>
                    <img src="${e.target.result}" alt="Uploaded image" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                    <p>File: ${file.name}</p>
                    <button class="btn btn-primary" onclick="closeUploadPreview()">Continue</button>
                    <a href="/gallery" class="btn btn-info">View Gallery</a>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', previewHtml);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            closeUploadPreview();
        }, 5000);
    };
    
    reader.readAsDataURL(file);
}

// Close upload preview
function closeUploadPreview() {
    const preview = document.getElementById('uploadPreview');
    if (preview) {
        preview.remove();
    }
}

// Drag and drop functionality for desktop
function initializeDragAndDrop() {
    const dropZone = document.querySelector('.options-container');
    
    if (!dropZone) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    e.currentTarget.classList.add('drag-over');
}

function unhighlight(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        const file = files[0];
        
        // Simulate file input change
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        // Trigger the change event
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);
    }
}

// Initialize drag and drop when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDragAndDrop);