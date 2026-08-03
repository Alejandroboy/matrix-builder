import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Пакеты монорепы отдают исходный TypeScript — Next компилирует их сам.
  // Это убирает шаг сборки пакетов и делает правку движка мгновенно видимой в dev.
  transpilePackages: ['@penalties-claim/engine', '@penalties-claim/docgen'],
};

export default nextConfig;
