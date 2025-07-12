from flask import Blueprint, request, jsonify, send_from_directory
import os
from datetime import datetime
from .models import db, TelemetryFile
from .utils import verify_car_credentials

telemetry_bp = Blueprint('telemetry', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploaded_files')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@telemetry_bp.route('/upload-text', methods=['POST'])
def upload_text():
    data = request.get_json(force=True)
    car_id = data.get('car_id')
    text = data.get('text')
    token = request.headers.get('Authorization')

    if not car_id or text is None:
        return jsonify({'error': 'Missing parameters'}), 400

    if not verify_car_credentials(car_id, token):
        return jsonify({'error': 'Unauthorized'}), 403

    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    filename = f"{car_id}_{timestamp}.txt"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
    except Exception as e:
        return jsonify({'error': f'Failed to save file: {str(e)}'}), 500

    file_entry = TelemetryFile(car_id=car_id, filename=filename)
    db.session.add(file_entry)
    db.session.commit()

    return jsonify({'message': 'File saved', 'filename': filename}), 201

@telemetry_bp.route('/download/<path:filename>', methods=['GET'])
def download_file(filename):
    car_id = request.args.get('car_id')
    token = request.headers.get('Authorization')

    if not car_id or not token:
        return jsonify({'error': 'Missing parameters'}), 400

    if not verify_car_credentials(car_id, token):
        return jsonify({'error': 'Unauthorized'}), 403

    # ensure ownership
    record = TelemetryFile.query.filter_by(car_id=car_id, filename=filename).first()
    if not record:
        return jsonify({'error': 'File not found or not owned by this car'}), 404

    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)
