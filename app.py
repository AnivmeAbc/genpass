from flask import Flask, render_template, request, jsonify
import random
import string
import secrets
import json
from datetime import datetime

app = Flask(__name__)

class PasswordGenerator:
    def __init__(self):
        self.strength_levels = {
            'very_weak': {'score': 0, 'color': '#ff4444', 'label': 'Очень слабый'},
            'weak': {'score': 2, 'color': '#ff6b6b', 'label': 'Слабый'},
            'medium': {'score': 4, 'color': '#ffa726', 'label': 'Средний'},
            'strong': {'score': 6, 'color': '#66bb6a', 'label': 'Сильный'},
            'very_strong': {'score': 8, 'color': '#4caf50', 'label': 'Очень сильный'}
        }
    
    def calculate_entropy(self, password, char_set_size):
        """Рассчитывает энтропию пароля"""
        length = len(password)
        entropy = length * (char_set_size.bit_length() / 2)
        return round(entropy, 2)
    
    def check_password_strength(self, password):
        """Расширенная проверка сложности пароля"""
        score = 0
        feedback = []
        
        # Длина
        if len(password) >= 8:
            score += 1
        if len(password) >= 12:
            score += 1
        if len(password) >= 16:
            score += 2
        
        # Символы
        has_lower = any(c.islower() for c in password)
        has_upper = any(c.isupper() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in string.punctuation for c in password)
        
        if has_lower:
            score += 1
        if has_upper:
            score += 1
        if has_digit:
            score += 1
        if has_special:
            score += 2
        
        # Дополнительные проверки
        if has_lower and has_upper:
            score += 1
        if has_digit and has_special:
            score += 1
        
        # Определяем уровень сложности
        if score >= 8:
            strength = 'very_strong'
        elif score >= 6:
            strength = 'strong'
        elif score >= 4:
            strength = 'medium'
        elif score >= 2:
            strength = 'weak'
        else:
            strength = 'very_weak'
        
        level = self.strength_levels[strength]
        
        # Генерируем фидбэк
        if len(password) < 8:
            feedback.append("Рекомендуется длина не менее 8 символов")
        if not has_upper:
            feedback.append("Добавьте заглавные буквы")
        if not has_special:
            feedback.append("Добавьте специальные символы")
        
        return level, feedback
    
    def generate_pronounceable_password(self, length=12):
        """Генерация произносимого пароля"""
        vowels = 'aeiou'
        consonants = 'bcdfghjklmnpqrstvwxyz'
        password = []
        
        for i in range(length):
            if i % 2 == 0:
                password.append(random.choice(consonants))
            else:
                password.append(random.choice(vowels))
        
        # Добавляем заглавные буквы и цифры
        if length >= 4:
            password[0] = password[0].upper()
            if length >= 8:
                password[random.randint(2, len(password)-2)] = random.choice(string.digits)
        
        return ''.join(password)
    
    def generate_memorable_password(self, word_count=4):
        """Генерация запоминающегося пароля из слов"""
        words = [
            'apple', 'banana', 'cherry', 'dragon', 'elephant', 'forest', 
            'garden', 'hammer', 'island', 'jupiter', 'knight', 'lighthouse',
            'mountain', 'nebula', 'ocean', 'panda', 'quantum', 'river',
            'sunset', 'tiger', 'universe', 'volcano', 'waterfall', 'xylophone',
            'yellow', 'zeppelin'
        ]
        selected_words = random.sample(words, word_count)
        return '-'.join(selected_words) + str(random.randint(10, 99))

password_generator = PasswordGenerator()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    length = data.get('length', 16)
    use_uppercase = data.get('uppercase', True)
    use_numbers = data.get('numbers', True)
    use_special = data.get('special', True)
    password_type = data.get('type', 'random')
    
    if password_type == 'pronounceable':
        password = password_generator.generate_pronounceable_password(length)
    elif password_type == 'memorable':
        password = password_generator.generate_memorable_password(length // 4)
    else:
        # Стандартная генерация
        characters = string.ascii_lowercase
        if use_uppercase:
            characters += string.ascii_uppercase
        if use_numbers:
            characters += string.digits
        if use_special:
            characters += string.punctuation
        
        if not characters:
            characters = string.ascii_lowercase
        
        password = ''.join(secrets.choice(characters) for _ in range(length))
    
    # Анализ пароля
    strength_level, feedback = password_generator.check_password_strength(password)
    
    # Расчет энтропии
    char_set_size = len(set(characters)) if password_type == 'random' else 26
    entropy = password_generator.calculate_entropy(password, char_set_size)
    
    return jsonify({
        'password': password,
        'strength': strength_level['label'],
        'color': strength_level['color'],
        'score': strength_level['score'],
        'feedback': feedback,
        'entropy': entropy,
        'length': len(password),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/analyze', methods=['POST'])
def analyze_password():
    data = request.json
    password = data.get('password', '')
    
    if not password:
        return jsonify({'error': 'No password provided'})
    
    strength_level, feedback = password_generator.check_password_strength(password)
    entropy = password_generator.calculate_entropy(password, 94)  # Примерный размер набора символов
    
    return jsonify({
        'strength': strength_level['label'],
        'color': strength_level['color'],
        'score': strength_level['score'],
        'feedback': feedback,
        'entropy': entropy,
        'length': len(password)
    })

@app.route('/history/clear', methods=['POST'])
def clear_history():
    return jsonify({'status': 'success', 'message': 'History cleared'})

@app.route('/history/export', methods=['GET'])
def export_history():
    return jsonify({'status': 'success', 'message': 'Export functionality would be implemented here'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
