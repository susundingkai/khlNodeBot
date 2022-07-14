import fetch, { Headers } from 'node-fetch'
import FormData from 'form-data'
import { apiPath } from '../config.js'
import * as getImageFile from './http.mjs'
import { getLogger } from '../logs/logger.js'
import { imageRegex } from '../utils/utils.js'
import { errorMessage } from '../interface/base.js'
import events from 'events'
import { requestBuilderOptions, revMsg } from '../interface/httpInterface'
import { URLSearchParams } from 'url'

const logger = getLogger('http')
export namespace sendReq {
    export class httpClient {
        protected auth: {};
        protected meID: any
        protected token: any;
        protected emitter: events.EventEmitter
        protected secret:number
        protected secretList:[number]
        constructor (auth) {
          this.secretList = [0]
          this.secret = this.genSecret()
          this.token = auth.token
          this.emitter = new events.EventEmitter()
        }

        httpBuilder (options:requestBuilderOptions) {
          const myMap = new Map(Object.entries(options.headers))
          const headers = new Headers()
          headers.append('Authorization', 'Bot ' + this.token)
          headers.append('Content-Type', 'application/json')
          for (const key of myMap.keys()) {
            headers.append(key, <string>myMap.get(key))
          }
          if (options.method.toUpperCase() === 'GET') {
            return async (param = {}) => {
              // if (options.function !== undefined) param = options.function(param)
              const paramString = new URLSearchParams(param).toString()
              const URL = apiPath.baseUrl + options.apiPath + '?' + paramString
              const res = await fetch(URL, {
                method: 'GET',
                headers: headers
              })
              return res
            }
          }
          if (options.method.toUpperCase() === 'POST') {
            return async (body = {}) => {
              // if (options.function !== undefined) body = options.function(body)
              const URL = apiPath.baseUrl + options.apiPath
              const res = await fetch(URL, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: headers
              })
              return res
            }
          }
        }

        async sendMsg (data) {
          const options:requestBuilderOptions = {
            method: 'POST',
            apiPath: apiPath.createMessage,
            headers: {}
          }
          const sendFunc = this.httpBuilder(options)
          // data.data.content = await this.imageReplace(data.data.content)
          // logger.info('sssssdasda', data)
          const res = await sendFunc(data)
          const result = await res.json()
          logger.info(JSON.stringify(result))
          return <revMsg>result
        }

        async uploadFile (data) {
          const file = new FormData()
          console.log('哈哈哈:', data.data)

          file.append('file', data.data)
          console.log(file.getBoundary())
          const res = await fetch('https://www.kaiheila.cn' + data.url, {
            method: 'POST',
            body: file,
            headers: {
              'Content-Type': 'multipart/form-data; boundary=' + file.getBoundary(),
              Authorization: 'Bot ' + this.token
            }
          })
          const result = await res.json()
          console.log(JSON.stringify(result))
          return result
        }

        async imageReplace (content) {
          const imageUrls = imageRegex(content)
          let text: string = content
          for (const imageUrl of imageUrls) {
            const result = await this.getImage(imageUrl[1])
            // @ts-ignore
            if (result.code !== 0) throw errorMessage.convertImageFailed
            // @ts-ignore
            const ossUrl = result.data.url
            text = text.replace(imageUrl[0], ossUrl)
          }
          return text
        }

        async getImage (url: string) {
          logger.info('get image from :' + url)
          return fetch(url, {
            method: 'GET',
            // body: JSON.stringify(data.data),
            headers: {
              // 'Content-Type': 'image/jpeg'
            }
          }).then(res => res.arrayBuffer()).then(async buf => {
            // console.log(buf)
            const formData = getImageFile.default(buf)
            // console.log(formData)
            const res = await fetch('https://www.kaiheila.cn/api/v3/asset/create', {
              method: 'POST',
              body: formData,
              headers: {
                // 'Content-Type': 'multipart/form-data; boundary=' + formData.boundary,
                Authorization: `Bot ${this.token}`
              }
            })
            const result = await res.json()
            logger.info('get image :' + JSON.stringify(result))
            return result
          })
        }

        genSecret () {
          let final:number = 0
          while (true) {
            const precision = 10000000
            const rawPre = (Date.now() - new Date(1624206802955).getTime()) / precision
            const preNumber = Number(rawPre.toFixed()) * precision
            const randam = Math.floor(Math.random() * precision)
            final = preNumber + randam
            if (!(final in this.secretList)) {
              this.secretList.push(final)
              break
            }
          }
          return final
        }
      // http://192.168.0.125:8988/api/MediaCover/56/poster.jpg?apikey={{sonarrApi}}
    }
}
