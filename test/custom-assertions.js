import { AssertionError } from 'chai'
import { isRegExp, isString } from 'util'

export function didFlash (res, key, value = null) {
  const flash = getFlash(res)
  if (!(key in flash)) {
    const knownKeys = Object.keys(flash).sort().map((k) => `'${k}'`).join(', ')
    throw new AssertionError(`Missing key '${key}' in flash (available keys: ${knownKeys})`)
  }

  if (isString(value) && flash[key] !== value) {
    throw new AssertionError(`expected '${key}' flash '${value}', got '${flash[key]}'`)
  }

  if (isRegExp(value) && !value.test(flash[key])) {
    throw new AssertionError(`expected '${key}' flash to match ${value}, got non-matching '${flash[key]}'`)
  }
}

function getFlash (res) {
  return getSession(res).flash || {}
}

function getSession (res) {
  const cookies = (res.headers['set-cookie'] || [])
  const cookie = cookies.filter((s) => s.match(/^wazaaa:session=/))[0]
  const b64 = cookie.match(/^wazaaa:session=(.+?);/)[1]
  if (!b64) return {}

  return JSON.parse(new Buffer(b64, 'base64').toString())
}
