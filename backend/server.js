const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;

// Конфигурация
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
const DATA_DIR = path.join(__dirname, 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Middleware
app.use(cors());
app.use(express.json());

// Инициализация данных
async function initData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        const files = [
            { path: SERVICES_FILE, default: [] },
            { path: BOOKINGS_FILE, default: [] },
            { path: SCHEDULE_FILE, default: [] },
            { path: REVIEWS_FILE, default: [] }
        ];
        
        for (const file of files) {
            try {
                await fs.access(file.path);
            } catch {
                await fs.writeFile(file.path, JSON.stringify(file.default, null, 2));
            }
        }
    } catch (error) {
        console.error('Ошибка инициализации данных:', error);
    }
}

// Вспомогательные функции для работы с файлами
async function readJSON(file) {
    try {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeJSON(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Проверка админа
function isAdmin(userId) {
    return ADMIN_IDS.includes(String(userId));
}

// ========== API РОУТЫ ==========

// Проверка статуса админа
app.get('/api/admin/check/:userId', (req, res) => {
    const userId = req.params.userId;
    res.json({ isAdmin: isAdmin(userId) });
});

// Получить все услуги
app.get('/api/services', async (req, res) => {
    try {
        const services = await readJSON(SERVICES_FILE);
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки услуг' });
    }
});

// Получить расписание на дату
app.get('/api/schedule/:date', async (req, res) => {
    try {
        const date = req.params.date;
        const schedule = await readJSON(SCHEDULE_FILE);
        const daySchedule = schedule.find(s => s.date === date);
        
        res.json({
            availableTimes: daySchedule ? daySchedule.times : []
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки расписания' });
    }
});

// Создать запись
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        const bookings = await readJSON(BOOKINGS_FILE);
        bookings.push(booking);
        await writeJSON(BOOKINGS_FILE, bookings);
        
        // Отправляем уведомление в Telegram бота
        // Используем setTimeout для избежания проблем с require
        setTimeout(async () => {
            try {
                const { notifyAdmins } = require('./notify');
                const services = await readJSON(SERVICES_FILE);
                const service = services.find(s => s.id === booking.serviceId);
                const serviceName = service ? service.name : booking.serviceId;
                
                const adminMessage = `
📅 Новая запись!

👤 Имя: ${booking.name}
📞 Телефон: ${booking.phone}
💅 Услуга: ${serviceName}
📆 Дата: ${booking.date}
⏰ Время: ${booking.time}
${booking.comment ? `💬 Комментарий: ${booking.comment}` : ''}

ID записи: ${booking.id}
ID пользователя: ${booking.userId || 'Не указан'}
Username: @${booking.username || 'Не указан'}
`;
                
                await notifyAdmins(adminMessage, booking.id);
            } catch (error) {
                console.error('Ошибка отправки уведомления:', error);
            }
        }, 100);
        
        res.json({ success: true, bookingId: booking.id });
    } catch (error) {
        console.error('Ошибка создания записи:', error);
        res.status(500).json({ success: false, message: 'Ошибка создания записи' });
    }
});

// Получить записи пользователя
app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const bookings = await readJSON(BOOKINGS_FILE);
        const userBookings = bookings.filter(b => b.userId === req.params.userId);
        res.json(userBookings);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки записей' });
    }
});

// Получить отзывы
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await readJSON(REVIEWS_FILE);
        // Сортируем по дате (новые сначала)
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки отзывов' });
    }
});

// Создать отзыв
app.post('/api/reviews', async (req, res) => {
    try {
        const review = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        const reviews = await readJSON(REVIEWS_FILE);
        reviews.push(review);
        await writeJSON(REVIEWS_FILE, reviews);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ошибка создания отзыва' });
    }
});

// ========== АДМИН API ==========

// Получить все услуги (админ)
app.get('/api/admin/services', async (req, res) => {
    try {
        const services = await readJSON(SERVICES_FILE);
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки услуг' });
    }
});

// Создать услугу (админ)
app.post('/api/admin/services', async (req, res) => {
    try {
        const service = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        const services = await readJSON(SERVICES_FILE);
        services.push(service);
        await writeJSON(SERVICES_FILE, services);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ошибка создания услуги' });
    }
});

