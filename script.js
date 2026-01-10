// ============================================
// НАЧАЛО СКРИПТА - ЛОГИРОВАНИЕ ЗАГРУЗКИ
// ============================================
console.log('🚀 script.js загружен и выполняется...');
console.log('🚀 Время загрузки:', new Date().toISOString());

// Глобальный обработчик ошибок
window.addEventListener('error', (event) => {
    console.error('❌ ГЛОБАЛЬНАЯ ОШИБКА JavaScript:');
    console.error('❌ Сообщение:', event.message);
    console.error('❌ Файл:', event.filename);
    console.error('❌ Строка:', event.lineno);
    console.error('❌ Колонка:', event.colno);
    console.error('❌ Ошибка:', event.error);
});

// Обработчик необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ НЕОБРАБОТАННАЯ ОШИБКА Promise:');
    console.error('❌ Причина:', event.reason);
    console.error('❌ Промис:', event.promise);
});

// Версия приложения для обновления кэша
const APP_VERSION = '2.8';
console.log('📦 Версия приложения:', APP_VERSION);

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
console.log('🔧 Инициализация Telegram Web App...');
console.log('🔧 window.Telegram существует:', typeof window.Telegram !== 'undefined');
console.log('🔧 window.Telegram.WebApp существует:', typeof window.Telegram?.WebApp !== 'undefined');

const tg = window.Telegram.WebApp;
if (!tg) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: window.Telegram.WebApp не найден!');
    console.error('❌ Убедитесь, что скрипт telegram-web-app.js загружен перед script.js');
    alert('Ошибка: Telegram Web App не загружен. Перезагрузите страницу.');
} else {
    console.log('✅ Telegram Web App найден');
}

tg.ready();
tg.expand();
console.log('✅ tg.ready() и tg.expand() вызваны');

// Проверяем, что Mini App открыт через бота
const isOpenedViaBot = tg.initDataUnsafe && tg.initDataUnsafe.user;
if (!isOpenedViaBot) {
    console.warn('⚠️ ВНИМАНИЕ: Mini App не открыт через бота!');
    console.warn('⚠️ Для работы записи откройте Mini App через кнопку в боте');
}

// Логируем информацию о Mini App для отладки
console.log('🔍 DEBUG: Telegram Web App инициализирован');
console.log('🔍 DEBUG: tg.version =', tg.version);
console.log('🔍 DEBUG: tg.platform =', tg.platform);
console.log('🔍 DEBUG: isOpenedViaBot =', isOpenedViaBot);
console.log('🔍 DEBUG: typeof tg.sendData =', typeof tg.sendData);
console.log('🔍 DEBUG: tg.initDataUnsafe =', tg.initDataUnsafe);

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

