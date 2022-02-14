import fetch from 'node-fetch'
import FormData from 'form-data'
import { apiPath } from '../config.js'
export namespace sendReq {
    export class httpClient {
        protected auth: {};
        protected meID:any
        private token: any;

        constructor (auth) {
          this.token = auth.token
        }

        async sendMsg (data) {
          // console.log(JSON.stringify(data.data))
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
          // console.log(JSON.stringify(result))
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
    }
}
