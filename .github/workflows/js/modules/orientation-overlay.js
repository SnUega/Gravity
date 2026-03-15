/**
 * Orientation Overlay Module
 * Handles network canvas animation for orientation overlays
 */

export function initOrientationOverlay() {
  // console.log('🎯 Initializing orientation overlay...'); // DEBUG: отключено
  
  // Initialize network canvas for tablet overlay
  const tabletCanvas = document.getElementById('network-canvas-tablet');
  if (tabletCanvas) {
    // console.log('✅ Tablet canvas found, initializing...'); // DEBUG: отключено
    // Инициализируем анимацию сразу, даже если overlay скрыт
    // Canvas будет работать в фоне и отобразится когда overlay станет видимым
    initNetworkCanvas(tabletCanvas);
  } else {
    // console.warn('⚠️ Tablet canvas not found'); // DEBUG: отключено
  }

  // Initialize network canvas for phone overlay
  const phoneCanvas = document.getElementById('network-canvas-phone');
  if (phoneCanvas) {
    // console.log('✅ Phone canvas found, initializing...'); // DEBUG: отключено
    // Инициализируем анимацию сразу, даже если overlay скрыт
    // Canvas будет работать в фоне и отобразится когда overlay станет видимым
    initNetworkCanvas(phoneCanvas);
  } else {
    // console.warn('⚠️ Phone canvas not found'); // DEBUG: отключено
  }
  
  // console.log('✅ Orientation overlay initialized'); // DEBUG: отключено
}

function initNetworkCanvas(canvas) {
  if (!canvas) {
    // console.warn('⚠️ Canvas is null'); // DEBUG: отключено
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // console.warn('⚠️ Cannot get 2d context'); // DEBUG: отключено
    return;
  }
  
  // console.log('🎨 Initializing network canvas animation...'); // DEBUG: отключено
  
  let W, H;
  const particles = [];
  // Базовое количество частиц
  const baseParticleCount = 95;
  // Используем фиолетовый цвет проекта
  const accentColor = { r: 122, g: 0, b: 199 }; // #7a00c7
  
  // Функция для расчета количества частиц в зависимости от размера экрана
  // Увеличиваем плотность на больших экранах (больше iPad mini)
  function calculateParticleCount(width, height) {
    const screenArea = width * height;
    const miniArea = 768 * 1024; // iPad mini площадь (786432)
    if (screenArea > miniArea) {
      // Увеличиваем количество частиц пропорционально площади, но не слишком много
      const multiplier = Math.min((screenArea / miniArea) * 0.8, 2.5); // Максимум в 2.5 раза
      return Math.floor(baseParticleCount * multiplier);
    }
    return baseParticleCount;
  }
  
  class NetworkParticle {
    constructor() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = 2;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.8)`;
      ctx.fill();
    }
  }
  
  function resize() {
    // Устанавливаем размер canvas равным размеру окна
    // Это важно даже если overlay скрыт, чтобы анимация работала
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    
    // Пересчитываем количество частиц при изменении размера
    const currentParticleCount = calculateParticleCount(W, H);
    
    // Пересоздаем частицы при изменении размера
    particles.length = 0;
    for (let i = 0; i < currentParticleCount; i++) {
      particles.push(new NetworkParticle());
    }
    
    // console.log(`📐 Canvas resized to ${W}x${H}, particles: ${particles.length}`); // DEBUG: отключено
  }
  
  window.addEventListener('resize', resize);
  // Вызываем resize сразу для инициализации размеров и частиц
  resize();
  
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const opacity = (1 - distance / 120) * 0.4;
          ctx.strokeStyle = `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, W, H);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    drawConnections();
    
    requestAnimationFrame(animate);
  }
  
  const initialParticleCount = calculateParticleCount(W || window.innerWidth, H || window.innerHeight);
  // console.log('🚀 Starting animation with', initialParticleCount, 'particles'); // DEBUG: отключено
  animate();
}
