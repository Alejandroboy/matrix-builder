# @matrix/web — чек-лист форка из @penalties-claim/web

Пакет не включён в архив: он делается форком твоего приватного репо Неустойки.

## Переносится БЕЗ изменений
- YooKassa-клиент (test/prod credentials через env)
- syncOrderWithPayment: идемпотентная сверка, общая для webhook и полинга
- Полинг статуса платежа (self-healing без вебхуков)
- HMAC-SHA256 подписанные токены скачивания
- nodemailer
- Чековая логика 54-ФЗ (ИП, автоматические фискальные чеки)

## Меняется
1. Prisma Order: убрать поля расчёта неустойки; добавить
   birthDateA (String), birthDateB (String, nullable),
   productType ('personal' | 'compatibility'), emailForLead (nullable).
2. Клиентский расчёт: @matrix/engine — чистый TS, работает в браузере,
   мгновенный расчёт без сети (паттерн Неустойки).
3. Роуты: /  (личный калькулятор), /sovmestimost (пара, SEO-цель №1),
   /arkan/[n] (программные страницы; до готовности контента n≠11,13 —
   noindex), /prognoz-2027 (заглушка до октября).
4. PDF: серверная генерация по оплаченному заказу через
   compileCompatibilityReport -> render-pdf.
5. Переходный период: перед оплатой — assertPairCoverage; для непокрытых
   арканов вместо продажи: «отчёт появится через N дней» + сбор email.

## Отдельно
- Контент /arkan/[n] рендерится из content/arcana/*.json на этапе сборки
  (resolveJsonModule). Деплой контента = git push.
- render-pdf.ts в docgen — заглушка: секции определены, рисовалку писать
  при подключении web (шрифты + октаграмма — самое муторное).
