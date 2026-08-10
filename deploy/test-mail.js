#!/usr/bin/env node
// Проверка SMTP теми же переменными, которыми пользуется приложение.
// Запуск с сервера:  node deploy/test-mail.js you@example.com
const path = require('path');
const fs = require('fs');

// Читаем packages/web/.env — тот же файл, что и next start
const envPath = path.resolve(__dirname, '../packages/web/.env');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const to = process.argv[2];
if (!to) {
    console.error('Укажите адрес: node deploy/test-mail.js you@example.com');
    process.exit(1);
}

const nodemailer = require(path.resolve(__dirname, '../node_modules/nodemailer'));

// USER/PASS не обязательны: релей NetAngels принимает почту без авторизации
const required = ['SMTP_HOST', 'MAIL_FROM'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
    console.error('Не заданы переменные:', missing.join(', '));
    process.exit(1);
}

const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
    tls: { rejectUnauthorized: false },
});
console.log(user && pass ? 'Режим: с авторизацией' : 'Режим: без авторизации (релей)');

(async () => {
    console.log(`Проверяем соединение с ${process.env.SMTP_HOST}:${port}…`);
    await transport.verify();
    console.log('Авторизация прошла.');

    const info = await transport.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: 'Проверка почты — Матрица судьбы',
        text: 'Если вы это читаете, отправка с сервера настроена верно.',
    });
    console.log('Отправлено:', info.messageId);
    console.log('Ответ сервера:', info.response);
})().catch((e) => {
    console.error('\nОШИБКА:', e.message);
    if (/535|authentication/i.test(e.message)) {
        console.error('→ Скорее всего, обычный пароль вместо пароля приложения.');
    }
    if (/550|sender/i.test(e.message)) {
        console.error('→ Отправитель в MAIL_FROM должен быть на вашем домене.');
    }
    if (/ETIMEDOUT|ECONNREFUSED/i.test(e.message)) {
        console.error('→ Порт закрыт. На VDS СТАРТ используйте skvmrelay.netangels.ru:25');
    }
    process.exit(1);
});