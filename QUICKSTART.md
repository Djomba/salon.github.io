# ⚡ Быстрый старт

## Минимальная настройка за 5 минут

### 1. Создайте бота
- Откройте [@BotFather](https://t.me/BotFather)
- `/newbot` → создайте бота
- Сохраните токен

### 2. Узнайте ваш ID
- Откройте [@userinfobot](https://t.me/userinfobot)
- `/start` → сохраните ваш ID

### 3. Настройте Backend
```bash
cd backend
npm install
```

Создайте `.env`:
```env
BOT_TOKEN=ваш_токен
ADMIN_IDS=ваш_id
PORT=3000
```

### 4. Запустите локально
```bash
npm run both
```

### 5. Настройте Mini App
В `app.js` замените:
```javascript
const API_URL = 'http://localhost:3000/api';
```

### 6. Откройте в браузере
Откройте `index.html` в браузере для тестирования

---

## Для продакшена

1. Задеплойте backend на Railway/Render
2. Загрузите Mini App на GitHub Pages
3. Настройте Web App в @BotFather

Подробные инструкции в `SETUP.md`
