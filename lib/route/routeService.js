const targetService = require('../target/targetService')

module.exports = { getDecision }

async function getDecision (postData) {
  let resultTarget = null
  let highestValue = -1
  const hour = new Date(postData.timestamp).getUTCHours()

  try {
    const targets = await targetService.getTargets()

    const filteredTarget = targets.filter(target => {
      return (
        target.accept.geoState.$in.includes(postData.geoState) &&
        target.accept.hour.$in.includes(hour.toString())
      )
    })
    if (!filteredTarget.length) {
      throw new Error('Invalid geostate or timestamp!')
    }

    // loop over valid targets
    for (let i = 0; i < filteredTarget.length; i++) {
      // get max accepts per day for each
      const filteredTargetMaxAcceptsPerDay = await targetService.getTargetMaxAcceptsPerDayFromRedis(
        filteredTarget[i].id
      )

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
