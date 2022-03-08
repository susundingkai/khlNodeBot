import { GetGateway, myRes } from './connect/getGateway.js'
import { client } from './connect/client.js'
import { Sleep } from './utils/utils.js'
import { httpInterface } from './interface/httpInterface.js'
import { Response } from 'node-fetch'
import { getLogger } from './logs/logger.js'
import { apiPath } from './config.js'
import { PluginBase, pluginOptions } from './interface/pluginBase.js'
import events from 'events'
import { openDb } from './connect/database.js'
import express from 'express'
import bodyParser from 'body-parser'
import { errorMessage } from './interface/base.js'
const logger = getLogger()
const loggerRoute = getLogger('route')

export class Bot extends client {
    private gateway:undefined|string|Promise<Response>
    private routeMap:Map<string, PluginBase>
    private db: Promise<any>
    private app:express.Application
    constructor (auth) {
      super(auth)
      this.app = express()
      this.app.use(bodyParser.json()) // for parsing application/json
      this.app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
      this.gateway = undefined
      this.getAuth(auth)
      // this.getGateway()
      this.routeMap = new Map<string, PluginBase>()
      this.emitter.addListener('wsTimeout', this.restart.bind(this))
    }

    async getGateway () {
      const gateway = new GetGateway(this.auth)
      this.gateway = gateway.get()
      return this.gateway
      // then() function is used to convert the posted contents to the website into json format
        .then(result => {
          return result.json()
        })
      // the posted contents to the website in json format is displayed as the output on the screen
        .then(jsonFormat => {
        // console.log(jsonFormat)
          this.gateway = (<myRes>jsonFormat).data.url
          logger.info('请求gateway成功')
          // logger.info(('gateway url is: ' + this.gateway))
          return true
        }).catch(err => {
          this.gateway = undefined
          logger.error('请求gateway错误:', err)
          return false
        })
    }

    getAuth (auth):void {
      this.auth = auth
      this.getMe()
    }

    getMe ():void {
      this.sendMsg(httpInterface.me).then(data => {
        this.meID = (<{data:{id:string}}>data).data.id
        console.log('bot id is ', this.meID)
      })
    }

    restart (this) {
      logger.warn('restart websocket')
      this.run(false).catch(e => logger.error(e))
    }

    async run (init = true): Promise<any> {
      this.sn = 0
      let tryTimes = 0
      while (!(await this.getGateway())) {
        await Sleep(5000)
        logger.warn(`第${++tryTimes}次尝试`)
        if (tryTimes === 5) { logger.warn('获取失败,等待60s后重试'); await Sleep(60000) }
      }
      if (typeof this.gateway !== 'string') {
        logger.error('获取gateway超时')
        throw errorMessage.getGatewayFailed
      }
      this.clientConfig()
      this.connect(this.gateway)
      if (init) {
        this.app.listen(apiPath.httpPort, function () {
          console.log(`listening on port ${apiPath.httpPort}!`)
        })
      }
      return true
    }

    async evenHandle (msg) {
      if (msg.author_id === this.meID) return {}
      try {
        this.route(msg).then(res => {
          try {
            if (res.type !== -1) { loggerRoute.info(JSON.stringify(res)) }
          } catch (e) {
            logger.error(e)
          }
          // 如果没有路由则退出
          if (typeof res === 'undefined' || res.type === -1) return 0
          this.sendMsg({
            data: {
              type: res.type,
              target_id: msg.target_id,
              content: res.data
            },
            url: apiPath.createMessage
          }).catch(e => {
            logger.error('route err:', e)
          })
        })
      } catch (e) {
        logger.error('eventHandle:', e)
      }
    }

    addRoute (path:string, _plug) {
      const db = openDb(_plug.name)
      const plug = new _plug(this.emitter, db)
      this.routeMap.set(path, plug)
      this.app.post(path, (req, res) => {
        this.handleHttp(req, res, plug)
      })

      // this.app.get('/' + path, function (req, res) {
      //     plug.handleReq(res.data)
      // })
    }

    async route (msg):Promise<any> {
      const emptyRes = { type: -1, data: {} }
      const content = msg.content
      for (const key of this.routeMap.keys()) {
        if (content.startsWith(key)) {
          const data = content.split(' ').slice(1)
          const plug = this.routeMap.get(key)
          const option:pluginOptions = {
            targetId: msg.target_id
          }
          return plug.handle(data, option).then(res => {
            return res
          }).catch(e => {
            logger.warn(key + ' err:', e)
            return emptyRes
          })
        }
      }
      return emptyRes
    }

    async handleHttp (req, res, plug) {
      const data = await plug.handleReq(req.body, res)
      const channelIds = await plug.getChannels()
      // console.log(data)
      for (const targetId of channelIds) {
        this.sendMsg({
          data: {
            type: data.type,
            target_id: targetId.id,
            content: data.data
          },
          url: apiPath.createMessage
        }).catch(e => {
          logger.error('route err:', e)
        })
      }
    }
}

// var a={
//     token:'1/MTA3MDE=/jHBuxGUOmLzoZ3rcCWGIiw==',
//     verify:'a7R65Mwu9DDnIFgr',
//     encrypt:'BI13IOHTIH'
// }
// var b =new Bot(a)
