from flask import Flask, render_template, request, jsonify
import random
import string
import secrets

app = Flask(__name__)


def check_password_strength(password):
    """Оценка сложности пароля"""
    score = 0
    if len(password) >= 12:
        score += 1
    if any(c.islower() for c in password):
        score += 1
    if any(c.isupper() for c in password):
        score += 1
    if any(c.isdigit() for c in password):
        score += 1
    if any(c in string.punctuation for c in password):
        score += 1

    if score <= 2:
        return "Слабый", "#ff4444"
    elif score <= 4:
        return "Средний", "#ffaa00"
    else:
        return "Сильный", "#00c851"


def generate_password(length=16, use_uppercase=True, use_numbers=True, use_special=True):
    characters = string.ascii_lowercase

    if use_uppercase:
        characters += string.ascii_uppercase
    if use_numbers:
        characters += string.digits
    if use_special:
        characters += string.punctuation

    if not characters:
        characters = string.ascii_lowercase

    # Используем cryptographically secure random generator
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return password


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

    password = generate_password(length, use_uppercase, use_numbers, use_special)
    strength, color = check_password_strength(password)

    return jsonify({
        'password': password,
        'strength': strength,
        'color': color
    })


if __name__ == '__main__':
    app.run(debug=True)