import events from 'events'
import express from 'express'
import lmdb, { RootDatabase } from 'lmdb'
import { errorMessage } from './base.js'

export interface msgOptions {
    targetId: string
}

// interface handleReq {
//   (data:any, res:any):Promise<any>
// }
export interface msgStruc{
  type:number,
  data:any
}
export abstract class PluginBase {
    protected emiter:events.EventEmitter;
    private db: RootDatabase;
    protected plugName:string
    protected routes:any
    private secret: number;
    private bindDb: lmdb.Database<any, lmdb.Key>;
    protected logger: any;
    constructor (plugName:string, emmiter:events.EventEmitter, db:RootDatabase, secret:number, logger) {
      this.secret = secret
      this.logger = logger
      this.emiter = emmiter
      this.db = db
      this.bindDb = this.db.openDB('bind', {
        dupSort: true
        // encoding: 'ordered-binary',
      })
      this.plugName = plugName
      this.routes = express()
    }

    async handle (data:string, options:msgOptions) {
      // eslint-disable-next-line no-unreachable
      if (data[0].startsWith('bind')) {
        try {
          await this.bindChannel(options.targetId)
          return { type: -1, data: {} }
        } catch (e) {
          this.logger.error(e)
          throw errorMessage.argsNoFound
        }
      }
      if (data[0].startsWith('unbind')) {
        try {
          await this.unBindChannel(options.targetId)
          return { type: -1, data: {} }
        } catch (e) {
          this.logger.error(e)
          throw errorMessage.argsNoFound
        }
      }
      this.logger.warn('input args err: ', JSON.stringify(data))
      throw errorMessage.argsNoFound
    }

    abstract initRoutes ()
    abstract customHandle(msg:any):Promise<any>
    sendPlugMsg (data: msgStruc) {
      this.emiter.emit(this.secret.toString(), data)
    }

    async hello (data:any, res:any):Promise<any> {
      res.json({ data: `Hello from ${this.plugName}` })
    }

    async bindChannel (targetId:string) {
      // const curIds = await this.getChannels()
      if (!this.ifChannelExist(targetId)) {
        this.logger.info(`bind channel: ${targetId}`)
        await this.bindDb.put('bind_targetId', targetId)
      }
    }

    async unBindChannel (targetId:string) {
      this.logger.info(`unbind channel: ${targetId}`)
      await this.bindDb.remove('bind_targetId', targetId)
    }

    getChannels () {
      const ids = []
      const _ids = this.bindDb.getValues('bind_targetId')
      for (const id of _ids) {
        ids.push(id)
      }
      return ids
    }

    ifChannelExist (targetId:string) {
      return this.bindDb.doesExist('bind_targetId', targetId)
    }
}
