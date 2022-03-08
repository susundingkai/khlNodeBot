import websocket from 'websocket'
import { Sleep, inflate } from '../utils/utils.js'
import { KHLEvent } from '../interface/KHLEvent.js'
import { sendReq } from './http.js'
import httpClient = sendReq.httpClient;
import { getLogger } from '../logs/logger.js'
const logger = getLogger('ws')
interface ping{
    s:number,
    sn:number
}
interface message{
    s:number,
    d:{},
    sn:number
}
export class client extends httpClient {
    protected cl: websocket.client;
    protected sn:number;
    private isAlive: boolean;
    protected wsTimeoutId:any
    constructor (auth) {
      super(auth)
      this.sn = 0
      this.isAlive = false
      this.wsTimeoutId = undefined
    }

    clientConfig () {
      // eslint-disable-next-line new-cap
      this.cl = new websocket.client()
      this.cl.on('connect', conn => {
        console.log('on connect')
        this.isAlive = true
        this.wsTimeoutId = setTimeout(() => this.emitter.emit('wsTimeout'), 40000)
        this.ping(conn)
        conn.on('frame', frame => {
          console.log(`on frame - ${frame.binaryPayload.toString()}`)
        })
        conn.on('message', data => {
          let json
          if (data.type === 'binary') {
            json = <message>JSON.parse(inflate(data.binaryData))
            if (json.s !== 3)logger.info(JSON.stringify(json))
            if (json.s === 0) {
              this.sn = json.sn
              data = json.d
              const msg = KHLEvent.parse(data)
              if (msg === undefined) {
                return 0
              }
              this.evenHandle(msg)
            }
            if (json.s === 1) {
              if (json.d.code === 40103) {
                this.emitter.emit('wsTimeout')
              }
            }
            if (json.s === 3) {
              if (typeof this.wsTimeoutId === 'undefined') {
                this.wsTimeoutId = setTimeout(() => this.emitter.emit('wsTimeout'), 40000)
              } else {
                clearTimeout(this.wsTimeoutId)
                this.wsTimeoutId = setTimeout(() => this.emitter.emit('wsTimeout'), 40000)
              }
            }
            if (json.s === 5) {
              if (json.d.code === 40108) {
                this.emitter.emit('wsTimeout')
              }
            }
          } else if (data.type === 'utf8') {
            console.log(`on binary message - ${data.utf8Data}`)
          }
        })
      })
      this.cl.on('connectFailed', err => {
        console.log(`on failed: ${err}`)
        this.emitter.emit('wsTimeout')
      })
      this.cl.on('httpResponse', resp => {
        console.log(`got ${resp.statusCode} ${resp.statusMessage}, expected 101 Switching Protocols`)
      })
    }

    connect (url:string) {
      this.wsTimeoutId = undefined
      this.cl.connect(url, null, null, null)
    }

    async _ping (conn:websocket.connection):Promise<boolean> {
      if (this.isAlive === false) {
        return false
      }
      const s:ping = {
        s: 2,
        sn: this.sn
      }
      const pingBuf = JSON.stringify(s)
      conn.sendUTF(pingBuf)
      return true
    }

    async ping (conn:websocket.connection) {
      while (await this._ping(conn)) {
        await Sleep(28000)
      }
    }

    evenHandle (msg) {}
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
}
