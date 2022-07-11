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
    constructor (auth) {
      super(auth)
      this.sn = 0
      this.isAlive = false
      this.wsTimeoutId = undefined
    }

    clientConfig (url) {
      this.sn = 0
      this.isAlive = false
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
        this.ping(this.cl)
      })
      this.cl.on('message', rev => {
        const json = <message>JSON.parse(inflate(rev))
        if (json.s !== 3) {
          // logger.info(JSON.stringify(json))
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
      if (this.isAlive === false) {
        return false
      }
      const s:ping = {
        s: 2,
        sn: this.sn
      }
      const pingBuf = JSON.stringify(s)
      conn.send(pingBuf)
      this.setTimeout()
      return true
    }

    async ping (conn:WebSocket) {
      while (await this._ping(conn)) {
        // this.checkOnline()
        await Sleep(28000)
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
      await Sleep(60000)
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
            this.emitTimeout('bot is offline!')
          } else {
          // logger.info('bot is online!!')
          }
        }).catch(err => {
          logger.warn(err)
          this.emitTimeout('bot is offline!')
        })
      } catch (e) {
        logger.error('eventHandle:', e)
        this.emitTimeout('bot is offline!')
      }
    }
}
