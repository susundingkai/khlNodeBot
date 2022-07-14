import { Bot } from './bot/bot.js'
import auth from './config/auth.js'
import { getLogger } from './bot/logs/logger.js'
// import { Apex } from './plugins/apex/apex.js'
import { Mcs } from './plugins/mcs/mcs.js'
import { Sonarr } from './plugins/sonarr/sonarr.js'
import { Todo } from './plugins/todo/todo.js'

const logger = getLogger()
logger.info('=================start===============')
const a = new Bot(auth)
// a.addRoute('/apex', Apex)
a.addRoute('/mc', Mcs)
a.addRoute('/sonarr', Sonarr)
a.addRoute('/todo', Todo)
a.run().then(r => {}).catch(e => console.log(e))
