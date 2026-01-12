// Файл для запуска бота и сервера одновременно
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск бота и сервера...\n');

// Запускаем бота
const bot = spawn('node', [path.join(__dirname, 'bot.js')], {
    stdio: 'inherit',
    shell: true
});

// Запускаем сервер
const server = spawn('node', [path.join(__dirname, 'server.js')], {
    stdio: 'inherit',
    shell: true
});

// Обработка завершения процессов
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка процессов...');
    bot.kill();
    server.kill();
    process.exit();
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Остановка процессов...');
    bot.kill();
    server.kill();
    process.exit();
});

bot.on('close', (code) => {
    console.log(`\n🤖 Бот завершил работу с кодом ${code}`);
});

server.on('close', (code) => {
    console.log(`\n🌐 Сервер завершил работу с кодом ${code}`);
});
