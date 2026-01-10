// Версия приложения для обновления кэша
const APP_VERSION = '2.4';

// Принудительное обновление кэша при изменении версии
const cachedVersion = localStorage.getItem('app_version');
if (cachedVersion !== APP_VERSION) {
    localStorage.setItem('app_version', APP_VERSION);
    // Очистка кэша для CSS и JS
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
        const href = link.href.split('?')[0];
        link.href = href + '?v=' + APP_VERSION + '&nocache=' + Date.now();
    });
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        if (script.src && !script.src.includes('telegram.org')) {
            const src = script.src.split('?')[0];
            script.src = src + '?v=' + APP_VERSION + '&nocache=' + Date.now();
        }
    });
}

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Получаем данные пользователя из Telegram
const user = tg.initDataUnsafe?.user || {};
const userId = user.id || null;
const userName = user.first_name || 'Гость';
const userLastName = user.last_name || '';
const userUsername = user.username || '';

// Функция переключения экранов с максимально плавной анимацией
function showScreen(screenName) {
    const screens = document.querySelectorAll('.screen');
    const targetScreen = document.getElementById(screenName + 'Screen');
    
    if (!targetScreen) {
        document.getElementById('homeScreen').classList.add('active');
        return;
    }
    
    // Плавное скрытие текущего экрана с эффектом blur
    screens.forEach(screen => {
        if (screen.classList.contains('active')) {
            screen.style.transition = 'opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            screen.style.opacity = '0';
            screen.style.transform = 'translateY(30px) scale(0.97)';
            screen.style.filter = 'blur(10px)';
            
            setTimeout(() => {
                screen.classList.remove('active');
                screen.style.opacity = '';
                screen.style.transform = '';
                screen.style.filter = '';
                screen.style.transition = '';
            }, 500);
        }
    });
    
    // Плавное появление нового экрана
    setTimeout(() => {
        targetScreen.classList.add('active');
        targetScreen.style.opacity = '0';
        targetScreen.style.transform = 'translateY(30px) scale(0.97)';
        targetScreen.style.filter = 'blur(10px)';
        
        requestAnimationFrame(() => {
            targetScreen.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            setTimeout(() => {
                targetScreen.style.opacity = '1';
                targetScreen.style.transform = 'translateY(0) scale(1)';
                targetScreen.style.filter = 'blur(0)';
            }, 10);
        });
    }, 500);
}

// Обработка кликов по пунктам меню
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        const screen = this.getAttribute('data-screen');
        showScreen(screen);
    });
});

// Загрузка данных профиля
function loadProfile() {
    const profileInfo = document.getElementById('profileInfo');
    if (profileInfo) {
        profileInfo.innerHTML = `
            <h3 style="font-size: 24px; margin-bottom: 10px; color: var(--text-primary);">${userName} ${userLastName}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 5px;">@${userUsername || 'не указан'}</p>
            <p style="color: var(--text-secondary);">ID: ${userId || 'не определен'}</p>
        `;
    }
}

// Показ моих записей
function showMyAppointments() {
    tg.showAlert('Функция "Мои записи" будет доступна после записи. Используйте команду /my_appointments в боте.');
}

// Открытие карты
function openMap() {
    const address = 'г. Москва, ул. Примерная, д. 123';
    const mapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
    window.open(mapUrl, '_blank');
}

// Звонок по телефону
function callPhone(phone) {
    window.location.href = `tel:${phone}`;
}

// Открытие Telegram
function openTelegram(username) {
    const tgUrl = `https://t.me/${username.replace('@', '')}`;
    window.open(tgUrl, '_blank');
}

