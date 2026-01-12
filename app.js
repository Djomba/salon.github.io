// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Глобальные переменные
let currentUser = null;
let isAdmin = false;
const ADMIN_IDS = []; // Заполняется из конфига или API
const API_URL = 'https://your-backend-url.com/api'; // Замените на ваш URL

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    await initApp();
});

async function initApp() {
    // Получаем данные пользователя из Telegram
    if (tg.initDataUnsafe?.user) {
        currentUser = tg.initDataUnsafe.user;
        const fullName = [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.first_name || 'Не указано';
        document.getElementById('profile-name').textContent = fullName;
        document.getElementById('profile-phone').textContent = currentUser.phone_number || 'Не указано';
    }

    // Проверяем, является ли пользователь админом
    if (currentUser) {
        isAdmin = await checkAdminStatus(currentUser.id);
        if (isAdmin) {
            document.getElementById('admin-menu').style.display = 'block';
        }
        
        // Загружаем количество записей пользователя
        await loadUserBookings();
    }

    // Загружаем данные
    await loadServices();
    await loadReviews();
    if (isAdmin) {
        await loadAdminData();
    }

    // Устанавливаем минимальную дату для записи (сегодня)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('booking-date').setAttribute('min', today);
}

// Загрузка записей пользователя
async function loadUserBookings() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/bookings/user/${currentUser.id}`);
        if (response.ok) {
            const bookings = await response.json();
            document.getElementById('profile-bookings').textContent = bookings.length || 0;
        }
    } catch (error) {
        console.error('Ошибка загрузки записей пользователя:', error);
    }
}

// Навигация между экранами
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Проверка статуса админа
async function checkAdminStatus(userId) {
    try {
        const response = await fetch(`${API_URL}/admin/check/${userId}`);
        const data = await response.json();
        return data.isAdmin || false;
    } catch (error) {
        console.error('Ошибка проверки админа:', error);
        return false;
    }
}

// Загрузка услуг
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/services`);
        const services = await response.json();
        
        const servicesList = document.getElementById('services-list');
        const bookingService = document.getElementById('booking-service');
        
        servicesList.innerHTML = '';
        bookingService.innerHTML = '<option value="">Выберите услугу...</option>';
        
        services.forEach(service => {
            // Отображение в списке услуг
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card';
            serviceCard.innerHTML = `
                <h3>${service.name}</h3>
                <p>${service.description || ''}</p>
                <div class="service-price">${service.price} ₽</div>
            `;
            servicesList.appendChild(serviceCard);
            
            // Добавление в форму записи
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${service.name} - ${service.price} ₽`;
            bookingService.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        showNotification('Ошибка загрузки услуг');
    }
}

// Загрузка доступного времени
async function loadAvailableTimes(date) {
    try {
        const response = await fetch(`${API_URL}/schedule/${date}`);
        const data = await response.json();
        
        const timeSelect = document.getElementById('booking-time');
        timeSelect.innerHTML = '<option value="">Выберите время...</option>';
        
        if (data.availableTimes && data.availableTimes.length > 0) {
            data.availableTimes.forEach(time => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Нет доступного времени';
            option.disabled = true;
            timeSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Ошибка загрузки времени:', error);
        showNotification('Ошибка загрузки расписания');
    }
}

// Обработчик изменения даты
document.getElementById('booking-date')?.addEventListener('change', function(e) {
    if (e.target.value) {
        loadAvailableTimes(e.target.value);
    }
});

// Обработка формы записи
document.getElementById('booking-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        serviceId: document.getElementById('booking-service').value,
        date: document.getElementById('booking-date').value,
        time: document.getElementById('booking-time').value,
        name: document.getElementById('booking-name').value,
        phone: document.getElementById('booking-phone').value,
        comment: document.getElementById('booking-comment').value,
        userId: currentUser?.id || null,
        username: currentUser?.username || null
    };
    
    try {
        // Отправляем данные на backend
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Отправляем данные в бота через Telegram WebApp API
            // Данные будут автоматически отправлены в бота через backend
            // Но также отправляем через sendData для дополнительной надежности
            try {
                tg.sendData(JSON.stringify({
                    type: 'booking',
                    data: formData,
                    bookingId: result.bookingId
                }));
            } catch (error) {
                console.log('Данные уже отправлены через backend');
            }
            
            showNotification('✅ Запись успешно создана!');
            
            // Очищаем форму
            this.reset();
            
            // Обновляем количество записей
            await loadUserBookings();
            
            // Возвращаемся в главное меню через 2 секунды
            setTimeout(() => {
                showScreen('main-menu');
            }, 2000);
        } else {
            showNotification('❌ Ошибка: ' + (result.message || 'Не удалось создать запись'));
        }
    } catch (error) {
        console.error('Ошибка создания записи:', error);
        showNotification('❌ Ошибка соединения с сервером');
    }
});

// Загрузка отзывов
async function loadReviews() {
    try {
        const response = await fetch(`${API_URL}/reviews`);
        const reviews = await response.json();
        
        const reviewsList = document.getElementById('reviews-list');
        reviewsList.innerHTML = '';
        
        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${review.author || 'Аноним'}</span>
                    <span class="review-rating">${'⭐'.repeat(review.rating || 5)}</span>
                </div>
                <div class="review-text">${review.text}</div>
            `;
            reviewsList.appendChild(reviewCard);
        });
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
    }
}

