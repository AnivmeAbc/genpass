 <h1 align="center">Менеджер паролей</h1>
  
### Менеджер ваших паролей с графическим веб-интерфейсом.

## 🚀 Возможности

- **Хранение паролей от разных сервисов**

## 🛠 Технологии

### Backend
![](https://img.shields.io/badge/python-3.13.x-blue.svg)

![](https://img.shields.io/badge/flask-3.1.2-green.svg)

![](https://img.shields.io/badge/SQLite-white.svg)

### Frontend
![](https://img.shields.io/badge/HTML5-orange.svg)
![](https://img.shields.io/badge/CSS3-blue.svg) 

## 📦 Установка и запуск

### Требования
- Python 3.13 или выше
- pip (менеджер пакетов Python)

### Шаги установки

1. **Клонируйте репозиторий** или скачайте файлы проекта:

```bash
git clone <URL репозитория>
cd genpass
```

2. **Создайте виртуальное окружение**:

```bash
python -m venv venv
source venv/bin/activate  # Linux/MacOS
venv\Scripts\activate     # Windows
```

3. Установите зависимости:

```bash
pip install flask
```

4. Запустите приложение:

```bash
python app.py
```

5. Откройте браузер и перейдите по адресу:

```text
http://localhost:5000
```

## 📁 Структура проекта

```text
genpass/
├── app.py              # Основное Flask приложение
├── db.py               # Инициализация базы данных SQLite
├── templates/
│   └── index.html      # Главная страница
│   └── login.html      # Страница авторизации
│   └── register.html   # Страница регистрации
└── README.md           # Документация
```

## 📝 Лицензия

### Этот проект распространяется под GPL-3.0.
