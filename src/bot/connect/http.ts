import fetch from 'node-fetch'
import FormData from 'form-data'
import { apiPath } from '../config.js'
import * as getImageFile from './http.mjs'
import { getLogger } from '../logs/logger.js'
import { imageRegex } from '../utils/utils.js'
import { errorMessage } from '../interface/base.js'
import events from 'events'

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

        async sendMsg (data) {
          data.data.content = await this.imageReplace(data.data.content)
          logger.info(data)
          // the URL of the website to which the content must be posted is passed as a parameter to the fetch function along with specifying the method, body and header
          const res = await fetch(apiPath.baseUrl + data.url, {
            method: 'POST',
            body: JSON.stringify(data.data),
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bot ' + this.token
            }
          })
          const result = await res.json()
          logger.info(JSON.stringify(result))
          return result
          // .then(result => {
          //     return result.json()
          // })
          // //the posted contents to the website in json format is displayed as the output on the screen
          // .then(jsonFormat => {
          //     console.log(jsonFormat)
          // })
          // .catch(err => {
          //     console.log('请求gateway错误:', err)
          // })
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