// Функция инициализации формы (будет вызвана после загрузки DOM)
function initForm() {
    console.log('📋 Инициализация формы записи...');
    
    // Инициализация поля даты
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        console.log('✅ Поле даты инициализировано, минимальная дата:', today);
    } else {
        console.warn('⚠️ Поле даты не найдено');
    }

    // Обработка отправки формы
    console.log('📋 Инициализация обработчика формы...');
    const form = document.getElementById('appointmentForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');

    console.log('📋 Форма найдена:', form !== null);
    console.log('📋 Кнопка отправки найдена:', submitBtn !== null);
    console.log('📋 Сообщение об успехе найдено:', successMessage !== null);

    if (form) {
        console.log('✅ Обработчик формы подключен');
        form.addEventListener('submit', async (e) => {
            console.log('📤 ============================================');
            console.log('📤 ФОРМА ОТПРАВЛЕНА!');
            console.log('📤 ============================================');
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
            // Проверяем наличие userId и что Mini App открыт через бота
            if (!userId) {
                tg.showAlert('❌ Ошибка: Mini App должен быть открыт через кнопку в боте!\n\nПожалуйста, закройте это окно и откройте Mini App через команду /start в боте.');
                throw new Error('Не удалось определить ID пользователя. Откройте Mini App через бота.');
            }
            
            // Проверяем, что tg.sendData доступен
            if (typeof tg.sendData !== 'function') {
                tg.showAlert('❌ Ошибка: функция отправки данных недоступна.\n\nПожалуйста, откройте Mini App через кнопку в боте.');
                throw new Error('tg.sendData недоступна');
            }
            
            // Форматируем дату для красивого отображения
            let formattedDate = formData.date;
            try {
                const dateObj = new Date(formData.date + 'T00:00:00');
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
                const weekday = weekdays[dateObj.getDay()];
                formattedDate = `${day}.${month}.${year} (${weekday})`;
            } catch (e) {
                console.warn('Ошибка форматирования даты:', e);
            }
            
            // Подготавливаем данные для отправки
            const requestData = {
                ...formData,
                user_id: userId,
                username: userUsername || '',
                formatted_date: formattedDate
            };
            
            // Логируем данные перед отправкой
            console.log('📤 Отправка данных в бот через tg.sendData():', requestData);
            
            // Всегда используем tg.sendData() - это надежный способ отправки данных в бот
            const dataString = JSON.stringify(requestData);
            console.log('📦 Данные в формате JSON:', dataString);
            
            // Отправляем данные через Telegram Web App API
            console.log('📤 Вызов tg.sendData() с данными:', dataString.substring(0, 100) + '...');
            
            try {
                // Проверяем, что tg.sendData доступен перед вызовом
                if (typeof tg.sendData !== 'function') {
                    const errorMsg = 'tg.sendData не является функцией. Mini App должен быть открыт через бота!';
                    console.error('❌', errorMsg);
                    tg.showAlert('❌ Ошибка: ' + errorMsg);
                    throw new Error(errorMsg);
                }
                
                console.log('📤 Вызываю tg.sendData()...');
                console.log('📤 Длина данных:', dataString.length, 'символов');
                
                // Вызываем sendData
                tg.sendData(dataString);
                
                console.log('✅ tg.sendData() вызван успешно');
                console.log('💡 Данные будут отправлены в бот. Проверьте сообщение в боте.');
                
                // Важно: данные отправляются в бот, но сообщение создается только когда
                // Mini App закрывается или когда Telegram обрабатывает данные
                // Не закрываем Mini App автоматически - пользователь увидит сообщение в боте
                
            } catch (error) {
                console.error('❌ Ошибка при вызове tg.sendData():', error);
                console.error('❌ Детали ошибки:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    tgAvailable: typeof tg !== 'undefined',
                    sendDataAvailable: typeof tg.sendData !== 'undefined'
                });
                tg.showAlert('❌ Ошибка отправки данных: ' + error.message);
                throw error;
            }
            
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
            console.error('❌ Ошибка отправки данных:', error);
            console.error('❌ Детали ошибки:', {
                message: error.message,
                stack: error.stack,
                userId: userId,
                formData: formData
            });
            const errorMessage = error.message || 'Попробуйте позже';
            tg.showAlert(`❌ Произошла ошибка: ${errorMessage}`);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>📅 Записаться</span>';
                submitBtn.style.opacity = '1';
                submitBtn.style.transform = 'scale(1)';
            }
        }
    });
    } else {
        console.error('❌ Форма не найдена! Проверьте HTML.');
    }
    
    // Форматирование телефона
    console.log('📞 Инициализация форматирования телефона...');
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        console.log('✅ Поле телефона найдено, подключаю обработчик...');
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
    } else {
        console.warn('⚠️ Поле телефона не найдено');
    }
}

// Вызываем инициализацию формы сразу, если DOM уже загружен
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('📋 DOM уже готов, вызываю initForm()...');
    setTimeout(() => initForm(), 100);
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
console.log('⏳ Ожидание загрузки DOM...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM загружен! Начинаю инициализацию...');
    
    // Показываем главный экран
    console.log('🏠 Показываю главный экран...');
    showScreen('home');
    console.log('✅ Главный экран показан');
    
    // Загружаем профиль если нужно
    const profileScreen = document.getElementById('profileScreen');
    if (profileScreen && profileScreen.classList.contains('active')) {
        console.log('👤 Загружаю профиль...');
        loadProfile();
    }
    
    // Инициализируем форму
    console.log('📋 Инициализирую форму...');
    initForm();
    
    console.log('✅ Инициализация завершена');
});

// Также проверяем, если DOM уже загружен
if (document.readyState === 'loading') {
    console.log('⏳ DOM еще загружается...');
} else {
    console.log('✅ DOM уже загружен, запускаю инициализацию немедленно...');
    // Если DOM уже загружен, запускаем инициализацию сразу
    setTimeout(() => {
        console.log('🏠 Показываю главный экран (DOM уже загружен)...');
        showScreen('home');
    }, 100);
}