// Инициализация формы записи
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Обработка отправки формы
const form = document.getElementById('appointmentForm');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Получаем данные формы
        let serviceValue = document.getElementById('service').value;
        // Убираем эмодзи и цену из названия услуги для отправки
        serviceValue = serviceValue.replace(/^[^\s]+\s+/, '').replace(/\s*-\s*\d+₽$/, '');
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            service: serviceValue,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value
        };
        
        // Валидация
        if (!formData.name || !formData.phone || !formData.service || !formData.date || !formData.time) {
            tg.showAlert('Пожалуйста, заполните все поля');
            return;
        }
        
        // Валидация телефона
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(formData.phone)) {
            tg.showAlert('Пожалуйста, введите корректный номер телефона');
            return;
        }
        
        // Отключаем кнопку отправки с анимацией
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>⏳ Отправка...</span>';
            submitBtn.style.opacity = '0.7';
            submitBtn.style.transform = 'scale(0.98)';
        }
        
        try {
            // Добавляем данные пользователя
            const requestData = {
                ...formData,
                user_id: userId,
                username: userUsername || ''
            };
            
            // Логируем данные перед отправкой
            console.log('📤 Отправка данных в бот:', requestData);
            
            // Отправляем данные через API endpoint
            const response = await fetch('/api/appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Ошибка отправки данных');
            }
            
            console.log('✅ Данные успешно отправлены через API:', result);
            
            // Максимально плавное скрытие формы и показ сообщения об успехе
            form.style.transition = 'opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            form.style.opacity = '0';
            form.style.transform = 'translateY(-30px) scale(0.95)';
            form.style.filter = 'blur(10px)';
            
            setTimeout(() => {
                form.style.display = 'none';
                if (successMessage) {
                    successMessage.style.display = 'block';
                    successMessage.style.opacity = '0';
                    successMessage.style.transform = 'scale(0.85) rotate(-3deg)';
                    successMessage.style.filter = 'blur(10px)';
                    
                    requestAnimationFrame(() => {
                        successMessage.style.transition = 'opacity 0.9s cubic-bezier(0.68, -0.55, 0.265, 1.55), transform 0.9s cubic-bezier(0.68, -0.55, 0.265, 1.55), filter 0.9s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                        
                        setTimeout(() => {
                            successMessage.style.opacity = '1';
                            successMessage.style.transform = 'scale(1) rotate(0deg)';
                            successMessage.style.filter = 'blur(0)';
                        }, 10);
                    });
                }
            }, 600);
            
            // Показываем уведомление в Telegram
            tg.showAlert('✅ Запись отправлена! Проверьте сообщение в боте.');
            
            // НЕ закрываем Mini App автоматически - пусть пользователь сам закроет
            // Пользователь увидит сообщение в боте с деталями записи
            
        } catch (error) {
            console.error('Ошибка отправки данных:', error);
            tg.showAlert('Произошла ошибка. Попробуйте позже.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>📅 Записаться</span>';
                submitBtn.style.opacity = '1';
                submitBtn.style.transform = 'scale(1)';
            }
        }
    });
}

// Форматирование телефона
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0 && value[0] !== '7' && value[0] !== '8') {
            value = '7' + value;
        }
        if (value.length > 0 && !value.startsWith('+')) {
            value = '+' + value;
        }
        // Простое форматирование
        if (value.length > 1) {
            let formatted = value.substring(0, 2);
            if (value.length > 2) {
                formatted += ' (' + value.substring(2, 5);
            }
            if (value.length > 5) {
                formatted += ') ' + value.substring(5, 8);
            }
            if (value.length > 8) {
                formatted += '-' + value.substring(8, 10);
            }
            if (value.length > 10) {
                formatted += '-' + value.substring(10, 12);
            }
            e.target.value = formatted;
        }
    });
}

// Загружаем профиль при открытии экрана профиля
const profileScreen = document.getElementById('profileScreen');
if (profileScreen) {
    const observer = new MutationObserver((mutations) => {
        if (profileScreen.classList.contains('active')) {
            loadProfile();
        }
    });
    observer.observe(profileScreen, { attributes: true, attributeFilter: ['class'] });
}

// Функция раскрытия/сворачивания услуги с максимально плавной анимацией
function toggleService(header) {
    const card = header.closest('.service-card-expandable');
    if (!card) return;
    
    const isExpanded = card.classList.contains('expanded');
    
    // Плавный эффект пульсации при клике
    card.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    card.style.transform = 'scale(0.97)';
    
    setTimeout(() => {
        card.style.transition = '';
        card.style.transform = '';
    }, 300);
    
    if (isExpanded) {
        // Плавное закрытие
        card.style.transition = 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        card.classList.remove('expanded');
    } else {
        // Закрываем другие открытые карточки с плавной анимацией
        document.querySelectorAll('.service-card-expandable.expanded').forEach(otherCard => {
            if (otherCard !== card) {
                otherCard.style.transition = 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                otherCard.classList.remove('expanded');
                setTimeout(() => {
                    otherCard.style.transition = '';
                }, 700);
            }
        });
        
        // Плавное открытие
        setTimeout(() => {
            card.style.transition = 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            card.classList.add('expanded');
            setTimeout(() => {
                card.style.transition = '';
            }, 900);
        }, 100);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Показываем главный экран
    showScreen('home');
    
    // Загружаем профиль если нужно
    if (document.getElementById('profileScreen').classList.contains('active')) {
        loadProfile();
    }
});
