import express from 'express';
import cors from 'cors';
import ytdl from 'ytdl-core';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// CORS configuration
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(express.json());

// Отключаем предупреждения ytdl-core
process.env.YTDL_NO_UPDATE = 'true';

// Опции по умолчанию для ytdl с обходом ошибок
const defaultYtdlOptions = {
  requestOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API сервер работает' });
});

// Получение информации о видео
app.post('/api/video-info', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL не указан' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Неверный YouTube URL' });
    }

    // Получаем информацию с использованием заголовков для обхода ограничений
    const info = await ytdl.getInfo(url, {
      ...defaultYtdlOptions,
      lang: 'ru'
    });
    
    // Получаем все форматы с видео (YouTube теперь разделяет видео и аудио для высокого качества)
    const videoFormats = info.formats
      .filter(format => format.hasVideo && format.qualityLabel) // Только форматы с качеством
      .map(format => ({
        quality: format.qualityLabel,
        format: format.container || 'mp4',
        size: format.contentLength ? `${(format.contentLength / 1024 / 1024).toFixed(2)} MB` : '~',
        itag: format.itag,
        hasAudio: format.hasAudio,
        fps: format.fps || 30
      }));
    
    // Группируем по качеству и берём лучший вариант для каждого
    const uniqueFormats = [];
    const seenQualities = new Set();
    
    // Сортируем по качеству (от большего к меньшему)
    videoFormats.sort((a, b) => {
      const getQualityValue = (q) => {
        if (!q) return 0;
        const match = q.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return getQualityValue(b.quality) - getQualityValue(a.quality);
    });
    
    // Берём уникальные качества
    for (const format of videoFormats) {
      if (!seenQualities.has(format.quality)) {
        seenQualities.add(format.quality);
        uniqueFormats.push(format);
      }
    }

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      duration: info.videoDetails.lengthSeconds,
      author: info.videoDetails.author.name,
      formats: uniqueFormats
    });
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ 
      error: 'Не удалось получить информацию о видео. Попробуйте другое видео или повторите позже.' 
    });
  }
});

// Скачивание видео
app.get('/api/download', async (req, res) => {
  try {
    const { url, itag } = req.query;

    if (!url || !itag) {
      return res.status(400).json({ error: 'URL и itag обязательны' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Неверный YouTube URL' });
    }

    const info = await ytdl.getInfo(url, {
      ...defaultYtdlOptions,
      lang: 'ru'
    });
    
    const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').trim() || 'video';

    res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
    res.header('Content-Type', 'video/mp4');

    // Проверяем, есть ли аудио в выбранном формате
    const selectedFormat = info.formats.find(f => f.itag == itag);
    
    // Скачиваем с использованием правильных опций
    const downloadOptions = {
      ...defaultYtdlOptions,
      quality: itag,
      highWaterMark: 1 << 25, // Буфер 32MB для быстрой загрузки
    };
    
    // Если формат без аудио (высокое качество), используем другой подход
    if (selectedFormat && !selectedFormat.hasAudio) {
      console.log(`Скачивание видео без аудио: ${selectedFormat.qualityLabel}`);
    }

    const stream = ytdl(url, downloadOptions);
    
    // Обработка ошибок стрима
    stream.on('error', (error) => {
      console.error('Ошибка стрима:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка при скачивании' });
      }
    });
    
    // Обработка завершения
    stream.on('end', () => {
      console.log('Скачивание завершено успешно');
    });
    
    stream.pipe(res);
  } catch (error) {
    console.error('Ошибка при скачивании:', error);
    res.status(500).json({ error: 'Не удалось скачать видео. Попробуйте другое качество.' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
