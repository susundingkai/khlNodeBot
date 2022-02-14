import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
export async function openDb (name:string) {
  return open({
    filename: `./storage/${name}.db`,
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    driver: sqlite3.Database
  })
}
