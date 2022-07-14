// import sqlite3 from 'sqlite3'
// import { open } from 'sqlite'
import { open } from 'lmdb' // or require
import { configPath } from '../../config/config.js'
import path from 'path'

export function openDb (name:string) {
  const myDB = open(path.join(configPath.databasePath, name), {
    maxDbs: 12
  })
  return myDB
  // return open({
  //   filename: `./storage/${name}.db`,
  //   mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  //   driver: sqlite3.Database
  // })
}
