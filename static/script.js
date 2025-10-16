class PasswordManager {
    constructor() {
        this.currentPassword = '';
        this.history = JSON.parse(localStorage.getItem('passwordHistory')) || [];
        this.settings = this.loadSettings();
        this.isGenerating = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.applySettings();
        this.generatePassword();
    }

    loadSettings() {
        const defaultSettings = {
            autoCopy: false,
            saveHistory: true,
            clearClipboard: 30,
            theme: 'dark',
            defaultLength: 16,
            animation: true
        };
        return JSON.parse(localStorage.getItem('appSettings')) || defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('appSettings', JSON.stringify(this.settings));
    }

    applySettings() {
        // Применяем настройки темы
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Применяем настройки анимаций
        if (!this.settings.animation) {
            document.body.classList.add('no-animation');
        }
        
        // Обновляем значения в интерфейсе настроек
        this.updateSettingsUI();
    }

    updateSettingsUI() {
        const settingsTab = document.getElementById('settings');
        if (settingsTab) {
            const autoCopy = settingsTab.querySelector('#setting-auto-copy');
            const saveHistory = settingsTab.querySelector('#setting-save-history');
            const clearClipboard = settingsTab.querySelector('#setting-clear-clipboard');
            const theme = settingsTab.querySelector('#setting-theme');
            const animation = settingsTab.querySelector('#setting-animation');

            if (autoCopy) autoCopy.checked = this.settings.autoCopy;
            if (saveHistory) saveHistory.checked = this.settings.saveHistory;
            if (clearClipboard) clearClipboard.value = this.settings.clearClipboard;
            if (theme) theme.value = this.settings.theme;
            if (animation) animation.checked = this.settings.animation;
        }
    }

    bindEvents() {
        // Навигация
        this.bindNavigation();

        // Генератор паролей
        this.bindGeneratorEvents();

        // Глобальные события
        this.bindGlobalEvents();
    }

    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Для ссылки выхода не предотвращаем переход
                if (item.classList.contains('logout')) {
                    return; // Позволяем браузеру перейти по ссылке
                }
                
                // Для ссылки профиля - переходим на страницу профиля
                if (item.classList.contains('profile') || item.href && item.href.includes('/profile')) {
                    return; // Позволяем браузеру перейти по ссылке профиля
                }
                
                // if (item.classList.contains('admin') || item.href && item.href.includes('/admin')) {
                //     return; // Позволяем браузеру перейти по ссылке профиля
                // }

                e.preventDefault();
                this.switchTab(item.dataset.tab);
            });
        });

        // Быстрая навигация по хоткеям
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchTab('generator');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTab('analyzer');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchTab('history');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchTab('settings');
                        break;
                }
            }
        });
    }

    bindGeneratorEvents() {
        // Основная кнопка генерации
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generatePassword());
        }
        
        // Копирование
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyPassword());
        }

        // Слайдер длины
        const lengthSlider = document.getElementById('length');
        const lengthValue = document.getElementById('length-value');
        
        if (lengthSlider && lengthValue) {
            lengthSlider.addEventListener('input', (e) => {
                lengthValue.textContent = e.target.value;
                // Автогенерация при изменении длины
                if (this.settings.autoGenerate) {
                    clearTimeout(this.autoGenerateTimeout);
                    this.autoGenerateTimeout = setTimeout(() => this.generatePassword(), 300);
                }
            });
        }

        // Типы паролей
        document.querySelectorAll('.type-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.type-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.generatePassword();
            });
        });

        // Настройки символов
        ['uppercase', 'numbers', 'special'].forEach(type => {
            const element = document.getElementById(type);
            if (element) {
                element.addEventListener('change', () => {
                    this.validateCharacterSettings();
                    this.generatePassword();
                });
            }
        });

        // Быстрые пресеты
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const length = btn.dataset.length;
                const uppercase = btn.dataset.uppercase === 'true';
                const numbers = btn.dataset.numbers === 'true';
                const special = btn.dataset.special === 'true';

                document.getElementById('length').value = length;
                document.getElementById('length-value').textContent = length;
                document.getElementById('uppercase').checked = uppercase;
                document.getElementById('numbers').checked = numbers;
                document.getElementById('special').checked = special;

                this.generatePassword();
                
                // Визуальный фидбэк
                this.animateButton(btn);
            });
        });

        // Генерация по Enter в поле пароля
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.generatePassword();
                }
            });
        }
    }

    bindGlobalEvents() {
        // Глобальные хоткеи
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + C - копировать текущий пароль
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.copyPassword();
            }
            
            // Ctrl/Cmd + Shift + G - сгенерировать новый пароль
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
                e.preventDefault();
                this.generatePassword();
            }
        });

        // Автосохранение при закрытии
        window.addEventListener('beforeunload', () => {
            this.saveSettings();
        });

        // Online/offline статус
        window.addEventListener('online', () => {
            this.showNotification('Соединение восстановлено', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Отсутствует соединение', 'warning');
        });

        // Обработка кнопки выхода с подтверждением
        this.bindLogoutEvent();
    }

    bindLogoutEvent() {
        const logoutBtn = document.querySelector('.nav-item.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.confirmLogout();
            });
        }
    }

    confirmLogout() {
        if (confirm('Вы уверены, что хотите выйти из системы?')) {
            // Перенаправляем на страницу выхода
            window.location.href = '/logout';
        }
    }

    validateCharacterSettings() {
        const uppercase = document.getElementById('uppercase')?.checked;
        const numbers = document.getElementById('numbers')?.checked;
        const special = document.getElementById('special')?.checked;

        // Если ничего не выбрано, автоматически включаем буквы
        if (!uppercase && !numbers && !special) {
            const uppercaseElement = document.getElementById('uppercase');
            if (uppercaseElement) {
                uppercaseElement.checked = true;
            }
        }
    }

    async generatePassword() {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        const generateBtn = document.getElementById('generate-btn');
        
        // Визуальная индикация процесса
        this.setButtonState(generateBtn, true);

        const settings = this.getSettings();
        
        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayPassword(data);
            
            if (this.settings.saveHistory) {
                this.addToHistory(data);
            }
            
            // Автокопирование если включено
            if (this.settings.autoCopy) {
                setTimeout(() => this.copyPassword(), 100);
            }
            
        } catch (error) {
            console.error('Error generating password:', error);
            this.showNotification('Ошибка генерации пароля. Используется локальный генератор.', 'error');
            // Fallback на клиентскую генерацию
            this.generatePasswordLocally(settings);
        } finally {
            this.isGenerating = false;
            this.setButtonState(generateBtn, false);
        }
    }

    generatePasswordLocally(settings) {
        const characters = this.getCharacterSet(settings);
        let password = '';
        
        for (let i = 0; i < settings.length; i++) {
            password += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        // Базовая оценка сложности
        const strength = this.estimatePasswordStrength(password);
        const entropy = this.calculateEntropy(password, characters.length);
        
        const data = {
            password,
            strength: strength.label,
            color: strength.color,
            score: strength.score,
            feedback: [],
            entropy,
            length: password.length
        };
        
        this.displayPassword(data);
        
        if (this.settings.saveHistory) {
            this.addToHistory(data);
        }
    }

    getCharacterSet(settings) {
        let characters = 'abcdefghijklmnopqrstuvwxyz';
        
        if (settings.uppercase) characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (settings.numbers) characters += '0123456789';
        if (settings.special) characters += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        return characters;
    }

    estimatePasswordStrength(password) {
        let score = 0;
        
        // Длина
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 2;
        
        // Разнообразие символов
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 2;
        
        // Дополнительные критерии
        if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) score += 1;
        if (/(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)) score += 1;
        
        if (score >= 8) return { label: 'Очень сильный', color: '#4caf50', score };
        if (score >= 6) return { label: 'Сильный', color: '#66bb6a', score };
        if (score >= 4) return { label: 'Средний', color: '#ffa726', score };
        if (score >= 2) return { label: 'Слабый', color: '#ff6b6b', score };
        return { label: 'Очень слабый', color: '#ff4444', score };
    }

    calculateEntropy(password, charSetSize) {
        const length = password.length;
        const entropy = length * (Math.log(charSetSize) / Math.log(2));
        return Math.round(entropy * 100) / 100;
    }

    displayPassword(data) {
        const passwordField = document.getElementById('password');
        const strengthFill = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');
        const entropyValue = document.getElementById('entropy-value');
        const analysisLength = document.getElementById('analysis-length');
        const analysisComplexity = document.getElementById('analysis-complexity');
        const analysisTime = document.getElementById('analysis-time');
        const feedbackList = document.getElementById('feedback-list');

        if (!passwordField) return;

        // Анимация появления пароля
        this.animatePasswordDisplay(passwordField, data.password);

        // Обновление индикатора сложности
        if (strengthFill && strengthText) {
            this.updateStrengthIndicator(strengthFill, strengthText, data);
        }

        // Обновление статистики
        if (entropyValue) entropyValue.textContent = data.entropy;
        if (analysisLength) analysisLength.textContent = data.length;
        if (analysisComplexity) analysisComplexity.textContent = data.strength;
        if (analysisTime) analysisTime.textContent = this.calculateCrackTime(data.entropy);

        // Обновление рекомендаций
        if (feedbackList) {
            this.displayFeedback(data.feedback, feedbackList);
        }

        // Сохранение текущего пароля
        this.currentPassword = data.password;
    }

    animatePasswordDisplay(field, newPassword) {
        field.style.opacity = '0';
        field.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            field.value = newPassword;
            field.style.opacity = '1';
            field.style.transform = 'translateY(0)';
        }, 150);
    }

    updateStrengthIndicator(fill, text, data) {
        const percentage = Math.min(100, (data.score / 10) * 100);
        
        fill.style.width = `0%`;
        fill.style.background = data.color;
        
        // Анимация заполнения
        setTimeout(() => {
            fill.style.width = `${percentage}%`;
        }, 100);
        
        text.textContent = data.strength;
        text.style.color = data.color;
    }

    calculateCrackTime(entropy) {
        const guessesPerSecond = 1e9; // 1 миллиард попыток в секунду
        const combinations = Math.pow(2, entropy);
        const seconds = combinations / guessesPerSecond;

        if (seconds < 60) return '< 1 минуты';
        if (seconds < 3600) return `${Math.ceil(seconds / 60)} мин`;
        if (seconds < 86400) return `${Math.ceil(seconds / 3600)} ч`;
        if (seconds < 31536000) return `${Math.ceil(seconds / 86400)} дн`;
        if (seconds < 315360000) return `${Math.ceil(seconds / 31536000)} лет`;
        return 'Миллионы лет';
    }

    displayFeedback(feedback, container) {
        if (!feedback || feedback.length === 0) {
            container.innerHTML = `
                <div class="feedback-item positive">
                    <i class="fas fa-check-circle"></i>
                    <span>Пароль соответствует рекомендациям безопасности</span>
                </div>
            `;
            return;
        }

        container.innerHTML = feedback.map(item => `
            <div class="feedback-item warning">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${item}</span>
            </div>
        `).join('');
    }

    async copyPassword() {
        if (!this.currentPassword) {
            this.showNotification('Сначала сгенерируйте пароль', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.currentPassword);
            this.showNotification('Пароль скопирован в буфер обмена!');
            
            // Очистка буфера через заданное время если включено
            if (this.settings.clearClipboard > 0) {
                setTimeout(async () => {
                    try {
                        await navigator.clipboard.writeText('');
                    } catch (e) {
                        console.log('Auto-clear clipboard not supported');
                    }
                }, this.settings.clearClipboard * 1000);
            }
            
            // Визуальный фидбэк
            this.animateButton(document.getElementById('copy-btn'));
            
        } catch (err) {
            // Fallback для старых браузеров
            this.fallbackCopyPassword();
        }
    }

    fallbackCopyPassword() {
        const textArea = document.createElement('textarea');
        textArea.value = this.currentPassword;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showNotification('Пароль скопирован!');
            this.animateButton(document.getElementById('copy-btn'));
        } catch (err) {
            this.showNotification('Не удалось скопировать пароль', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    getSettings() {
        const activeType = document.querySelector('.type-option.active')?.dataset.type || 'random';
        
        return {
            length: parseInt(document.getElementById('length')?.value || 16),
            uppercase: document.getElementById('uppercase')?.checked || true,
            numbers: document.getElementById('numbers')?.checked || true,
            special: document.getElementById('special')?.checked || true,
            type: activeType
        };
    }

    addToHistory(passwordData) {
        const historyItem = {
            ...passwordData,
            id: Date.now(),
            timestamp: new Date().toLocaleString('ru-RU'),
            date: new Date().toISOString(),
            type: this.getSettings().type
        };

        this.history.unshift(historyItem);
        this.history = this.history.slice(0, 100); // Ограничиваем историю
        this.saveHistory();
        this.loadHistory();
    }

    saveHistory() {
        localStorage.setItem('passwordHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        // Загрузка истории (если нужно)
    }

    // Утилиты
    switchTab(tabName) {
        // Обновляем навигацию
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Показываем соответствующий контент
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName)?.classList.add('active');

        // Сохраняем активную вкладку
        localStorage.setItem('activeTab', tabName);
    }

    showNotification(message, type = 'success') {
        // Создаем уведомление если его нет
        let notification = document.getElementById('notification');
        let notificationText = document.getElementById('notification-text');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-check-circle"></i>
                    <span id="notification-text"></span>
                </div>
            `;
            document.body.appendChild(notification);
            notificationText = document.getElementById('notification-text');
        }
        
        if (!notification || !notificationText) return;
        
        notificationText.textContent = message;
        
        // Устанавливаем цвет в зависимости от типа
        notification.className = 'notification';
        notification.classList.add(type);
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    animateButton(button) {
        if (!button) return;
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    setButtonState(button, loading) {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            button.disabled = false;
            if (button.id === 'generate-btn') {
                button.innerHTML = '<i class="fas fa-key"></i> Сгенерировать пароль';
            } else if (button.id === 'refresh-btn') {
                button.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const passwordManager = new PasswordManager();
    
    // Восстанавливаем активную вкладку только если мы на главной странице
    if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
        const savedTab = localStorage.getItem('activeTab') || 'generator';
        passwordManager.switchTab(savedTab);
    }
    
    // Добавляем глобальный доступ для отладки
    window.passwordManager = passwordManager;
});

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Offline поддержка
window.addEventListener('online', () => {
    document.body.classList.remove('offline');
});

window.addEventListener('offline', () => {
    document.body.classList.add('offline');
});
