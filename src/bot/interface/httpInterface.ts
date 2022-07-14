export namespace httpInterface{

}

export interface revMsg {
  code: number,
  message: string,
  data: any
}
export interface requestBuilderOptions {
  method:string
  apiPath:string
  // parameters:{}
  headers: {}
  function?:Function
}
