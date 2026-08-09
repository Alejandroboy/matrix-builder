#!/usr/bin/env bash
# Выкладка новой версии. Запускать на сервере из корня репозитория:
#   ./deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Забираем изменения"
git pull --ff-only

echo "==> Зависимости"
yarn install --frozen-lockfile

echo "==> Собираем пакеты и приложение"
yarn build:libs
yarn workspace @matrix/web build

echo "==> Миграции базы"
cd packages/web
npx prisma migrate deploy
npx prisma generate
cd ../..

echo "==> Перезапуск"
sudo systemctl restart matrix-web
sleep 3
sudo systemctl --no-pager status matrix-web | head -5

echo "==> Проверка"
curl -fsS -o /dev/null -w "главная: %{http_code}\n" http://127.0.0.1:3000/
curl -fsS -o /dev/null -w "аркан 11: %{http_code}\n" http://127.0.0.1:3000/arkan/11
echo "Готово."
