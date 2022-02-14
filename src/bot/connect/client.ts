import websocket from 'websocket'
import { Sleep, inflate } from '../utils/utils.js'
import { KHLEvent } from '../interface/KHLEvent.js'
import { sendReq } from './http.js'
import httpClient = sendReq.httpClient;
import { getLogger } from '../logs/logger.js'
const logger = getLogger()
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
    private cl: websocket.client;
    private sn:number;
    private isAlive: boolean;
    constructor (auth) {
      super(auth)
      this.sn = 0
      this.isAlive = false
      // eslint-disable-next-line new-cap
      this.cl = new websocket.client()
      this.clientConfig()
    }

    clientConfig () {
      this.cl.on('connect', conn => {
        console.log('on connect')
        this.isAlive = true
        this.ping(conn)
        conn.on('frame', frame => {
          console.log(`on frame - ${frame.binaryPayload.toString()}`)
        })
        conn.on('message', data => {
          let json
          if (data.type === 'binary') {
            json = <message>JSON.parse(inflate(data.binaryData))
            logger.info(JSON.stringify(json))
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
              // console.log("receive hello")
            }
            if (json.s === 3) {
              // console.log('pong!!')
            }
          } else if (data.type === 'utf8') {
            console.log(`on binary message - ${data.utf8Data}`)
          }
        })
      })
      this.cl.on('connectFailed', err => {
        console.log(`on failed: ${err}`)
      })
      this.cl.on('httpResponse', resp => {
        console.log(`got ${resp.statusCode} ${resp.statusMessage}, expected 101 Switching Protocols`)
      })
    }

    connect (url:string) {
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
