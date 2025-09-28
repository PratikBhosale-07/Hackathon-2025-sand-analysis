# Flask Camera & Gallery App

A responsive web application built with Flask that allows users to take photos using their device camera or upload images from their gallery. The app works seamlessly on both desktop and mobile devices.

## Features

- 📸 **Camera Capture**: Take photos directly using your device's camera
- 📁 **Gallery Upload**: Upload existing photos from your device
- 📱 **Mobile Responsive**: Optimized for both desktop and mobile devices
- 🖼️ **Image Gallery**: View all captured and uploaded photos
- 🔄 **Camera Switching**: Switch between front and back cameras (on supported devices)
- 📤 **Drag & Drop**: Drag and drop files to upload (desktop)
- ⚡ **Real-time Preview**: Preview photos before saving
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations

## Installation

1. **Clone or download the project**

   ```bash
   cd flask-camera-app
   ```

2. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**

   ```bash
   python app.py
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5000`
   - Or access from mobile devices on the same network using your computer's IP address

## Usage

### Taking Photos

1. Click "Open Camera" button
2. Allow camera permissions when prompted
3. Click the capture button to take a photo
4. Review the preview and click "Save Photo" to store it

### Uploading from Gallery

1. Click "Choose File" button
2. Select an image from your device
3. The image will be automatically uploaded and saved

### Viewing Gallery

- Click "View Gallery" to see all your photos
- Click on any image to view it in full size
- Use arrow keys or swipe (mobile) to navigate between images

## Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11+)
- **Edge**: Full support

## Mobile Features

- **Touch Support**: Optimized touch interface
- **Camera Access**: Front and back camera support
- **Responsive Design**: Adapts to different screen sizes
- **Swipe Navigation**: Swipe between images in gallery
- **Fullscreen Mode**: Optional fullscreen for better mobile experience

## Technical Details

### Backend

- **Flask**: Python web framework
- **File Upload**: Secure file handling with size limits
- **Image Processing**: Base64 encoding for camera captures
- **UUID Naming**: Unique filenames to prevent conflicts

### Frontend

- **Responsive CSS**: Mobile-first design approach
- **JavaScript APIs**: getUserMedia for camera access
- **Drag & Drop**: HTML5 file drag and drop
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Security Features

- File type validation (PNG, JPG, JPEG, GIF, WebP)
- File size limits (16MB maximum)
- Secure filename handling
- XSS protection through proper escaping

## File Structure

```
flask-camera-app/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── uploads/              # Uploaded images directory
├── templates/
│   ├── index.html        # Main application page
│   └── gallery.html      # Gallery view page
└── static/
    ├── css/
    │   └── style.css     # Responsive styles
    └── js/
        ├── camera.js     # Camera functionality
        ├── upload.js     # Upload functionality
        ├── gallery.js    # Gallery features
        └── main.js       # Main app logic
```

## Configuration

### Environment Variables

- `FLASK_ENV`: Set to `development` for debug mode
- `FLASK_PORT`: Change default port (default: 5000)

### App Configuration

- `MAX_CONTENT_LENGTH`: File size limit (default: 16MB)
- `UPLOAD_FOLDER`: Upload directory (default: uploads)

## Troubleshooting

### Camera Not Working

- Ensure you're accessing the site via HTTPS (required for camera on most browsers)
- Check browser permissions for camera access
- Try refreshing the page and allowing permissions again

### Upload Issues

- Check file format (must be PNG, JPG, JPEG, GIF, or WebP)
- Ensure file size is under 16MB
- Verify the uploads directory has write permissions

### Mobile Issues

- For iOS Safari: Ensure iOS 11+ for camera support
- For Android: Chrome 53+ recommended
- Clear browser cache if experiencing issues

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please check the troubleshooting section above or review the browser console for error messages.
