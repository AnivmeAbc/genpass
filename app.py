from flask import Flask, render_template, request, redirect, url_for, session, flash
import os
import hashlib
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

# Папки для хранения данных
USERS_FILE = 'users.txt'
PASSWORDS_DIR = 'passwords'

def init_storage():
    """Инициализация хранилища"""
    os.makedirs('passwords', exist_ok=True)
    
    # Создаем файл пользователей если его нет
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            # Создаем тестовых пользователей
            f.write('admin:admin\n')
            f.write('user:user\n')

def get_user_id(username):
    """Получение ID пользователя на основе хеша имени"""
    return hashlib.md5(username.encode()).hexdigest()

def register_user(username, password):
    """Регистрация нового пользователя"""
    # Проверяем существование пользователя
    if check_user_exists(username):
        return False
    
    # Добавляем пользователя в файл
    with open(USERS_FILE, 'a', encoding='utf-8') as f:
        f.write(f'{username}:{password}\n')
    
    # Создаем файл для паролей пользователя
    user_id = get_user_id(username)
    user_passwords_file = os.path.join(PASSWORDS_DIR, f'{user_id}.txt')
    open(user_passwords_file, 'a', encoding='utf-8').close()
    
    return True

def check_user_exists(username):
    """Проверка существования пользователя"""
    if not os.path.exists(USERS_FILE):
        return False
    
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                stored_username, _ = line.strip().split(':', 1)
                if stored_username == username:
                    return True
    return False

def verify_user(username, password):
    """Проверка логина и пароля"""
    if not os.path.exists(USERS_FILE):
        return False
    
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                stored_username, stored_password = line.strip().split(':', 1)
                if stored_username == username and stored_password == password:
                    return True
    return False

def get_user_passwords(user_id):
    """Получение паролей пользователя"""
    user_passwords_file = os.path.join(PASSWORDS_DIR, f'{user_id}.txt')
    passwords = []
    
    if os.path.exists(user_passwords_file):
        with open(user_passwords_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                if line.strip():
                    try:
                        service, username, password = line.strip().split(':', 2)
                        passwords.append({
                            'id': line_num,
                            'service': service,
                            'username': username,
                            'password': password
                        })
                    except ValueError:
                        continue
    
    return passwords

def add_user_password(user_id, service, username, password):
    """Добавление нового пароля"""
    user_passwords_file = os.path.join(PASSWORDS_DIR, f'{user_id}.txt')
    
    with open(user_passwords_file, 'a', encoding='utf-8') as f:
        f.write(f'{service}:{username}:{password}\n')

def delete_user_password(user_id, password_id):
    """Удаление пароля по ID"""
    user_passwords_file = os.path.join(PASSWORDS_DIR, f'{user_id}.txt')
    
    if not os.path.exists(user_passwords_file):
        return False
    
    # Читаем все пароли
    with open(user_passwords_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Удаляем строку с указанным ID
    if 1 <= password_id <= len(lines):
        del lines[password_id - 1]
        
        # Перезаписываем файл
        with open(user_passwords_file, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        return True
    
    return False

# Инициализация хранилища при запуске
init_storage()

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    passwords = get_user_passwords(session['user_id'])
    return render_template('index.html', passwords=passwords)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if register_user(username, password):
            flash('Регистрация успешна! Теперь вы можете войти.')
            return redirect(url_for('login'))
        else:
            flash('Пользователь с таким именем уже существует!')
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if verify_user(username, password):
            session['user_id'] = get_user_id(username)
            session['username'] = username
            return redirect(url_for('index'))
        else:
            flash('Неверное имя пользователя или пароль!')
    
    return render_template('login.html')

@app.route('/add_password', methods=['POST'])
def add_password():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    service = request.form['service']
    username = request.form['username']
    password = request.form['password']
    
    add_user_password(session['user_id'], service, username, password)
    return redirect(url_for('index'))

@app.route('/delete_password/<int:password_id>')
def delete_password(password_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    if delete_user_password(session['user_id'], password_id):
        flash('Пароль успешно удален!')
    else:
        flash('Ошибка при удалении пароля!')
    
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5678)