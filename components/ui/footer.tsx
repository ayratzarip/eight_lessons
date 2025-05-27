'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="mb-2">&copy; {new Date().getFullYear()} EightFaces: Soft Skills Engine</p>
        <div className="flex justify-center gap-4 text-sm">
          <Link href="/sitemap" className="text-gray-400 hover:text-white">
            Карта сайта
          </Link>
          <Link href="/author" className="text-gray-400 hover:text-white">
            Об авторе
          </Link>
          <Link href="/terms" className="text-gray-400 hover:text-white">
            Пользовательское соглашение
          </Link>
          <Link href="/privacy" className="text-gray-400 hover:text-white">
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </footer>
  );
}