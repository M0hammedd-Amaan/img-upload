from flask import Flask, request, jsonify
from extensions import db, bcrypt, cors
from models import User, Image, Folder
from werkzeug.utils import secure_filename
from s3_utils import upload_file_to_s3
import jwt
import datetime
import os
from dotenv import load_dotenv
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

db.init_app(app)
bcrypt.init_app(app)
cors.init_app(app)

# ✅ JWT Token Required Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired'}), 401
        except Exception as e:
            return jsonify({'message': 'Invalid token', 'error': str(e)}), 401

        return f(current_user_id, *args, **kwargs)
    return decorated

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password required'}), 400

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'message': 'Username already exists'}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(username=username, password=hashed_password)

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid username or password'}), 401

    token_payload = {
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({'message': 'Login successful', 'token': token})

@app.route('/folders/breadcrumb/<folder_id>', methods=['GET'])
@token_required
def get_breadcrumbs(current_user_id, folder_id):
    breadcrumbs = []
    folder = Folder.query.filter_by(id=folder_id, user_id=current_user_id).first()

    while folder:
        breadcrumbs.insert(0, {'id': folder.id, 'name': folder.name})
        folder = Folder.query.filter_by(id=folder.parent_id, user_id=current_user_id).first()

    return jsonify(breadcrumbs)

@app.route('/folders', methods=['GET'])
@token_required
def get_folders(current_user_id):
    parent_id = request.args.get('folder_id')

    query = Folder.query.filter_by(user_id=current_user_id)

    if parent_id is not None:
        if parent_id == "null":
            query = query.filter(Folder.parent_id.is_(None))
        else:
            query = query.filter_by(parent_id=parent_id)
    else:
        query = query.filter(Folder.parent_id.is_(None))

    folders = query.all()

    result = [
        {
            'id': folder.id,
            'name': folder.name,
            'parent_id': folder.parent_id
        } for folder in folders
    ]

    return jsonify(result)

@app.route('/folders/<int:folder_id>/move', methods=['PUT'])
@token_required
def move_folder(current_user_id, folder_id):
    data = request.get_json()
    new_parent_id = data.get('parent_id')

    if new_parent_id == "null":
        new_parent_id = None

    folder = Folder.query.filter_by(id=folder_id, user_id=current_user_id).first()

    if not folder:
        return jsonify({'message': 'Folder not found'}), 404

    folder.parent_id = new_parent_id
    db.session.commit()

    return jsonify({'message': 'Folder moved successfully'})

@app.route('/images', methods=['GET'])
@token_required
def list_images(current_user_id):
    folder_id = request.args.get('folder_id')

    query = Image.query.filter_by(user_id=current_user_id)

    if folder_id is not None:
        if folder_id == "null":
            query = query.filter(Image.folder_id.is_(None))
        else:
            query = query.filter_by(folder_id=folder_id)

    images = query.all()

    result = [
        {
            'id': img.id,
            'filename': img.filename,
            'url': img.url,
            'upload_date': img.upload_date,
            'folder_id': img.folder_id
        } for img in images
    ]

    return jsonify(result)

@app.route('/images/<int:image_id>/move', methods=['PUT'])
@token_required
def move_image(current_user_id, image_id):
    data = request.get_json()
    new_folder_id = data.get('parent_id')

    if new_folder_id == "null":
        new_folder_id = None

    image = Image.query.filter_by(id=image_id, user_id=current_user_id).first()

    if not image:
        return jsonify({'message': 'Image not found'}), 404

    image.folder_id = new_folder_id
    db.session.commit()

    return jsonify({'message': 'Image moved successfully'})

@app.route('/folders', methods=['POST'])
@token_required
def create_folder(current_user_id):
    data = request.get_json()
    folder_name = data.get('name')
    parent_id = data.get('parent_id')

    if parent_id == "null":
        parent_id = None

    if not folder_name:
        return jsonify({'message': 'Folder name is required'}), 400

    folder = Folder(name=folder_name, user_id=current_user_id, parent_id=parent_id)
    db.session.add(folder)
    db.session.commit()

    return jsonify({'message': 'Folder created successfully', 'folder_id': folder.id})

@app.route('/folders/<int:folder_id>', methods=['DELETE'])
@token_required
def delete_folder(current_user_id, folder_id):
    folder = Folder.query.filter_by(id=folder_id, user_id=current_user_id).first()

    if not folder:
        return jsonify({'message': 'Folder not found'}), 404

    db.session.delete(folder)
    db.session.commit()

    return jsonify({'message': 'Folder deleted'})

@app.route('/images/<int:image_id>', methods=['DELETE'])
@token_required
def delete_image(current_user_id, image_id):
    image = Image.query.filter_by(id=image_id, user_id=current_user_id).first()

    if not image:
        return jsonify({'message': 'Image not found'}), 404

    db.session.delete(image)
    db.session.commit()

    return jsonify({'message': 'Image deleted'})

@app.route('/upload-multiple', methods=['POST'])
@token_required
def upload_multiple_images(current_user_id):
    files = request.files.getlist('files')
    folder_id = request.form.get('folder_id')

    if folder_id == "null":
        folder_id = None

    if not files:
        return jsonify({'message': 'No files provided'}), 400

    urls = []
    for file in files:
        filename = secure_filename(file.filename)
        try:
            url = upload_file_to_s3(file, filename)
            new_image = Image(filename=filename, url=url, user_id=current_user_id, folder_id=folder_id)
            db.session.add(new_image)
            urls.append(url)
        except Exception as e:
            return jsonify({'message': f'Failed to upload {filename}', 'error': str(e)}), 500

    db.session.commit()

    return jsonify({'message': 'Images uploaded successfully', 'urls': urls})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
