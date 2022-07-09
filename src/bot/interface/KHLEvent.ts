/* eslint-disable camelcase */
export namespace KHLEvent {
    export interface event {
        channel_type: string // string 消息频道类型, GROUP 为频道消息
        type: number // int 1:文字消息, 2:图片消息，3:视频消息，4:文件消息， 8:音频消息，9:KMarkdown，10:card 消息，255:系统消息, 其它的暂未开放
        target_id: string // string 发送目的 id，如果为是 GROUP 消息，则 target_id 代表频道 id
        author_id: string // string 发送者 id, 1 代表系统
        content: string// string 消息内容, 文件，图片，视频时，content 为 url
        msg_id: string // string 消息的 id
        msg_timestamp: number// int 消息发送时间的毫秒时间戳
        nonce: string // string 随机串，与用户消息发送 api 中传的 nonce 保持一致
        from_type:number // string
        extra: any // mixed 不同的消息类型，结构不一致
    }
    interface user{
        id:string// string 用户的 id
        username:string // string 用户的名称
        nickname:string// string 用户在当前服务器的昵称
        identify_num:string // string 用户名的认证数字，用户名正常为：user_name#identify_num
        online:boolean// boolean 当前是否在线
        bot:boolean // boolean 是否为机器人
        status:number // int 用户的状态, 0 和 1 代表正常，10 代表被封禁
        avatar:string// string 用户的头像的 url 地址
        vip_avatar:string // string vip 用户的头像的 url 地址，可能为 gif 动图
        mobile_verified:boolean // boolean 是否手机号已验证
        roles:any// Array 用户在当前服务器中的角色 id 组成的列表
        os: string
        banner:string
        is_vip:boolean
        is_ai_reduce_noise:boolean
    }
    interface textMessage {
        type:number // int 同上面 type
        code:string
        guild_id:string // string 服务器 id
        channel_name:string// string 频道名
        mention:[] // Array 提及到的用户 id 的列表
        mention_all:boolean // boolean 是否 mention 所有用户
        mention_roles:[]// Array mention 用户角色的数组
        mention_here:boolean// boolean 是否 mention 在线用户
        nav_channels:[]
        kmarkdown: { raw_content: string, mention_part: [], mention_role_part: [] }
        last_msg_content:string
        author:user // Map 用户信息, 见对象-用户 User
    }

    export function parse (input:any) {
      input = <event>input
      if (input.type === 9) {
        input = <event>input
        input.extra = <textMessage>input.extra
        // console.log(input.extra.author.roles)
        return input
      }
    }
}
