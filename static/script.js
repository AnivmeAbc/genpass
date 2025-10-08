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
        this.loadHistory();
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

        // История
        this.bindHistoryEvents();

        // Анализатор
        this.bindAnalyzerEvents();

        // Настройки
        this.bindSettingsEvents();

        // Глобальные события
        this.bindGlobalEvents();
    }

    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
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
        document.getElementById('generate-btn').addEventListener('click', () => this.generatePassword());
        document.getElementById('refresh-btn').addEventListener('click', () => this.generatePassword());

        // Копирование
        document.getElementById('copy-btn').addEventListener('click', () => this.copyPassword());

        // Слайдер длины
        const lengthSlider = document.getElementById('length');
        const lengthValue = document.getElementById('length-value');
        
        lengthSlider.addEventListener('input', (e) => {
            lengthValue.textContent = e.target.value;
            // Автогенерация при изменении длины
            if (this.settings.autoGenerate) {
                clearTimeout(this.autoGenerateTimeout);
                this.autoGenerateTimeout = setTimeout(() => this.generatePassword(), 300);
            }
        });

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
            document.getElementById(type).addEventListener('change', () => {
                this.validateCharacterSettings();
                this.generatePassword();
            });
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
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generatePassword();
            }
        });
    }

    bindHistoryEvents() {
        document.getElementById('clear-history-btn').addEventListener('click', () => this.showClearConfirmation());

        // Модальное окно очистки
        document.getElementById('confirm-clear-btn').addEventListener('click', () => this.clearHistory());
        document.getElementById('cancel-clear-btn').addEventListener('click', () => this.hideClearConfirmation());
        document.querySelector('.modal-close').addEventListener('click', () => this.hideClearConfirmation());

        // Закрытие модального окна
        document.getElementById('clear-confirm-modal').addEventListener('click', (e) => {
            if (e.target.id === 'clear-confirm-modal') {
                this.hideClearConfirmation();
            }
        });

        // Поиск в истории
        const searchInput = document.getElementById('history-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterHistory(e.target.value);
            });
        }

        // Сортировка истории
        const sortSelect = document.getElementById('history-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortHistory(e.target.value);
            });
        }
    }

    bindAnalyzerEvents() {
        document.getElementById('analyze-btn').addEventListener('click', () => this.analyzePassword());
        
        const analyzeInput = document.getElementById('analyze-password');
        analyzeInput.addEventListener('input', (e) => {
            // Реал-тайм анализ при вводе
            if (e.target.value.length > 0) {
                clearTimeout(this.analyzeTimeout);
                this.analyzeTimeout = setTimeout(() => this.analyzePassword(), 500);
            }
        });

        analyzeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzePassword();
            }
        });

        // Показать/скрыть пароль в анализаторе
        const toggleAnalyzeVisibility = document.getElementById('toggle-analyze-visibility');
        if (toggleAnalyzeVisibility) {
            toggleAnalyzeVisibility.addEventListener('click', () => {
                const input = document.getElementById('analyze-password');
                const icon = toggleAnalyzeVisibility.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        }
    }

    bindSettingsEvents() {
        // Сохранение настроек
        document.getElementById('save-settings-btn')?.addEventListener('click', () => this.saveUserSettings());

        // Сброс настроек
        document.getElementById('reset-settings-btn')?.addEventListener('click', () => this.resetSettings());

        // Импорт/экспорт настроек (только импорт оставляем)
        document.getElementById('import-settings-btn')?.addEventListener('click', () => this.importSettings());

        // Превью темы
        const themeSelect = document.getElementById('setting-theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.previewTheme(e.target.value);
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
    }

    validateCharacterSettings() {
        const uppercase = document.getElementById('uppercase').checked;
        const numbers = document.getElementById('numbers').checked;
        const special = document.getElementById('special').checked;

        // Если ничего не выбрано, автоматически включаем буквы
        if (!uppercase && !numbers && !special) {
            document.getElementById('uppercase').checked = true;
        }
    }

    async generatePassword() {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        const generateBtn = document.getElementById('generate-btn');
        const refreshBtn = document.getElementById('refresh-btn');
        
        // Визуальная индикация процесса
        this.setButtonState(generateBtn, true);
        this.setButtonState(refreshBtn, true);

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
            this.setButtonState(refreshBtn, false);
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

        // Анимация появления пароля
        this.animatePasswordDisplay(passwordField, data.password);

        // Обновление индикатора сложности
        this.updateStrengthIndicator(strengthFill, strengthText, data);

        // Обновление статистики
        entropyValue.textContent = data.entropy;
        analysisLength.textContent = data.length;
        analysisComplexity.textContent = data.strength;
        analysisTime.textContent = this.calculateCrackTime(data.entropy);

        // Обновление рекомендаций
        this.displayFeedback(data.feedback, feedbackList);

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
            length: parseInt(document.getElementById('length').value),
            uppercase: document.getElementById('uppercase').checked,
            numbers: document.getElementById('numbers').checked,
            special: document.getElementById('special').checked,
            type: activeType
        };
    }

    // История паролей
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
        const historyList = document.getElementById('history-list');
        this.updateHistoryStats();

        if (this.history.length === 0) {
            historyList.innerHTML = this.getEmptyHistoryHTML();
            return;
        }

        historyList.innerHTML = this.history.map(item => this.getHistoryItemHTML(item)).join('');
        this.bindHistoryItemEvents();
    }

    getEmptyHistoryHTML() {
        return `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <h3>История пуста</h3>
                <p>Сгенерированные пароли появятся здесь</p>
                <div class="action-hint">
                    Перейдите во вкладку "Генератор" чтобы создать первый пароль
                </div>
            </div>
        `;
    }

    getHistoryItemHTML(item) {
        return `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <span class="history-strength" style="color: ${item.color}; border: 1px solid ${item.color}20; background: ${item.color}10;">
                        ${item.strength}
                    </span>
                    <span class="history-type">${this.getPasswordTypeLabel(item.type)}</span>
                    <span class="history-time">${item.timestamp}</span>
                </div>
                <div class="history-password">
                    <code class="password-text">${item.password}</code>
                    <div class="history-actions">
                        <button class="history-action-btn copy-history" data-password="${item.password}" title="Копировать">
                            <i class="far fa-copy"></i>
                        </button>
                        <button class="history-action-btn regenerate-history" data-settings='${JSON.stringify(item)}' title="Перегенерировать">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="history-action-btn delete-single" data-id="${item.id}" title="Удалить">
                            <i class="far fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="history-meta">
                    <span><i class="fas fa-ruler"></i> ${item.length} симв.</span>
                    <span><i class="fas fa-brain"></i> ${item.entropy} бит</span>
                    <span><i class="fas fa-clock"></i> ${this.calculateCrackTime(item.entropy)}</span>
                </div>
            </div>
        `;
    }

    getPasswordTypeLabel(type) {
        const types = {
            random: 'Случайный',
            pronounceable: 'Произносимый',
            memorable: 'Запоминаемый'
        };
        return types[type] || type;
    }

    bindHistoryItemEvents() {
        document.querySelectorAll('.copy-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const password = e.currentTarget.dataset.password;
                this.copySpecificPassword(password);
            });
        });

        document.querySelectorAll('.regenerate-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const settings = JSON.parse(e.currentTarget.dataset.settings);
                this.regenerateFromHistory(settings);
            });
        });

        document.querySelectorAll('.delete-single').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.deleteHistoryItem(id);
            });
        });
    }

    updateHistoryStats() {
        const totalPasswords = document.getElementById('total-passwords');
        const lastGenerated = document.getElementById('last-generated');
        const avgLength = document.getElementById('avg-length');
        const avgEntropy = document.getElementById('avg-entropy');

        if (totalPasswords) totalPasswords.textContent = this.history.length;

        if (this.history.length > 0) {
            const lastItem = this.history[0];
            if (lastGenerated) lastGenerated.textContent = lastItem.timestamp;
            
            const avgLen = Math.round(this.history.reduce((sum, item) => sum + item.length, 0) / this.history.length);
            const avgEnt = Math.round(this.history.reduce((sum, item) => sum + item.entropy, 0) / this.history.length * 100) / 100;
            
            if (avgLength) avgLength.textContent = avgLen;
            if (avgEntropy) avgEntropy.textContent = avgEnt;
        } else {
            if (lastGenerated) lastGenerated.textContent = '-';
            if (avgLength) avgLength.textContent = '0';
            if (avgEntropy) avgEntropy.textContent = '0';
        }
    }

    async analyzePassword() {
        const password = document.getElementById('analyze-password').value;
        
        if (!password) {
            this.showNotification('Введите пароль для анализа', 'warning');
            return;
        }

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayAnalysisResults(data);
            
        } catch (error) {
            console.error('Error analyzing password:', error);
            this.showNotification('Ошибка анализа. Используется локальный анализ.', 'error');
            this.analyzePasswordLocally(password);
        }
    }

    analyzePasswordLocally(password) {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        const strength = this.estimatePasswordStrength(password);
        const entropy = this.calculateEntropy(password, characters.length);
        
        const feedback = this.generateFeedback(password, strength);
        
        const data = {
            strength: strength.label,
            color: strength.color,
            score: strength.score,
            feedback,
            entropy,
            length: password.length
        };
        
        this.displayAnalysisResults(data);
    }

    generateFeedback(password, strength) {
        const feedback = [];
        
        if (password.length < 8) {
            feedback.push("Рекомендуется длина не менее 8 символов");
        }
        
        if (!/[A-Z]/.test(password)) {
            feedback.push("Добавьте заглавные буквы для увеличения сложности");
        }
        
        if (!/[0-9]/.test(password)) {
            feedback.push("Добавьте цифры для увеличения сложности");
        }
        
        if (!/[^a-zA-Z0-9]/.test(password)) {
            feedback.push("Добавьте специальные символы для максимальной безопасности");
        }
        
        if (strength.score < 6) {
            feedback.push("Рекомендуется использовать пароль средней или высокой сложности");
        }
        
        return feedback;
    }

    displayAnalysisResults(data) {
        const resultsContainer = document.getElementById('analyzer-results');
        
        resultsContainer.innerHTML = `
            <div class="analysis-result">
                <div class="result-header">
                    <h3>Результаты анализа</h3>
                    <div class="strength-badge" style="color: ${data.color}">
                        ${data.strength}
                    </div>
                </div>
                <div class="result-stats">
                    <div class="stat">
                        <span>Длина:</span>
                        <strong>${data.length} символов</strong>
                    </div>
                    <div class="stat">
                        <span>Энтропия:</span>
                        <strong>${data.entropy} бит</strong>
                    </div>
                    <div class="stat">
                        <span>Время подбора:</span>
                        <strong>${this.calculateCrackTime(data.entropy)}</strong>
                    </div>
                </div>
                <div class="result-feedback">
                    <h4>Рекомендации:</h4>
                    ${data.feedback.map(item => `
                        <div class="feedback-item">
                            <i class="fas fa-info-circle"></i>
                            <span>${item}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Управление историей
    showClearConfirmation() {
        if (this.history.length === 0) {
            this.showNotification('История уже пуста', 'info');
            return;
        }

        const modal = document.getElementById('clear-confirm-modal');
        modal.classList.add('show');
    }

    hideClearConfirmation() {
        const modal = document.getElementById('clear-confirm-modal');
        modal.classList.remove('show');
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.loadHistory();
        this.hideClearConfirmation();
        this.showNotification('История очищена', 'info');
    }

    deleteHistoryItem(id) {
        this.history = this.history.filter(item => item.id !== id);
        this.saveHistory();
        this.loadHistory();
        this.showNotification('Запись удалена из истории', 'info');
    }

    copySpecificPassword(password) {
        navigator.clipboard.writeText(password).then(() => {
            this.showNotification('Пароль скопирован из истории');
        }).catch(() => {
            this.fallbackCopySpecificPassword(password);
        });
    }

    fallbackCopySpecificPassword(password) {
        const textArea = document.createElement('textarea');
        textArea.value = password;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showNotification('Пароль скопирован из истории');
    }

    regenerateFromHistory(settings) {
        // Устанавливаем настройки из истории
        document.getElementById('length').value = settings.length;
        document.getElementById('length-value').textContent = settings.length;
        
        // Переключаемся на вкладку генератора
        this.switchTab('generator');
        
        // Генерируем новый пароль с теми же настройками
        setTimeout(() => this.generatePassword(), 100);
    }

    filterHistory(searchTerm) {
        const filtered = this.history.filter(item => 
            item.password.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.strength.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderFilteredHistory(filtered);
    }

    sortHistory(criteria) {
        let sorted = [...this.history];
        
        switch(criteria) {
            case 'date-desc':
                sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-asc':
                sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'length-desc':
                sorted.sort((a, b) => b.length - a.length);
                break;
            case 'length-asc':
                sorted.sort((a, b) => a.length - b.length);
                break;
            case 'strength-desc':
                const strengthOrder = { 'Очень сильный': 4, 'Сильный': 3, 'Средний': 2, 'Слабый': 1, 'Очень слабый': 0 };
                sorted.sort((a, b) => strengthOrder[b.strength] - strengthOrder[a.strength]);
                break;
        }
        
        this.renderFilteredHistory(sorted);
    }

    renderFilteredHistory(items) {
        const historyList = document.getElementById('history-list');
        
        if (items.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-search"></i>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить условия поиска</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = items.map(item => this.getHistoryItemHTML(item)).join('');
        this.bindHistoryItemEvents();
    }

    // Настройки приложения
    saveUserSettings() {
        const autoCopy = document.getElementById('setting-auto-copy')?.checked || false;
        const saveHistory = document.getElementById('setting-save-history')?.checked || true;
        const clearClipboard = parseInt(document.getElementById('setting-clear-clipboard')?.value) || 0;
        const theme = document.getElementById('setting-theme')?.value || 'dark';
        const animation = document.getElementById('setting-animation')?.checked || true;

        this.settings = {
            ...this.settings,
            autoCopy,
            saveHistory,
            clearClipboard,
            theme,
            animation
        };

        this.saveSettings();
        this.applySettings();
        this.showNotification('Настройки сохранены', 'success');
    }

    resetSettings() {
        this.settings = {
            autoCopy: false,
            saveHistory: true,
            clearClipboard: 30,
            theme: 'dark',
            defaultLength: 16,
            animation: true
        };

        this.saveSettings();
        this.applySettings();
        this.showNotification('Настройки сброшены', 'info');
    }

    previewTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const settings = JSON.parse(event.target.result);
                    this.settings = { ...this.settings, ...settings };
                    this.saveSettings();
                    this.applySettings();
                    this.showNotification('Настройки импортированы', 'success');
                } catch (error) {
                    this.showNotification('Ошибка чтения настроек', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
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
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
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
    
    // Восстанавливаем активную вкладку
    const savedTab = localStorage.getItem('activeTab') || 'generator';
    passwordManager.switchTab(savedTab);
    
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
