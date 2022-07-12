import events from 'events'
import express from 'express'
import { RootDatabase } from 'lmdb'

export interface pluginOptions {
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
    private plugName:string
    protected routes:any
    private secret: number;
    constructor (plugName:string, emmiter:events.EventEmitter, db:RootDatabase, secret:number) {
      this.secret = secret
      this.emiter = emmiter
      this.db = db
      this.plugName = plugName
      this.routes = express()
      // this.initRoutes()
    }

    abstract handle(data:string, options:pluginOptions)
    abstract initRoutes ()
    sendPlugMsg (data: msgStruc) {
      this.emiter.emit(this.secret.toString(), data)
    }

    async hello (data:any, res:any):Promise<any> {
      res.json({ data: 'Hello from PluginBase' })
    }

    async bindChannel (targetId:string) {
      // const putConfig:PutOptions = {
      //   noDupData: true
      // }
      const curIds = await this.getChannels()
      if (!(targetId in curIds)) {
        await this.db.put('bind_targetId', targetId)
      }
    // this.db.then(async _db => {
    //   await _db.exec('CREATE TABLE IF NOT EXISTS bind_targetId (id TEXT PRIMARY KEY)')
    //   await _db.exec(`INSERT OR IGNORE INTO bind_targetId(id) VALUES(${targetId})`)
    // })
    }

    async getChannels () {
      const ids = []
      const _ids = this.db.getValues('bind_targetId')
      for (const id of _ids) {
        // console.log("sssssssss:",id)
        ids.push(id)
      }
      return ids
    // return this.db.then(async _db => {
    //   return await _db.all('SELECT id FROM bind_targetId')
    // })
    }
}
