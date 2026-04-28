const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Инициализируем OpenAI только если ключ указан
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  const { OpenAI } = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * Транскрибация голосового сообщения через Whisper API
 */
async function transcribeVoice(voiceFileUrl) {
  console.log('🎧 Транскрибация голоса через Whisper...');

  if (!openai) {
    throw new Error('Голосовой ввод недоступен - OPENAI_API_KEY не настроен');
  }

  try {
    // Скачиваем голосовой файл
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `voice_${Date.now()}.ogg`);

    // Скачиваем файл
    const response = await axios({
      method: 'get',
      url: voiceFileUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('✅ Голосовой файл скачан');

    // Транскрибируем через Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'ru', // Русский язык
      response_format: 'text'
    });

    // Удаляем временный файл
    fs.unlinkSync(tempFilePath);

    console.log(`✅ Транскрипция: "${transcription}"`);

    return transcription;

  } catch (error) {
    console.error('❌ Ошибка транскрибации:', error.message);
    throw new Error('Не удалось распознать голос. Попробуй ещё раз.');
  }
}

module.exports = {
  transcribeVoice
};
