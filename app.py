from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
import random
import string
import secrets
import json
import os
from datetime import datetime
import hashlib

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# Файл для хранения пользователей
USERS_FILE = 'users.json'

class PasswordGenerator:
    def __init__(self):
        self.strength_levels = {
            'very_weak': {'score': 0, 'color': '#ff4444', 'label': 'Очень слабый'},
            'weak': {'score': 2, 'color': '#ff6b6b', 'label': 'Слабый'},
            'medium': {'score': 4, 'color': '#ffa726', 'label': 'Средний'},
            'strong': {'score': 6, 'color': '#66bb6a', 'label': 'Сильный'},
            'very_strong': {'score': 8, 'color': '#4caf50', 'label': 'Очень сильный'}
        }

def load_users():
    """Загрузка пользователей из файла"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                users = json.load(f)
                # Добавляем отсутствующие поля для существующих пользователей
                for user in users:
                    if 'email' not in user:
                        user['email'] = f"{user['username']}@example.com"
                    if 'created_at' not in user:
                        user['created_at'] = datetime.now().isoformat()
                return users
        except (json.JSONDecodeError, FileNotFoundError):
            return create_default_users()
    else:
        return create_default_users()

def create_default_users():
    """Создание пользователей по умолчанию"""
    base_users = [
        {
            'username': 'admin', 
            'password': 'admin', 
            'role': 'admin', 
            'email': 'admin@example.com',
            'created_at': datetime.now().isoformat()
        },
        {
            'username': 'user', 
            'password': 'user', 
            'role': 'user', 
            'email': 'user@example.com',
            'created_at': datetime.now().isoformat()
        }
    ]
    save_users(base_users)
    return base_users

def save_users(users):
    """Сохранение пользователей в файл"""
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving users: {e}")
        return False

def get_user_data(username):
    """Получение данных пользователя"""
    users = load_users()
    return next((user for user in users if user['username'] == username), None)

def update_user_data(username, updated_data):
    """Обновление данных пользователя"""
    users = load_users()
    for i, user in enumerate(users):
        if user['username'] == username:
            users[i].update(updated_data)
            return save_users(users)
    return False

def check_password_strength(password):
    """Расширенная проверка сложности пароля"""
    score = 0
    
    if len(password) >= 8: score += 1
    if len(password) >= 12: score += 1
    if len(password) >= 16: score += 2
    if any(c.islower() for c in password): score += 1
    if any(c.isupper() for c in password): score += 1
    if any(c.isdigit() for c in password): score += 1
    if any(c in string.punctuation for c in password): score += 2
    if any(c.islower() for c in password) and any(c.isupper() for c in password): score += 1
    if any(c.isdigit() for c in password) and any(c in string.punctuation for c in password): score += 1
    
    if score >= 8: strength = 'very_strong'
    elif score >= 6: strength = 'strong'
    elif score >= 4: strength = 'medium'
    elif score >= 2: strength = 'weak'
    else: strength = 'very_weak'
    
    strength_levels = {
        'very_weak': {'score': 0, 'color': '#ff4444', 'label': 'Очень слабый'},
        'weak': {'score': 2, 'color': '#ff6b6b', 'label': 'Слабый'},
        'medium': {'score': 4, 'color': '#ffa726', 'label': 'Средний'},
        'strong': {'score': 6, 'color': '#66bb6a', 'label': 'Сильный'},
        'very_strong': {'score': 8, 'color': '#4caf50', 'label': 'Очень сильный'}
    }
    
    return strength_levels[strength]

# Декоратор для проверки аутентификации
def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            flash('Пожалуйста, войдите в систему', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Маршруты аутентификации
@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'username' in session:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users = load_users()
        for user in users:
            if user['username'] == username and user['password'] == password:
                session['username'] = user['username']
                session['role'] = user.get('role', 'user')
                session['email'] = user.get('email', '')
                flash(f'Добро пожаловать, {username}!', 'success')
                return redirect(url_for('dashboard'))
        flash('Неверное имя пользователя или пароль', 'error')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if 'username' in session:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        errors = []
        if len(username) < 3: errors.append('Имя пользователя должно содержать минимум 3 символа')
        if not username.isalnum(): errors.append('Имя пользователя может содержать только буквы и цифры')
        if '@' not in email or '.' not in email: errors.append('Введите корректный email адрес')
        if len(password) < 6: errors.append('Пароль должен содержать минимум 6 символов')
        if password != confirm_password: errors.append('Пароли не совпадают')
        users = load_users()
        if any(user['username'] == username for user in users): errors.append('Пользователь с таким именем уже существует')
        if any(user.get('email') == email for user in users): errors.append('Пользователь с таким email уже существует')
        if errors:
            for error in errors: flash(error, 'error')
        else:
            new_user = {
                'username': username,
                'password': password,
                'email': email,
                'role': 'user',
                'created_at': datetime.now().isoformat()
            }
            users.append(new_user)
            if save_users(users):
                flash('Регистрация прошла успешно! Теперь вы можете войти в систему.', 'success')
                return redirect(url_for('login'))
            else:
                flash('Ошибка при сохранении пользователя', 'error')
    return render_template('register.html')

@app.route('/')
def index():
    if 'username' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('index.html', username=session.get('username'))

@app.route('/generate', methods=['POST'])
@login_required
def generate():
    data = request.json
    length = data.get('length', 16)
    use_uppercase = data.get('uppercase', True)
    use_numbers = data.get('numbers', True)
    use_special = data.get('special', True)
    password_type = data.get('type', 'random')
    
    if password_type == 'random':
        characters = string.ascii_lowercase
        if use_uppercase: characters += string.ascii_uppercase
        if use_numbers: characters += string.digits
        if use_special: characters += string.punctuation
        if not characters: characters = string.ascii_lowercase
        password = ''.join(secrets.choice(characters) for _ in range(length))
    
    strength_level = check_password_strength(password)
    
    return jsonify({
        'password': password,
        'strength': strength_level['label'],
        'color': strength_level['color'],
        'score': strength_level['score'],
        'length': len(password),
    })

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    user_data = get_user_data(session['username'])
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'update_profile':
            # Обновление профиля
            new_email = request.form.get('email')
            new_username = request.form.get('username')
            
            errors = []
            
            # Проверка email
            if '@' not in new_email or '.' not in new_email:
                errors.append('Введите корректный email адрес')
            
            # Проверка имени пользователя
            if len(new_username) < 3:
                errors.append('Имя пользователя должно содержать минимум 3 символа')
            if not new_username.isalnum():
                errors.append('Имя пользователя может содержать только буквы и цифры')
            
            # Проверка уникальности имени пользователя
            users = load_users()
            if new_username != session['username'] and any(user['username'] == new_username for user in users):
                errors.append('Пользователь с таким именем уже существует')
            
            if errors:
                for error in errors:
                    flash(error, 'error')
            else:
                # Обновление данных
                updated_data = {
                    'email': new_email,
                    'username': new_username
                }
                
                if update_user_data(session['username'], updated_data):
                    # Обновляем сессию
                    session['username'] = new_username
                    session['email'] = new_email
                    flash('Профиль успешно обновлен!', 'success')
                    return redirect(url_for('profile'))
                else:
                    flash('Ошибка при обновлении профиля', 'error')
        
        elif action == 'change_password':
            # Смена пароля
            current_password = request.form.get('current_password')
            new_password = request.form.get('new_password')
            confirm_password = request.form.get('confirm_password')
            
            errors = []
            
            # Проверка текущего пароля
            if current_password != user_data['password']:
                errors.append('Текущий пароль неверен')
            
            # Проверка нового пароля
            if len(new_password) < 6:
                errors.append('Новый пароль должен содержать минимум 6 символов')
            if new_password != confirm_password:
                errors.append('Новые пароли не совпадают')
            
            if errors:
                for error in errors:
                    flash(error, 'error')
            else:
                # Обновление пароля
                if update_user_data(session['username'], {'password': new_password}):
                    flash('Пароль успешно изменен!', 'success')
                    return redirect(url_for('profile'))
                else:
                    flash('Ошибка при изменении пароля', 'error')
        
        elif action == 'delete_account':
            # Удаление аккаунта
            confirm_text = request.form.get('confirm_text')
            if confirm_text == session['username']:
                users = load_users()
                users = [user for user in users if user['username'] != session['username']]
                if save_users(users):
                    session.clear()
                    flash('Ваш аккаунт был успешно удален', 'info')
                    return redirect(url_for('login'))
                else:
                    flash('Ошибка при удалении аккаунта', 'error')
            else:
                flash('Введите правильное имя пользователя для подтверждения удаления', 'error')
    
    return render_template('profile.html',
                         username=session.get('username'),
                         role=session.get('role'),
                         email=session.get('email'),
                         user_data=user_data)

@app.route('/logout')
def logout():
    session.clear()
    flash('Вы вышли из системы', 'info')
    return redirect(url_for('login'))

@app.route('/admin')
@login_required
def admin():
    if session.get('role') != 'admin':
        flash('У вас нет прав для доступа к этой странице', 'error')
        return redirect(url_for('index'))
    return render_template('admin.html', username=session.get('username'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
