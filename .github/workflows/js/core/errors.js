/**
 * Централизованная обработка ошибок
 * 
 * Базовый модуль для обработки ошибок с возможностью расширения
 * для интеграции с админ-панелью
 */

import { CONFIG } from './config.js';

/**
 * Уровни серьезности ошибок
 */
export const ERROR_SEVERITY = {
  CRITICAL: 'critical',  // Критическая ошибка - сайт может не работать
  HIGH: 'high',          // Высокая - важная функциональность сломана
  MEDIUM: 'medium',      // Средняя - не критично, но влияет на UX
  LOW: 'low'             // Низкая - информационная, не влияет на работу
};

/**
 * Класс для обработки ошибок
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      // Включить логирование в консоль
      enableConsoleLog: options.enableConsoleLog !== false,
      
      // Включить отправку на сервер (для будущей админ-панели)
      enableServerLog: options.enableServerLog || false,
      serverEndpoint: options.serverEndpoint || '/api/errors',
      
      // Показывать ошибки пользователю
      showToUser: options.showToUser || false,
      
      // Уведомлять администратора (для будущей админ-панели)
      notifyAdmin: options.notifyAdmin || false,
      
      // Окружение (development/production)
      environment: options.environment || (window.location.hostname === 'localhost' ? 'development' : 'production'),
      
      ...options
    };

    // Хранилище ошибок (для будущей аналитики)
    this.errors = [];
    this.maxStoredErrors = 100;

    // Инициализация
    this.init();
  }

  /**
   * Инициализация обработчика ошибок
   */
  init() {
    // Перехватываем глобальные ошибки
    this.setupGlobalErrorHandlers();
    
    // Перехватываем необработанные промисы
    this.setupUnhandledRejectionHandler();
    
    // console.log('✅ ErrorHandler initialized'); // DEBUG: отключено
  }

  /**
   * Настройка глобальных обработчиков ошибок
   */
  setupGlobalErrorHandlers() {
    // Обработка ошибок JavaScript
    window.addEventListener('error', (event) => {
      this.handle({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
      }, {
        module: 'global',
        severity: ERROR_SEVERITY.CRITICAL,
        autoDetected: true
      });
    });

    // Обработка ошибок загрузки ресурсов
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handle({
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          resource: event.target.tagName,
          url: event.target.src || event.target.href
        }, {
          module: 'resource-loader',
          severity: ERROR_SEVERITY.MEDIUM,
          autoDetected: true
        });
      }
    }, true);
  }

  /**
   * Настройка обработчика необработанных промисов
   */
  setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      this.handle({
        message: event.reason?.message || 'Unhandled promise rejection',
        reason: event.reason,
        stack: event.reason?.stack
      }, {
        module: 'promise',
        severity: ERROR_SEVERITY.HIGH,
        autoDetected: true
      });
    });
  }

  /**
   * Основной метод обработки ошибок
   * 
   * @param {Error|Object|string} error - Ошибка для обработки
   * @param {Object} options - Опции обработки
   * @param {string} options.module - Название модуля, где произошла ошибка
   * @param {string} options.severity - Уровень серьезности (ERROR_SEVERITY)
   * @param {Function} options.fallback - Функция fallback для выполнения
   * @param {string} options.userMessage - Сообщение для пользователя
   * @param {boolean} options.showToUser - Показывать ли сообщение пользователю
   * @param {boolean} options.sendToServer - Отправлять ли на сервер
   * @param {boolean} options.notifyAdmin - Уведомлять ли администратора
   * @param {Object} options.context - Дополнительный контекст
   */
  handle(error, options = {}) {
    const {
      module = 'unknown',
      severity = ERROR_SEVERITY.MEDIUM,
      fallback = null,
      userMessage = null,
      showToUser = this.options.showToUser,
      sendToServer = this.options.enableServerLog,
      notifyAdmin = false,
      context = {},
      autoDetected = false
    } = options;

    // Нормализуем ошибку
    const normalizedError = this.normalizeError(error);

    // Создаем объект ошибки с контекстом
    const errorData = {
      ...normalizedError,
      module,
      severity,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
      autoDetected
    };

    // Сохраняем ошибку
    this.storeError(errorData);

    // Логируем в консоль
    if (this.options.enableConsoleLog) {
      this.logToConsole(errorData);
    }

    // Выполняем fallback если есть
    if (fallback && typeof fallback === 'function') {
      try {
        fallback();
      } catch (fallbackError) {
        console.error('Error in fallback function:', fallbackError);
      }
    }

    // Показываем сообщение пользователю
    if (showToUser && userMessage) {
      this.showUserMessage(userMessage, severity);
    }

    // Отправляем на сервер (для будущей админ-панели)
    if (sendToServer) {
      this.sendToServer(errorData, notifyAdmin);
    }

    return errorData;
  }

  /**
   * Нормализация ошибки в единый формат
   */
  normalizeError(error) {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
    } else if (typeof error === 'string') {
      return {
        message: error
      };
    } else if (typeof error === 'object' && error !== null) {
      return {
        message: error.message || 'Unknown error',
        ...error
      };
    }

    return {
      message: 'Unknown error'
    };
  }

  /**
   * Сохранение ошибки в локальное хранилище
   */
  storeError(errorData) {
    this.errors.push(errorData);
    
    // Ограничиваем количество хранимых ошибок
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.shift();
    }

    // Сохраняем в localStorage для анализа (только в development)
    if (this.options.environment === 'development') {
      try {
        const stored = JSON.parse(localStorage.getItem('errorLog') || '[]');
        stored.push(errorData);
        // Храним только последние 50 ошибок
        const limited = stored.slice(-50);
        localStorage.setItem('errorLog', JSON.stringify(limited));
      } catch (e) {
        // Игнорируем ошибки localStorage
      }
    }
  }

  /**
   * Логирование в консоль
   */
  logToConsole(errorData) {
    const { module, severity, message, stack, context } = errorData;
    
    const logMessage = `[${module}] ${message}`;
    const logData = {
      severity,
      context,
      ...(stack && { stack })
    };

    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        console.error(`🔴 CRITICAL: ${logMessage}`, logData);
        break;
      case ERROR_SEVERITY.HIGH:
        console.error(`🟠 HIGH: ${logMessage}`, logData);
        break;
      case ERROR_SEVERITY.MEDIUM:
        // console.warn(`🟡 MEDIUM: ${logMessage}`, logData); // DEBUG: отключено
        break;
      case ERROR_SEVERITY.LOW:
        // console.info(`🔵 LOW: ${logMessage}`, logData); // DEBUG: отключено
        break;
      default:
        // console.log(`⚪ ${logMessage}`, logData); // DEBUG: отключено
    }
  }

  /**
   * Показ сообщения пользователю
   */
  showUserMessage(message, severity) {
    // Простая реализация - можно расширить для красивого UI
    if (severity === ERROR_SEVERITY.CRITICAL || severity === ERROR_SEVERITY.HIGH) {
      // Для критических ошибок показываем alert (можно заменить на модальное окно)
      if (this.options.environment === 'production') {
        // В продакшене показываем понятное сообщение
        alert(message);
      } else {
        // В разработке показываем с техническими деталями
        console.error('User message:', message);
      }
    }
    // Для medium/low ошибок можно использовать toast-уведомления
  }

  /**
   * Отправка ошибки на сервер (для будущей админ-панели)
   */
  async sendToServer(errorData, notifyAdmin = false) {
    if (!this.options.enableServerLog || !this.options.serverEndpoint) {
      return;
    }

    try {
      const payload = {
        ...errorData,
        notifyAdmin
      };

      // Используем sendBeacon для надежной отправки (не блокирует закрытие страницы)
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          this.options.serverEndpoint,
          JSON.stringify(payload)
        );
      } else {
        // Fallback для старых браузеров
        fetch(this.options.serverEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          keepalive: true // Важно для отправки при закрытии страницы
        }).catch(err => {
          // console.warn('Failed to send error to server:', err); // DEBUG: отключено
        });
      }
    } catch (error) {
      // Не логируем ошибки отправки ошибок, чтобы избежать бесконечного цикла
      // console.warn('Error sending to server (silent):', error); // DEBUG: отключено
    }
  }

  /**
   * Получить все сохраненные ошибки
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Получить ошибки по модулю
   */
  getErrorsByModule(module) {
    return this.errors.filter(err => err.module === module);
  }

  /**
   * Получить ошибки по уровню серьезности
   */
  getErrorsBySeverity(severity) {
    return this.errors.filter(err => err.severity === severity);
  }

  /**
   * Очистить сохраненные ошибки
   */
  clearErrors() {
    this.errors = [];
    if (this.options.environment === 'development') {
      localStorage.removeItem('errorLog');
    }
  }

  /**
   * Получить статистику ошибок
   */
  getStats() {
    const stats = {
      total: this.errors.length,
      bySeverity: {},
      byModule: {},
      recent: this.errors.slice(-10)
    };

    this.errors.forEach(err => {
      // По серьезности
      stats.bySeverity[err.severity] = (stats.bySeverity[err.severity] || 0) + 1;
      
      // По модулю
      stats.byModule[err.module] = (stats.byModule[err.module] || 0) + 1;
    });

    return stats;
  }
}

// Создаем глобальный экземпляр
let errorHandlerInstance = null;

/**
 * Инициализация обработчика ошибок
 */
export function initErrorHandler(options = {}) {
  if (errorHandlerInstance) {
    return errorHandlerInstance;
  }

  errorHandlerInstance = new ErrorHandler(options);
  
  // Экспортируем глобально для удобства
  if (typeof window !== 'undefined') {
    window.errorHandler = errorHandlerInstance;
  }

  return errorHandlerInstance;
}

/**
 * Получить экземпляр обработчика ошибок
 */
export function getErrorHandler() {
  return errorHandlerInstance || initErrorHandler();
}

// Экспортируем для использования в модулях
export default {
  initErrorHandler,
  getErrorHandler,
  ERROR_SEVERITY
};

