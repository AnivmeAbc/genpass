// DOM Elements
const elements = {
    password: document.getElementById('password'),
    length: document.getElementById('length'),
    lengthValue: document.getElementById('length-value'),
    uppercase: document.getElementById('uppercase'),
    numbers: document.getElementById('numbers'),
    special: document.getElementById('special'),
    generateBtn: document.getElementById('generate-btn'),
    copyBtn: document.getElementById('copy-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    strengthFill: document.getElementById('strength-fill'),
    strengthText: document.getElementById('strength-text'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notification-text')
};

// Strength levels
const strengthLevels = {
    weak: { text: 'Слабый', color: '#ef4444', width: '33%' },
    medium: { text: 'Средний', color: '#f59e0b', width: '66%' },
    strong: { text: 'Сильный', color: '#10b981', width: '100%' },
    empty: { text: 'Введите параметры', color: '#64748b', width: '0%' }
};

// Initialize
function init() {
    updateLengthValue();
    attachEventListeners();
    generatePassword(); // Generate initial password
}

// Update length value display
function updateLengthValue() {
    elements.lengthValue.textContent = elements.length.value;
}

// Attach event listeners
function attachEventListeners() {
    elements.length.addEventListener('input', updateLengthValue);
    elements.generateBtn.addEventListener('click', generatePassword);
    elements.refreshBtn.addEventListener('click', generatePassword);
    elements.copyBtn.addEventListener('click', copyPassword);

    // Quick action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const length = e.currentTarget.getAttribute('data-length');
            elements.length.value = length;
            updateLengthValue();
            generatePassword();
        });
    });

    // Settings change
    [elements.uppercase, elements.numbers, elements.special].forEach(checkbox => {
        checkbox.addEventListener('change', generatePassword);
    });
}

// Generate password
async function generatePassword() {
    const settings = {
        length: parseInt(elements.length.value),
        uppercase: elements.uppercase.checked,
        numbers: elements.numbers.checked,
        special: elements.special.checked
    };

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings)
        });

        const data = await response.json();

        elements.password.value = data.password;
        updateStrengthIndicator(data.strength, data.color);

    } catch (error) {
        console.error('Error generating password:', error);
        showNotification('Ошибка генерации пароля', 'error');
    }
}

// Update strength indicator
function updateStrengthIndicator(strength, color) {
    let level;

    switch (strength) {
        case 'Слабый':
            level = strengthLevels.weak;
            break;
        case 'Средний':
            level = strengthLevels.medium;
            break;
        case 'Сильный':
            level = strengthLevels.strong;
            break;
        default:
            level = strengthLevels.empty;
    }

    elements.strengthFill.style.width = level.width;
    elements.strengthFill.style.background = color;
    elements.strengthText.textContent = level.text;
    elements.strengthText.style.color = color;
}

// Copy password to clipboard
async function copyPassword() {
    if (!elements.password.value) return;

    try {
        await navigator.clipboard.writeText(elements.password.value);
        showNotification('Пароль скопирован в буфер обмена!');
    } catch (err) {
        // Fallback for older browsers
        elements.password.select();
        document.execCommand('copy');
        showNotification('Пароль скопирован!');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    elements.notificationText.textContent = message;

    // Set color based on type
    if (type === 'error') {
        elements.notification.style.background = '#ef4444';
    } else {
        elements.notification.style.background = '#10b981';
    }

    elements.notification.classList.add('show');

    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// Add some visual effects
function addVisualEffects() {
    // Add ripple effect to buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('.generate-btn, .action-btn, .icon-btn')) {
            const button = e.target;
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            button.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        }
    });
}

// Add ripple effect styles
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    .generate-btn, .action-btn, .icon-btn {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    addVisualEffects();
});