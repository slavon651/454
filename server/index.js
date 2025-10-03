import express from 'express';
import cors from 'cors';
import ytdl from '@distube/ytdl-core';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// CORS configuration
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(express.json());

// Создаем агент для ytdl с куки (опционально, для лучшей стабильности)
const agent = ytdl.createAgent();

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

    // Получаем информацию с использованием агента для лучшей стабильности
    const info = await ytdl.getInfo(url, { agent });
    
    // Фильтруем форматы с видео и аудио
    const formats = info.formats
      .filter(format => format.hasVideo && format.hasAudio)
      .map(format => ({
        quality: format.qualityLabel || format.quality,
        format: format.container,
        size: format.contentLength ? `${(format.contentLength / 1024 / 1024).toFixed(2)} MB` : 'Неизвестно',
        itag: format.itag
      }))
      .filter((format, index, self) => 
        index === self.findIndex(f => f.quality === format.quality)
      );

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      duration: info.videoDetails.lengthSeconds,
      author: info.videoDetails.author.name,
      formats: formats.sort((a, b) => {
        const getQualityValue = (q) => {
          if (!q) return 0;
          if (q.includes('2160')) return 2160;
          if (q.includes('1440')) return 1440;
          if (q.includes('1080')) return 1080;
          if (q.includes('720')) return 720;
          if (q.includes('480')) return 480;
          if (q.includes('360')) return 360;
          return 0;
        };
        return getQualityValue(b.quality) - getQualityValue(a.quality);
      })
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

    const info = await ytdl.getInfo(url, { agent });
    const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').trim() || 'video';

    res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
    res.header('Content-Type', 'video/mp4');

    // Скачиваем с использованием агента
    ytdl(url, { 
      quality: itag,
      agent 
    }).pipe(res);
  } catch (error) {
    console.error('Ошибка при скачивании:', error);
    res.status(500).json({ error: 'Не удалось скачать видео. Попробуйте другое качество.' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
