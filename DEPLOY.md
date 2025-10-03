# 🚀 Руководство по деплою YouTube Downloader

## Вариант 1: Vercel (Frontend) + Railway (Backend)

### Frontend на Vercel

1. **Создайте аккаунт** на [vercel.com](https://vercel.com)

2. **Подключите репозиторий**
   - Импортируйте ваш Git репозиторий
   - Vercel автоматически определит Vite проект

3. **Настройте переменные окружения**
   - Добавьте в Vercel:
     ```
     VITE_API_URL=https://your-backend.railway.app
     ```

4. **Деплой**
   - Нажмите "Deploy"
   - Vercel автоматически соберет проект

### Backend на Railway

1. **Создайте аккаунт** на [railway.app](https://railway.app)

2. **Создайте новый проект**
   - New Project → Deploy from GitHub repo
   - Выберите ваш репозиторий

3. **Настройте**
   - Root Directory: `/server`
   - Start Command: `node index.js`
   - Добавьте переменные:
     ```
     PORT=5000
     CLIENT_URL=https://your-frontend.vercel.app
     ```

4. **Деплой**
   - Railway автоматически развернет сервер
   - Скопируйте URL сервера

5. **Обновите Frontend**
   - Вернитесь в Vercel
   - Обновите `VITE_API_URL` на URL Railway

## Вариант 2: Netlify (Frontend) + Heroku (Backend)

### Frontend на Netlify

1. **Создайте аккаунт** на [netlify.com](https://netlify.com)

2. **Deploy**
   - New site from Git
   - Выберите репозиторий
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Переменные окружения**
   ```
   VITE_API_URL=https://your-app.herokuapp.com
   ```

### Backend на Heroku

1. **Установите Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Залогиньтесь**
   ```bash
   heroku login
   ```

3. **Создайте приложение**
   ```bash
   heroku create your-app-name
   ```

4. **Создайте Procfile** в корне проекта:
   ```
   web: node server/index.js
   ```

5. **Деплой**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

6. **Настройте переменные**
   ```bash
   heroku config:set CLIENT_URL=https://your-frontend.netlify.app
   ```

## Вариант 3: VPS (Полный контроль)

### Подготовка

1. **Арендуйте VPS**
   - DigitalOcean
   - Hetzner
   - VScale (для России)

2. **Подключитесь по SSH**
   ```bash
   ssh root@your-server-ip
   ```

### Настройка сервера

1. **Установите Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Установите Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

3. **Клонируйте репозиторий**
   ```bash
   git clone your-repo-url /var/www/youtube-downloader
   cd /var/www/youtube-downloader
   npm install
   ```

4. **Соберите Frontend**
   ```bash
   npm run build
   ```

5. **Настройте PM2 для Backend**
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "youtube-api"
   pm2 startup
   pm2 save
   ```

6. **Настройте Nginx**
   
   Создайте файл `/etc/nginx/sites-available/youtube-downloader`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           root /var/www/youtube-downloader/dist;
           try_files $uri $uri/ /index.html;
       }

       # API
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Активируйте конфиг**
   ```bash
   sudo ln -s /etc/nginx/sites-available/youtube-downloader /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Настройте SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## Вариант 4: Docker

### Создайте Dockerfile

```dockerfile
# Frontend build
FROM node:18 AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Backend
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server ./server
COPY --from=frontend /app/dist ./dist

EXPOSE 5000
CMD ["node", "server/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - NODE_ENV=production
    restart: unless-stopped
```

### Запуск
```bash
docker-compose up -d
```

## Важные настройки для Production

### 1. Обновите API URLs

В `src/App.jsx` замените:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Используйте везде:
fetch(`${API_URL}/api/video-info`, {...})
```

### 2. Обновите CORS в server/index.js

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 3. Добавьте Rate Limiting

```bash
npm install express-rate-limit
```

В `server/index.js`:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // лимит запросов
});

app.use('/api/', limiter);
```

### 4. Обновите SEO теги

В `index.html` замените:
- `yourdomain.com` → ваш реальный домен
- Добавьте реальные коды верификации Google и Яндекс

### 5. Создайте реальные изображения

- `og-image.jpg` (1200x630px) - для Open Graph
- `twitter-image.jpg` (1200x600px) - для Twitter Cards
- Разместите их в папке `public/`

## Мониторинг и аналитика

### Google Analytics

Добавьте в `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Яндекс Метрика

```html
<!-- Yandex.Metrika -->
<script type="text/javascript">
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();
   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(XXXXXX, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true
   });
</script>
```

## Оптимизация производительности

1. **Включите Gzip** в Nginx
2. **Настройте кэширование** статических файлов
3. **Используйте CDN** для статики
4. **Минифицируйте** HTML/CSS/JS (Vite делает автоматически)

## Безопасность

1. **Настройте HTTPS** (обязательно!)
2. **Добавьте rate limiting**
3. **Валидируйте** все входные данные
4. **Обновляйте** зависимости регулярно
5. **Используйте** переменные окружения для секретов

## Проверка после деплоя

✅ Сайт открывается по HTTPS
✅ API запросы работают
✅ Скачивание видео функционирует
✅ Адаптивность на мобильных
✅ SEO теги на месте
✅ Robots.txt доступен
✅ Sitemap.xml работает
✅ Иконки отображаются

## Backup и обновления

```bash
# Бэкап (для VPS)
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/youtube-downloader

# Обновление
git pull
npm install
npm run build
pm2 restart youtube-api
```

---

**Удачного деплоя! 🚀**
