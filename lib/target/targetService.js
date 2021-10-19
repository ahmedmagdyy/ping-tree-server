const { promisify } = require('util')
const redisClient = require('../redis')
const validator = require('validator').default

const targetKey = 'target'
const targetMaxAcceptsPerDayKey = 'TMAPD'

// Node Redis currently doesn't natively support promises
redisClient.hmget = promisify(redisClient.hmget).bind(redisClient)
redisClient.hgetall = promisify(redisClient.hgetall).bind(redisClient)
redisClient.hmset = promisify(redisClient.hmset).bind(redisClient)
redisClient.hincrby = promisify(redisClient.hincrby).bind(redisClient)
redisClient.expire = promisify(redisClient.expire).bind(redisClient)

module.exports = {
  addNewTarget,
  getTargets,
  getTargetById,
  updateTargetById,
  getTargetMaxAcceptsPerDayFromRedis,
  incrMaxAcceptsPerDayInRedis
}

async function addNewTarget (target) {
  const validateTargetValues = validateTargetObject(target)
  if (
    Object.values(validateTargetValues).some(
      value => value === false || (value && value.error)
    )
  ) {
    return Object.keys(validateTargetValues)
      .filter(key => validateTargetValues[key] === false)
      .map(value => `${value} is invalid!`)
  }

  try {
    // create target Obj
    const saved = await redisClient.hmset(
      targetKey,
      target.id,
      JSON.stringify(target)
    )

    // create expired hash for max accepts per day
    await redisClient.hmset(targetMaxAcceptsPerDayKey, target.id, 0)
    // expires in 1 day
    await redisClient.expire(targetMaxAcceptsPerDayKey, 24 * 60 * 60)

    if (!saved) throw new Error('Failed Saving Target!')
    return target
  } catch (error) {
    console.log(error)
    return {
      error: error.message
    }
  }
}

async function getTargets () {
  const targets = await redisClient.hgetall(targetKey)

  if (!targets) return []

  return Object.values(targets).map(target => JSON.parse(target))
}

async function getTargetById (id) {
  try {
    const target = await redisClient.hmget(targetKey, id)
    if (!target[0]) throw new Error('Target not found!')

    return JSON.parse(target)
  } catch (error) {
    console.log(error)
    return {
      error: error.message
    }
  }
}

async function updateTargetById (id, targetData) {
  // don't wanna update target id if id exists in body
  const copyOfTargetData = targetData
  // set the id to the params id
  copyOfTargetData.id = id

  try {
    const targetExists = await redisClient.hmget(targetKey, id)
    if (!targetExists[0]) throw new Error("Target doesn't Exists")

    const target = await redisClient.hmset(
      targetKey,
      id,
      JSON.stringify(copyOfTargetData)
    )
    if (!target) throw new Error('Failed Updating Target!')

    const updatedTarget = await redisClient.hmget(targetKey, id)
    return JSON.parse(updatedTarget)
  } catch (error) {
    console.log(error)
    return {
      error: error.message
    }
  }
}

async function getTargetMaxAcceptsPerDayFromRedis (id) {
  try {
    const resultHash = await redisClient.hmget(targetMaxAcceptsPerDayKey, id)
    if (!resultHash) throw new Error('Not Found!')

    return resultHash
  } catch (error) {
    console.log({ error })
    return error
  }
}

async function incrMaxAcceptsPerDayInRedis (id) {
  try {
    const resultHash = await redisClient.hincrby(
      targetMaxAcceptsPerDayKey,
      id,
      1
    )
    if (!resultHash) throw new Error('Not Found!')

    return resultHash
  } catch (error) {
    console.log({ error })
    return error
  }
}

function validateId (id) {
  return validator.isNumeric(id)
}

function validateUrl (url) {
  return validator.isURL(url)
}

function validateValue (value) {
  return validator.isNumeric(value)
}

function validateMaxAcceptsPerDay (maxAcceptsPerDayValue) {
  return validator.isNumeric(maxAcceptsPerDayValue)
}

function validateAccept (accept) {
  if (!Object.keys(accept).length) {
    return { error: 'Empty Accept is not allowed!' }
  }

  return {
    geoState: validateAcceptGeostate(accept.geoState),
    hour: validateAcceptHour(accept.hour)
  }
}

function validateAcceptGeostate (geoState) {
  if (!geoState.$in || !geoState.$in.length) {
    return { error: 'Empty geoState/$in object is not allowed!' }
  }

  return (
    Array.isArray(geoState.$in) &&
    geoState.$in.every(item => typeof item === 'string')
  )
}

function validateAcceptHour (hour) {
  if (!hour.$in || !hour.$in.length) {
    return { error: 'Empty hour/$in object is not allowed!' }
  }
  return (
    Array.isArray(hour.$in) &&
    hour.$in.every(
      item => typeof item === 'string' && validator.isNumeric(item)
    )
  )
}

function validateTargetObject (target) {
  return {
    id: validateId(target.id),
    url: validateUrl(target.url),
    value: validateValue(target.value),
    maxAcceptsPerDay: validateMaxAcceptsPerDay(target.maxAcceptsPerDay),
    accept: validateAccept(target.accept)
  }
}

// const target = {
//   id: '1',
//   url: 'http://example.com',
//   value: '0.50',
//   maxAcceptsPerDay: '10',
//   accept: {
//     geoState: {
//       $in: ['ca', 'ny']
//     },
//     hour: {
//       $in: ['13', '14', '15']
//     }
//   }
// }

// console.dir(validateTargetObject(target), { depth: null })
