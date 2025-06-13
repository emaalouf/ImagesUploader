const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');
require('winston-daily-rotate-file');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define the log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Create transport for API requests logging
const apiTransport = new transports.DailyRotateFile({
  filename: path.join(logsDir, 'api-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

// Create transport for error logging
const errorTransport = new transports.DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

// Create the logger
const logger = createLogger({
  format: logFormat,
  transports: [
    apiTransport,
    errorTransport,
    new transports.Console({ format: format.combine(format.colorize(), logFormat) })
  ]
});

module.exports = logger; 