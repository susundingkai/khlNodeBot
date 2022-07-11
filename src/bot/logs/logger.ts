import log4js from 'log4js'

log4js.configure({
  appenders: {
    console: { type: 'console' },
    botLogs: { type: 'file', filename: 'logs/bot.log', category: 'bot', maxLogSize: 10485760, backups: 3 },
    apex: { type: 'file', filename: 'logs/bot.log', category: 'bot', maxLogSize: 10485760, backups: 3 },
    mcs: { type: 'file', filename: 'logs/bot.log', category: 'bot', maxLogSize: 10485760, backups: 3 }
  },
  categories: {
    default: { appenders: ['console', 'botLogs'], level: 'info' }
  }
})
export const getLogger = function (cate = 'botLogs') {
  return log4js.getLogger(cate)
}
