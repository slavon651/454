import React, { useState } from 'react';
import './App.css';

// API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVideoInfo(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/video-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Произошла ошибка');
      }

      setVideoInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (itag) => {
    setDownloading(true);
    try {
      const downloadUrl = `${API_URL}/api/download?url=${encodeURIComponent(url)}&itag=${itag}`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      setError('Ошибка при скачивании');
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <div className="animated-bg"></div>
      
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="url(#gradient1)"/>
              <path d="M10 8L16 12L10 16V8Z" fill="white"/>
              <defs>
                <linearGradient id="gradient1" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#667eea"/>
                  <stop offset="1" stopColor="#764ba2"/>
                </linearGradient>
              </defs>
            </svg>
            <h1>YouTube <span className="gradient-text">Downloader</span></h1>
          </div>
          <p className="subtitle">Скачивайте видео с YouTube в любом качестве</p>
        </header>

        {/* Main Form */}
        <div className="main-card">
          <form onSubmit={handleSubmit} className="search-form">
            <div className="input-wrapper">
              <svg className="input-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L15.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Вставьте ссылку на YouTube видео..."
                className="url-input"
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Загрузка...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Получить видео
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Video Info */}
        {videoInfo && (
          <div className="video-info-card">
            <div className="video-preview">
              <img src={videoInfo.thumbnail} alt={videoInfo.title} className="thumbnail" />
              <div className="duration-badge">{formatDuration(videoInfo.duration)}</div>
            </div>
            
            <div className="video-details">
              <h2 className="video-title">{videoInfo.title}</h2>
              <p className="video-author">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {videoInfo.author}
              </p>
              
              <div className="formats-section">
                <h3 className="formats-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 16L4 18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16M16 12L12 16M12 16L8 12M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Выберите качество для скачивания:
                </h3>
                
                <div className="formats-grid">
                  {videoInfo.formats.map((format, index) => (
                    <button
                      key={index}
                      onClick={() => handleDownload(format.itag)}
                      className="format-btn"
                      disabled={downloading}
                    >
                      <div className="format-quality">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {format.quality}
                      </div>
                      <div className="format-info">
                        <span className="format-size">{format.size}</span>
                        <span className="format-type">{format.format}</span>
                      </div>
                      <svg className="download-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M4 16L4 18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16M16 12L12 16M12 16L8 12M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Быстрая загрузка</h3>
            <p>Скачивайте видео на максимальной скорости</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>4K качество</h3>
            <p>Поддержка HD, Full HD и 4K разрешений</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Бесплатно навсегда</h3>
            <p>Без регистрации и ограничений</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>© 2025 YouTube Downloader. Все права защищены.</p>
          <p className="footer-note">Сервис предназначен для скачивания видео, на которые у вас есть права.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
