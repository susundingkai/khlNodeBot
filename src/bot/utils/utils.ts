import pako from 'pako'
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
