import pako from 'pako'
import ping from 'ping'
export const Sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
export function inflate (input):string|undefined {
  const unzip = pako.inflate(input, { to: 'string' })
  return unzip
}
export async function fetchIcon (url: string, mode = 'get') {
  try {
    // return fs.createReadStream('./tmp.png')
  } catch (e) {
    console.log(e)
  }
}
export function imageRegex (text: string) {
  const regex = /\$.IMAGE\s(.*?)\s\$\$/gm
  const lists = []
  let m
  while ((m = regex.exec(text)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      console.log(`Found match, group ${groupIndex}: ${match}`)
    })
    lists.push(m.slice(0, 2))
  }
  return lists
}

export async function checkInternetConnection () {
  const res = await ping.promise.probe('www.baidu.com')
  if (res.packetLoss !== 'unknown' || res.packetLoss !== '100.000') {
    return true
  } else {
    return false
  }
  // const res = await ping.promise.probe('www.baidudsadadfafdsfsdfdsfada.com')
}
