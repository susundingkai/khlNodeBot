// import * as request from "request";
import fetch, { Response } from 'node-fetch'
import { apiPath } from '../config.js'

export interface myRes {
    code: any;
    message:string;
    data:{
        url:string
    }
}
export class GetGateway {
    private readonly token: string;
    constructor (auth) {
      this.token = auth.token
    }

    get ():Promise<Response> {
      const data = {
      }
      // the URL of the website to which the content must be posted is passed as a parameter to the fetch function along with specifying the method, body and header
      const promise = fetch(apiPath.baseUrl + apiPath.gateway, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bot ' + this.token
        }
      })
      return promise
    }
}
