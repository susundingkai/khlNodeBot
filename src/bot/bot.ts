import { GetGateway, myRes } from './connect/getGateway.js'
import { client } from './connect/client.js'
import { checkInternetConnection, Sleep } from './utils/utils.js'
import { requestBuilderOptions } from './interface/httpInterface.js'
import { Response } from 'node-fetch'
import { getLogger } from './logs/logger.js'
import { apiPath } from './config.js'
import { msgOptions, PluginBase } from './interface/pluginBase.js'
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
    private plugMap: Map<number, PluginBase>;
    constructor (auth) {
      super(auth)
      this.app = express()
      // @ts-ignore
      this.app.use(bodyParser.json()) // for parsing application/json
      // @ts-ignore
      this.app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
      this.gateway = undefined
      this.getAuth(auth)
      // this.getGateway()
      this.routeMap = new Map<string, PluginBase>()
      this.plugMap = new Map<number, PluginBase>()
      this.emitter.addListener('wsTimeout', this.restart.bind(this))
    }

    async getGateway () {
      const gateway = new GetGateway(this.auth)
      this.gateway = gateway.get()
      return this.gateway
        .then(result => {
          return result.json()
        })
        .then(jsonFormat => {
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

    async getMe (): Promise<void> {
      const options: requestBuilderOptions = {
        method: 'POST',
        apiPath: apiPath.getMe,
        headers: { 'Content-Type': 'application/json' }
      }
      const sendFunc = this.httpBuilder(options)
      const res = await sendFunc()
      const result = await res.json()
      this.meID = (<{ data: { id: string } }><unknown>result).data.id
      console.log('bot id is ', this.meID)
    }

    restart (this, secret) {
      if (secret === this.secret) {
        logger.warn('restart websocket')
        this.run(false).catch(e => logger.error(e))
      }
    }

    async run (init = true): Promise<any> {
      while (true) {
        logger.info('check Internet....')
        if (await checkInternetConnection()) {
          logger.info('Internet check passed!!')
          break
        }
      }
      if (await this.checkOnline()) {
        logger.warn('bot is online, trying to kick off....')
        await this.botOffline()
      }
      this.getMe()
      let tryTimes = 0
      while (true) {
        if ((await this.getGateway())) {
          break
        }
        await Sleep(5000)
        logger.warn(`第${++tryTimes}次尝试`)
        if (tryTimes === 5) { logger.warn('获取失败,等待60s后重试'); await Sleep(60000) }
      }
      if (typeof this.gateway !== 'string') {
        logger.error('获取gateway超时')
        throw errorMessage.getGatewayFailed
      }
      this.clientConfig(this.gateway)
      if (init) {
        // @ts-ignore
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
            if (res !== undefined && res.type !== -1) { loggerRoute.info(JSON.stringify(res)) }
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

    addRoute (path:string, _plug) { // 加载插件
      const plugSecret = this.genSecret()
      const db = openDb(_plug.name)
      const plug = new _plug(this.emitter, db, plugSecret, getLogger(_plug.name))
      plug.initRoutes()
      this.routeMap.set(path, plug)
      this.plugMap.set(plugSecret, plug)
      this.emitter.addListener(plugSecret.toString(), (data) => this.handlePlugEmit(data, plug))
      this.app.use(path, plug.routes)
    }

    async route (msg):Promise<any> {
      const emptyRes = { type: -1, data: {} }
      const content = msg.content
      const option:msgOptions = {
        targetId: msg.target_id
      }
      for (const key of this.routeMap.keys()) { // 优先检查是否为命令
        if (content.startsWith(key)) {
          const data = content.split(' ').slice(1)
          const plug = this.routeMap.get(key)
          return plug.handle(data, option).then(res => {
            return res
          }).catch(e => {
            logger.warn(key + ' err:', e)
            return emptyRes
          })
        }
      }
      for (const plug of this.plugMap.values()) {
        if (plug.ifChannelExist(option.targetId)) {
          return plug.customHandle(msg).then(res => {
            return res
          }).catch(e => {
            logger.warn('err:', e)
            return emptyRes
          })
        }
      }
      return emptyRes
    }

    async handlePlugEmit (data, plug) {
      // const data = await plug.handleReq(req, res)
      if (data === undefined) {
        return 0
      }
      const channelIds = plug.getChannels()
      // console.log(data)
      data.data = await this.imageReplace(data.data)
      for (const targetId of channelIds) {
        this.sendMsg(
          {
            type: data.type,
            target_id: targetId,
            content: data.data
          }
        ).then((res) => {
          if (res.code === 400) {
            logger.warn('channel not found or no authorization, automatically unbinding....')
            plug.unBindChannel(targetId)
          }
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
