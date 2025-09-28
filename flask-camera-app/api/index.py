import os
import sys

# Add the parent directory to the path so we can import from the main app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, render_template, request, jsonify, send_from_directory
import json
from datetime import datetime
from werkzeug.utils import secure_filename
import base64

app = Flask(__name__, 
            template_folder='../templates',
            static_folder='../static')

# Configure for Vercel deployment
app.config['UPLOAD_FOLDER'] = '/tmp'  # Vercel's temporary directory
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/photos')
def get_photos():
    try:
        # For Vercel, we'll return sample photos since file system is limited
        photos = [
            {'filename': 'img1.jpg', 'url': '/static/images/sample1.jpg'},
            {'filename': 'img2.jpg', 'url': '/static/images/sample2.jpg'},
            {'filename': 'img3.jpg', 'url': '/static/images/sample3.jpg'},
        ]
        return jsonify({'photos': photos})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/photos-with-locations')
def photos_with_locations():
    try:
        # Sample photos with locations for Vercel deployment
        photos = [
            {
                'filename': 'img1.jpg',
                'url': '/uploads/img1.jpg',
                'location': {'latitude': 19.0760, 'longitude': 72.8777},
                'created_at': '2025-09-28T10:00:00'
            },
            {
                'filename': 'img2.jpg', 
                'url': '/uploads/img2.jpg',
                'location': {'latitude': 19.0825, 'longitude': 72.8811},
                'created_at': '2025-09-28T10:15:00'
            },
            {
                'filename': 'img3.jpg',
                'url': '/uploads/img3.jpg', 
                'location': {'latitude': 19.0896, 'longitude': 72.8656},
                'created_at': '2025-09-28T10:30:00'
            }
        ]
        return jsonify({'photos': photos})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/excel-locations')
def excel_locations():
    try:
        # Sample Excel locations for Vercel deployment
        locations = [
            {
                'image_name': 'sample1.jpg',
                'latitude': 19.0760,
                'longitude': 72.8777,
                'date_taken': '2025-09-28',
                'image_url': '/uploads/img1.jpg'
            },
            {
                'image_name': 'sample2.jpg',
                'latitude': 19.0825,
                'longitude': 72.8811, 
                'date_taken': '2025-09-28',
                'image_url': '/uploads/img2.jpg'
            },
            {
                'image_name': 'sample3.jpg',
                'latitude': 19.0896,
                'longitude': 72.8656,
                'date_taken': '2025-09-28', 
                'image_url': '/uploads/img3.jpg'
            },
            {
                'image_name': 'sample4.jpg',
                'latitude': 19.0330,
                'longitude': 72.8697,
                'date_taken': '2025-09-28',
                'image_url': '/uploads/img4.jpg'
            },
            {
                'image_name': 'sample5.jpg',
                'latitude': 19.0176,
                'longitude': 72.8562,
                'date_taken': '2025-09-28',
                'image_url': '/uploads/img5.jpg'
            }
        ]
        print(f"Loaded {len(locations)} sample locations")
        return jsonify({'locations': locations})
    except Exception as e:
        print(f"Error loading sample locations: {str(e)}")
        return jsonify({'locations': [], 'error': str(e)})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    # For demo purposes, serve from static images
    return send_from_directory('../uploads', filename)

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        # In Vercel, file uploads are limited, so we'll simulate success
        return jsonify({
            'success': True,
            'message': 'File upload simulated (Vercel limitation)',
            'files': ['demo_file.jpg']
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/capture', methods=['POST'])
def capture_photo():
    try:
        # In Vercel, we'll simulate photo capture
        return jsonify({
            'success': True,
            'message': 'Photo capture simulated (Vercel limitation)',
            'filename': f'captured_{datetime.now().strftime("%Y%m%d_%H%M%S")}.jpg'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

# Vercel requires this specific handler function
def handler(request):
    return app(request.environ, lambda *args: None)

# For local testing
if __name__ == '__main__':
    app.run(debug=True)