// Показать форму добавления отзыва
function showAddReview() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <h3>Написать отзыв</h3>
        <form id="review-form">
            <div class="form-group">
                <label>Ваше имя</label>
                <input type="text" id="review-author" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Оценка</label>
                <select id="review-rating" class="form-input" required>
                    <option value="5">⭐⭐⭐⭐⭐</option>
                    <option value="4">⭐⭐⭐⭐</option>
                    <option value="3">⭐⭐⭐</option>
                    <option value="2">⭐⭐</option>
                    <option value="1">⭐</option>
                </select>
            </div>
            <div class="form-group">
                <label>Отзыв</label>
                <textarea id="review-text" class="form-input" rows="4" required></textarea>
            </div>
            <button type="submit" class="submit-btn">Отправить</button>
        </form>
    `;
    
    modal.style.display = 'block';
    
    document.getElementById('review-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const reviewData = {
            author: document.getElementById('review-author').value,
            rating: parseInt(document.getElementById('review-rating').value),
            text: document.getElementById('review-text').value
        };
        
        try {
            const response = await fetch(`${API_URL}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reviewData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('✅ Отзыв добавлен!');
                closeModal();
                await loadReviews();
            }
        } catch (error) {
            console.error('Ошибка добавления отзыва:', error);
            showNotification('❌ Ошибка отправки отзыва');
        }
    });
}

// Админ-панель: переключение вкладок
function showAdminTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// Загрузка данных для админа
async function loadAdminData() {
    await loadAdminServices();
    await loadAdminSchedule();
    await loadAdminBookings();
}

// Загрузка услуг для админа
async function loadAdminServices() {
    try {
        const response = await fetch(`${API_URL}/admin/services`);
        const services = await response.json();
        
        const servicesList = document.getElementById('admin-services-list');
        servicesList.innerHTML = '';
        
        services.forEach(service => {
            const serviceItem = document.createElement('div');
            serviceItem.className = 'admin-item';
            serviceItem.innerHTML = `
                <div class="admin-item-header">
                    <div class="admin-item-title">${service.name} - ${service.price} ₽</div>
                    <div class="admin-item-actions">
                        <button class="edit-btn" onclick="editService(${service.id})">✏️</button>
                        <button class="delete-btn" onclick="deleteService(${service.id})">🗑️</button>
                    </div>
                </div>
                <p>${service.description || ''}</p>
            `;
            servicesList.appendChild(serviceItem);
        });
    } catch (error) {
        console.error('Ошибка загрузки услуг для админа:', error);
    }
}

// Показать форму добавления услуги
function showAddService() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <h3>Добавить услугу</h3>
        <form id="service-form">
            <div class="form-group">
                <label>Название</label>
                <input type="text" id="service-name" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Описание</label>
                <textarea id="service-description" class="form-input" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Цена (₽)</label>
                <input type="number" id="service-price" class="form-input" required min="0">
            </div>
            <button type="submit" class="submit-btn">Сохранить</button>
        </form>
    `;
    
    modal.style.display = 'block';
    
    document.getElementById('service-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const serviceData = {
            name: document.getElementById('service-name').value,
            description: document.getElementById('service-description').value,
            price: parseFloat(document.getElementById('service-price').value)
        };
        
        try {
            const response = await fetch(`${API_URL}/admin/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(serviceData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('✅ Услуга добавлена!');
                closeModal();
                await loadAdminServices();
                await loadServices();
            }
        } catch (error) {
            console.error('Ошибка добавления услуги:', error);
            showNotification('❌ Ошибка добавления услуги');
        }
    });
}

