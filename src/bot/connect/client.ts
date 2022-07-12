// import websocket from 'websocket'
import WebSocket from 'ws'
import { inflate, Sleep } from '../utils/utils.js'
import { KHLEvent } from '../interface/KHLEvent.js'
import { sendReq } from './http.js'
import { getLogger } from '../logs/logger.js'
import httpClient = sendReq.httpClient;
import fetch from 'node-fetch'

const logger = getLogger('ws')
interface ping{
    s:number,
    sn:number
}
interface message{
    s:number,
    d:{
      code: number;
    },
    sn:number
}
export class client extends httpClient {
    protected cl: WebSocket;
    protected sn:number;
    private isAlive: boolean;
    protected wsTimeoutId:any
    protected wsCountTime:number
    constructor (auth) {
      super(auth)
      this.sn = 0
      this.isAlive = false
      this.wsTimeoutId = undefined
      this.wsCountTime = 0
    }

    clientConfig (url) {
      this.sn = 0
      this.isAlive = false
      this.wsCountTime = (this.wsCountTime + 1) % 1000
      // eslint-disable-next-line new-cap
      if (typeof this.wsTimeoutId !== 'undefined') {
        this._clearTimeout()
      }
      if (this.cl !== undefined) {
        this.cl.terminate()
        this.cl = undefined
        logger.warn('disconnect')
      }
      this.cl = new WebSocket(url, {
        perMessageDeflate: false
      })
      this.cl.on('open', () => {
        console.log('on connect')
        this.isAlive = true
        // this.setTimeout()
        this.ping(this.cl, this.wsCountTime)
      })
      this.cl.on('message', rev => {
        const json = <message>JSON.parse(inflate(rev))
        if (json.s !== 3) {
          logger.info(JSON.stringify(json))
        }
        if (json.s === 0) {
          this.sn = json.sn
          const data = json.d
          // console.log(data)
          const msg = KHLEvent.parse(data)
          if (msg === undefined) {
            return 0
          }
          this.evenHandle(msg)
        }
        if (json.s === 1) {
          if (json.d.code === 40103) {
            this.emitTimeout('token expired !')
          }
        }
        if (json.s === 3) {
          logger.info('pong')
          //  rec pong packet
          this._clearTimeout()
        }
        if (json.s === 5) {
          if (json.d.code === 40108) {
            this.emitTimeout('need reconnect !')
          }
        }
      })
    }

    async _ping (conn:WebSocket):Promise<boolean> {
      const s:ping = {
        s: 2,
        sn: this.sn
      }
      const pingBuf = JSON.stringify(s)
      conn.send(pingBuf)
      logger.info('ping')
      this.setTimeout()
      return true
    }

    async ping (conn:WebSocket, count:number) {
      while (true) {
        if (this.wsCountTime === count) {
          await this._ping(conn)
          // this.checkOnline()
          await Sleep(28000)
        } else {
          break
        }
      }
    }

    evenHandle (msg) {}
    setTimeout ():void {
      this._clearTimeout()
      this.wsTimeoutId = setTimeout(() => this.emitTimeout('wsTimeout'), 6000)
      // logger.warn('wsTimeout:', reason)
    }

    emitTimeout (reason:string) {
      this.emitter.emit('wsTimeout')
      this._clearTimeout()
      logger.warn('wsTimeout:', reason)
    }

    _clearTimeout () {
      if (typeof this.wsTimeoutId !== 'undefined') {
        clearTimeout(this.wsTimeoutId)
        this.wsTimeoutId = undefined
      }
    }

    setMsgTest () {
      this.sendMsg({
        data: {
          type: 10,
          target_id: '9151717345367349',
          content: JSON.stringify({})
        },
        url: '/api/v3/message/create'
      })
    }

    async checkOnline () {
      try {
        return fetch('https://www.kaiheila.cn/api/v3/user/me', {
          method: 'GET',
          // body: JSON.stringify(data.data),
          headers: {
          // 'Content-Type': 'multipart/form-data; boundary=' + formData.boundary,
            Authorization: `Bot ${this.token}`
          }
        }).then(res => {
          return res.json()
        }).then(res => {
        // @ts-ignore
          if (res.data.online === false) {
            return false
            // this.emitTimeout('bot is offline!')
          } else {
            return true
          // logger.info('bot is online!!')
          }
        }).catch(err => {
          logger.warn(err)
          return false
          // this.emitTimeout('bot is offline!')
        })
      } catch (e) {
        logger.error('eventHandle:', e)
        return false
        // this.emitTimeout('bot is offline!')
      }
    }

    async botOffline () {
      try {
        return fetch('https://www.kaiheila.cn/api/v3/user/offline', {
          method: 'POST',
          headers: {
            Authorization: `Bot ${this.token}`
          }
        }).then(res => {
          return true
        }).catch(err => {
          logger.warn(err)
          return false
        })
      } catch (e) {
        logger.error('eventHandle:', e)
        return false
      }
    }
}
