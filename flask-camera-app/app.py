import os
import uuid
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import base64
import ssl

app = Flask(__name__)
# Use absolute path for uploads folder
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_metadata_file_path():
    """Get path to metadata JSON file"""
    return os.path.join(app.config['UPLOAD_FOLDER'], 'photo_metadata.json')

def load_photo_metadata():
    """Load photo metadata from JSON file"""
    metadata_file = get_metadata_file_path()
    if os.path.exists(metadata_file):
        try:
            with open(metadata_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            print("Warning: Could not load metadata file")
    return {}

def save_photo_metadata(filename, location_data):
    """Save photo metadata to JSON file"""
    try:
        metadata = load_photo_metadata()
        metadata[filename] = {
            'location': location_data,
            'created_at': datetime.now().isoformat()
        }
        
        metadata_file = get_metadata_file_path()
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not save metadata for {filename}: {e}")

def remove_photo_metadata(filename):
    """Remove photo metadata when photo is deleted"""
    try:
        metadata = load_photo_metadata()
        if filename in metadata:
            del metadata[filename]
            metadata_file = get_metadata_file_path()
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not remove metadata for {filename}: {e}")

@app.route('/')
def index():
    """Main page with camera and upload options"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload from gallery"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file selected'})
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'})
        
        if file and allowed_file(file.filename):
            # Generate unique filename
            filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
            secure_name = secure_filename(filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_name)
            file.save(file_path)
            
            return jsonify({
                'success': True, 
                'message': 'File uploaded successfully!',
                'filename': secure_name
            })
        else:
            return jsonify({
                'success': False, 
                'message': 'Invalid file type. Please upload PNG, JPG, JPEG, GIF, or WebP files.'
            })
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Upload failed: {str(e)}'})

@app.route('/capture', methods=['POST'])
def capture_photo():
    """Handle photo capture from camera"""
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'success': False, 'message': 'No image data received'})
        
        # Extract base64 image data
        image_data = data['image']
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        
        # Generate unique filename
        filename = str(uuid.uuid4()) + '.png'
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save the image
        with open(file_path, 'wb') as f:
            f.write(image_bytes)
        
        # Handle location data if provided
        location_data = data.get('location')
        if location_data:
            save_photo_metadata(filename, location_data)
            print(f"Photo {filename} saved with location: {location_data['latitude']}, {location_data['longitude']}")
        
        return jsonify({
            'success': True,
            'message': 'Photo captured successfully!' + (' with location' if location_data else ''),
            'filename': filename
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Capture failed: {str(e)}'})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

@app.route('/gallery')
def gallery():
    """Show all uploaded images"""
    try:
        files = []
        upload_path = app.config['UPLOAD_FOLDER']
        metadata = load_photo_metadata()
        
        # Debug: print upload folder path
        print(f"Looking for files in: {upload_path}")
        
        if os.path.exists(upload_path):
            for filename in os.listdir(upload_path):
                if allowed_file(filename):
                    # Create file info with metadata
                    file_info = {
                        'filename': filename,
                        'has_location': filename in metadata and metadata[filename].get('location') is not None,
                        'location': metadata.get(filename, {}).get('location'),
                        'created_at': metadata.get(filename, {}).get('created_at')
                    }
                    files.append(file_info)
                    print(f"Found file: {filename} (location: {'yes' if file_info['has_location'] else 'no'})")
        else:
            print(f"Upload directory does not exist: {upload_path}")
        
        files.sort(key=lambda x: x['created_at'] or '', reverse=True)  # Show newest first
        print(f"Total files to display: {len(files)}")
        
        return render_template('gallery.html', files=files)
    
    except Exception as e:
        print(f"Gallery error: {str(e)}")
        return render_template('gallery.html', files=[], error=str(e))

@app.route('/remove', methods=['POST'])
def remove_photo():
    """Remove selected photos"""
    try:
        data = request.get_json()
        
        if 'filenames' not in data:
            return jsonify({'success': False, 'message': 'No filenames provided'})
        
        filenames = data['filenames']
        removed_files = []
        errors = []
        
        for filename in filenames:
            # Security check: only allow files without path traversal
            if '..' in filename or '/' in filename or '\\' in filename:
                errors.append(f"Invalid filename: {filename}")
                continue
            
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Check if file exists and is in uploads folder
            if os.path.exists(file_path) and allowed_file(filename):
                try:
                    os.remove(file_path)
                    remove_photo_metadata(filename)  # Also remove metadata
                    removed_files.append(filename)
                    print(f"Removed file: {filename}")
                except Exception as e:
                    errors.append(f"Failed to remove {filename}: {str(e)}")
            else:
                errors.append(f"File not found: {filename}")
        
        return jsonify({
            'success': True,
            'removed_files': removed_files,
            'errors': errors,
            'message': f"Successfully removed {len(removed_files)} file(s)"
        })
        
    except Exception as e:
        print(f"Remove photo error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/map')
def map_view():
    """Show map with photo locations"""
    return render_template('map.html')

@app.route('/test')
def test_page():
    """Mobile connectivity and camera test page"""
    return render_template('test.html')

@app.route('/api/photos-with-locations')
def photos_with_locations():
    """API endpoint to get all photos with their location data"""
    try:
        files = []
        upload_path = app.config['UPLOAD_FOLDER']
        metadata = load_photo_metadata()
        
        if os.path.exists(upload_path):
            for filename in os.listdir(upload_path):
                if allowed_file(filename):
                    photo_data = {
                        'filename': filename,
                        'url': f'/uploads/{filename}',
                        'location': None,
                        'created_at': None
                    }
                    
                    # Add metadata if available
                    if filename in metadata:
                        photo_data['location'] = metadata[filename].get('location')
                        photo_data['created_at'] = metadata[filename].get('created_at')
                    
                    files.append(photo_data)
        
        files.sort(key=lambda x: x['created_at'] or '', reverse=True)
        
        return jsonify({
            'success': True,
            'photos': files
        })
    
    except Exception as e:
        print(f"Photos with locations error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/delete_photo', methods=['POST'])
def delete_single_photo():
    """Delete a single photo (for one-page app)"""
    try:
        data = request.get_json()
        if not data or 'filename' not in data:
            return jsonify({'success': False, 'error': 'No filename provided'})
        
        filename = data['filename']
        
        # Security check: only allow files without path traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'success': False, 'error': 'Invalid filename'})
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Check if file exists and is in uploads folder
        if os.path.exists(file_path) and allowed_file(filename):
            try:
                os.remove(file_path)
                remove_photo_metadata(filename)  # Also remove metadata
                print(f"Deleted file: {filename}")
                return jsonify({'success': True, 'message': f'Successfully deleted {filename}'})
            except Exception as e:
                return jsonify({'success': False, 'error': f'Failed to delete {filename}: {str(e)}'})
        else:
            return jsonify({'success': False, 'error': 'File not found'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    print("🚀 Starting Flask Camera App...")
    print("📱 For mobile access, use: http://10.29.26.253:5000")
    print("💻 For desktop access, use: http://127.0.0.1:5000")
    print("📸 Camera should work on local network without HTTPS")
    
    # Run the app with HTTP for better compatibility
    app.run(debug=True, host='0.0.0.0', port=5000)