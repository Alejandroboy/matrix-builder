import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // pdfkit держим вне бандла: он читает свои файлы с диска (метрики шрифтов
  // в data/, кодировки), а бандлер их не копирует — иначе ENOENT на
  // Helvetica.afm при первом же создании документа.
  serverExternalPackages: ['pdfkit'],

  // Пакеты монорепы подключаются собранными (main: dist/index.js),
  // поэтому transpilePackages не нужен: сборка идёт через `yarn build:libs`.
};

export default nextConfig;