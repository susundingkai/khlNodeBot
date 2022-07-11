import events from 'events'

export interface pluginOptions {
    targetId: string
}
export abstract class PluginBase {
    protected emiter:events.EventEmitter;
    private db: Promise<any>;
    private plugName:string
    constructor (plugName:string, emmiter:events.EventEmitter, db:Promise<any>) {
      this.emiter = emmiter
      this.db = db
      this.plugName = plugName
    }

    abstract handle(data:string, options:pluginOptions)
    async handleReq (data:any, res:any):Promise<any> {}
    async bindChannel (targetId:string) {
      this.db.then(async _db => {
        await _db.exec('CREATE TABLE IF NOT EXISTS bind_targetId (id TEXT PRIMARY KEY)')
        await _db.exec(`INSERT OR IGNORE INTO bind_targetId(id) VALUES(${targetId})`)
      })
    }

    async getChannels () {
      return this.db.then(async _db => {
        return await _db.all('SELECT id FROM bind_targetId')
      })
    }
}