// Получить услугу (админ)
app.get('/api/admin/services/:id', async (req, res) => {
    try {
        const services = await readJSON(SERVICES_FILE);
        const service = services.find(s => s.id === req.params.id);
        
        if (!service) {
            return res.status(404).json({ error: 'Услуга не найдена' });
        }
        
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки услуги' });
    }
});

// Обновить услугу (админ)
app.put('/api/admin/services/:id', async (req, res) => {
    try {
        const services = await readJSON(SERVICES_FILE);
        const index = services.findIndex(s => s.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Услуга не найдена' });
        }
        
        services[index] = {
            ...services[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeJSON(SERVICES_FILE, services);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ошибка обновления услуги' });
    }
});

// Удалить услугу (админ)
app.delete('/api/admin/services/:id', async (req, res) => {
    try {
        const services = await readJSON(SERVICES_FILE);
        const filtered = services.filter(s => s.id !== req.params.id);
        
        await writeJSON(SERVICES_FILE, filtered);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ошибка удаления услуги' });
    }
});

// Сохранить расписание (админ)
app.post('/api/admin/schedule', async (req, res) => {
    try {
        const { date, times } = req.body;
        
        const schedule = await readJSON(SCHEDULE_FILE);
        const index = schedule.findIndex(s => s.date === date);
        
        if (index !== -1) {
            schedule[index].times = times;
        } else {
            schedule.push({ date, times });
        }
        
        await writeJSON(SCHEDULE_FILE, schedule);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ошибка сохранения расписания' });
    }
});

// Получить расписание (админ)
app.get('/api/admin/schedule', async (req, res) => {
    try {
        const schedule = await readJSON(SCHEDULE_FILE);
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки расписания' });
    }
});

// Удалить расписание (админ)
app.delete('/api/admin/schedule/:date', async (req, res) => {
    try {
        const schedule = await readJSON(SCHEDULE_FILE);
        const filtered = schedule.filter(s => s.date !== req.params.date);
        
        await writeJSON(SCHEDULE_FILE, filtered);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ошибка удаления расписания' });
    }
});

// Получить все записи (админ)
app.get('/api/admin/bookings', async (req, res) => {
    try {
        const bookings = await readJSON(BOOKINGS_FILE);
        const services = await readJSON(SERVICES_FILE);
        
        // Добавляем название услуги к записям
        const bookingsWithService = bookings.map(booking => {
            const service = services.find(s => s.id === booking.serviceId);
            return {
                ...booking,
                serviceName: service ? service.name : 'Не указано'
            };
        });
        
        // Сортируем по дате (новые сначала)
        bookingsWithService.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(bookingsWithService);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки записей' });
    }
});

// Экспорт в Excel (админ)
app.get('/api/admin/export/excel', async (req, res) => {
    try {
        const bookings = await readJSON(BOOKINGS_FILE);
        const services = await readJSON(SERVICES_FILE);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Записи');
        
        // Заголовки
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 15 },
            { header: 'Дата записи', key: 'date', width: 15 },
            { header: 'Время', key: 'time', width: 10 },
            { header: 'Имя', key: 'name', width: 20 },
            { header: 'Телефон', key: 'phone', width: 15 },
            { header: 'Услуга', key: 'service', width: 30 },
            { header: 'Комментарий', key: 'comment', width: 40 },
            { header: 'Дата создания', key: 'createdAt', width: 20 }
        ];
        
        // Данные
        bookings.forEach(booking => {
            const service = services.find(s => s.id === booking.serviceId);
            worksheet.addRow({
                id: booking.id,
                date: booking.date,
                time: booking.time,
                name: booking.name,
                phone: booking.phone,
                service: service ? service.name : 'Не указано',
                comment: booking.comment || '',
                createdAt: new Date(booking.createdAt).toLocaleString('ru-RU')
            });
        });
        
        // Стилизация заголовков
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFB3D1' }
        };
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=bookings.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Ошибка экспорта в Excel:', error);
        res.status(500).json({ error: 'Ошибка экспорта в Excel' });
    }
});

// Запуск сервера
initData().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
        console.log(`📝 Админы: ${ADMIN_IDS.join(', ') || 'Не настроены'}`);
    });
});

module.exports = app;
