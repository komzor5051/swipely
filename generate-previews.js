#!/usr/bin/env node
/**
 * Скрипт для генерации всех превью стилей
 * Запуск: node generate-previews.js
 */

const { generateAllPreviews } = require('./src/services/previewService');

async function main() {
  console.log('🎨 Генерация превью стилей...\n');

  try {
    const previews = await generateAllPreviews();
    console.log(`\n✅ Готово! Сгенерировано ${previews.length} превью.`);
    console.log('📁 Файлы находятся в папке ./previews/');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

main();
