const targetService = require('../target/targetService')

module.exports = { getDecision }

async function getDecision (postData) {
  let resultTarget = null
  let highestValue = -1
  let filteredTarget = []
  const hour = new Date(postData.timestamp).getUTCHours()
  const postDataAcceptKeys = Object.keys(postData)

  try {
    const targets = await targetService.getTargets()

    filteredTarget = targets
    for (let i = 0; i < postDataAcceptKeys.length; i++) {
      const key = postDataAcceptKeys[i]
      filteredTarget = filteredTarget
        .map(target => {
          if (key === 'timestamp') {
            if (target.accept.hour.$in.includes(hour.toString())) return target
          } else {
            if (target.accept[key].$in.includes(postData[key])) return target
          }
        })
        .filter(target => target)
    }

    if (!filteredTarget.length) {
      throw new Error('Invalid geostate or timestamp!')
    }

    // loop over valid targets
    for (let i = 0; i < filteredTarget.length; i++) {
      // get max accepts per day for each
      let filteredTargetMaxAcceptsPerDay = await targetService.getTargetMaxAcceptsPerDayFromRedis(
        filteredTarget[i].id
      )

      // if expired, renew it
      if (isNaN(parseInt(filteredTargetMaxAcceptsPerDay))) {
        await targetService.setTargetExpiration(filteredTarget[i].id)
        filteredTargetMaxAcceptsPerDay = 0
      }

      // check if target can accept request
      if (
        parseInt(filteredTarget[i].maxAcceptsPerDay) >
        parseInt(filteredTargetMaxAcceptsPerDay)
      ) {
        // check if this target value is bigger than
        // the highest value we have
        if (filteredTarget[i].value > highestValue) {
          resultTarget = filteredTarget[i]
          highestValue = filteredTarget[i].value
        }
      }
    }

    // no target can accept the req
    if (!resultTarget && highestValue === -1) {
      return { decision: 'reject' }
    }

    // incr choosen target max accepts
    await targetService.incrMaxAcceptsPerDayInRedis(resultTarget.id)
    return resultTarget
  } catch (error) {
    console.log(error)
    return {
      error: error.message
    }
  }
}