// Редактирование услуги
function editService(serviceId) {
    // Загружаем данные услуги и показываем форму редактирования
    fetch(`${API_URL}/admin/services/${serviceId}`)
        .then(res => res.json())
        .then(service => {
            const modal = document.getElementById('modal');
            const modalBody = document.getElementById('modal-body');
            
            modalBody.innerHTML = `
                <h3>Редактировать услугу</h3>
                <form id="service-edit-form">
                    <div class="form-group">
                        <label>Название</label>
                        <input type="text" id="service-name" class="form-input" value="${service.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea id="service-description" class="form-input" rows="3">${service.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Цена (₽)</label>
                        <input type="number" id="service-price" class="form-input" value="${service.price}" required min="0">
                    </div>
                    <button type="submit" class="submit-btn">Сохранить</button>
                </form>
            `;
            
            modal.style.display = 'block';
            
            document.getElementById('service-edit-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const serviceData = {
                    name: document.getElementById('service-name').value,
                    description: document.getElementById('service-description').value,
                    price: parseFloat(document.getElementById('service-price').value)
                };
                
                try {
                    const response = await fetch(`${API_URL}/admin/services/${serviceId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(serviceData)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showNotification('✅ Услуга обновлена!');
                        closeModal();
                        await loadAdminServices();
                        await loadServices();
                    }
                } catch (error) {
                    console.error('Ошибка обновления услуги:', error);
                    showNotification('❌ Ошибка обновления услуги');
                }
            });
        });
}

// Удаление услуги
async function deleteService(serviceId) {
    if (!confirm('Вы уверены, что хотите удалить эту услугу?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/services/${serviceId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Услуга удалена!');
            await loadAdminServices();
            await loadServices();
        }
    } catch (error) {
        console.error('Ошибка удаления услуги:', error);
        showNotification('❌ Ошибка удаления услуги');
    }
}

// Сохранение расписания
async function saveSchedule() {
    const date = document.getElementById('schedule-date').value;
    const timesStr = document.getElementById('schedule-times').value;
    
    if (!date || !timesStr) {
        showNotification('❌ Заполните все поля');
        return;
    }
    
    const times = timesStr.split(',').map(t => t.trim()).filter(t => t);
    
    try {
        const response = await fetch(`${API_URL}/admin/schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date, times })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Расписание сохранено!');
            document.getElementById('schedule-date').value = '';
            document.getElementById('schedule-times').value = '';
            await loadAdminSchedule();
        }
    } catch (error) {
        console.error('Ошибка сохранения расписания:', error);
        showNotification('❌ Ошибка сохранения расписания');
    }
}

// Загрузка расписания для админа
async function loadAdminSchedule() {
    try {
        const response = await fetch(`${API_URL}/admin/schedule`);
        const schedule = await response.json();
        
        const scheduleList = document.getElementById('schedule-list');
        scheduleList.innerHTML = '';
        
        if (schedule.length === 0) {
            scheduleList.innerHTML = '<p style="text-align: center; color: #999;">Расписание пусто</p>';
            return;
        }
        
        schedule.forEach(item => {
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'admin-item';
            scheduleItem.innerHTML = `
                <div class="admin-item-header">
                    <div class="admin-item-title">${new Date(item.date).toLocaleDateString('ru-RU')}</div>
                    <button class="delete-btn" onclick="deleteSchedule('${item.date}')">🗑️</button>
                </div>
                <p>Время: ${item.times.join(', ')}</p>
            `;
            scheduleList.appendChild(scheduleItem);
        });
    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
    }
}

// Удаление расписания
async function deleteSchedule(date) {
    if (!confirm('Удалить это расписание?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/schedule/${date}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Расписание удалено!');
            await loadAdminSchedule();
        }
    } catch (error) {
        console.error('Ошибка удаления расписания:', error);
        showNotification('❌ Ошибка удаления расписания');
    }
}

// Загрузка записей для админа
async function loadAdminBookings() {
    try {
        const response = await fetch(`${API_URL}/admin/bookings`);
        const bookings = await response.json();
        
        const bookingsList = document.getElementById('admin-bookings-list');
        bookingsList.innerHTML = '';
        
        if (bookings.length === 0) {
            bookingsList.innerHTML = '<p style="text-align: center; color: #999;">Записей нет</p>';
            return;
        }
        
        bookings.forEach(booking => {
            const bookingItem = document.createElement('div');
            bookingItem.className = 'booking-item';
            bookingItem.innerHTML = `
                <div class="booking-item-header">
                    <span class="booking-item-name">${booking.name}</span>
                    <span class="booking-item-time">${booking.date} ${booking.time}</span>
                </div>
                <div class="booking-item-details">
                    <p><strong>Услуга:</strong> ${booking.serviceName || 'Не указано'}</p>
                    <p><strong>Телефон:</strong> ${booking.phone}</p>
                    ${booking.comment ? `<p><strong>Комментарий:</strong> ${booking.comment}</p>` : ''}
                </div>
            `;
            bookingsList.appendChild(bookingItem);
        });
    } catch (error) {
        console.error('Ошибка загрузки записей:', error);
    }
}

// Экспорт в Excel
async function exportToExcel() {
    try {
        const response = await fetch(`${API_URL}/admin/export/excel`);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('✅ Excel файл скачан!');
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        showNotification('❌ Ошибка экспорта в Excel');
    }
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}
