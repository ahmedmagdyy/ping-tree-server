const targetService = require('../target/targetService')

module.exports = { getDecision }

async function getDecision (postData) {
  let resultTarget = null

  const hour = new Date(postData.timestamp).getUTCHours()

  try {
    const targets = await targetService.getTargets()

    const filteredTarget = targets.filter(target => {
      return (
        target.accept.geoState.$in.includes(postData.geoState) &&
        target.accept.hour.$in.includes(hour.toString())
      )
    })[0]

    if (!filteredTarget) throw new Error('Invalid geostate or timestamp!')

    const filteredTargetMaxAcceptsPerDay = await targetService.getTargetMaxAcceptsPerDayFromRedis(
      filteredTarget.id
    )

    if (
      parseInt(filteredTarget.maxAcceptsPerDay) >
      parseInt(filteredTargetMaxAcceptsPerDay)
    ) {
      resultTarget = filteredTarget
      await targetService.incrMaxAcceptsPerDayInRedis(filteredTarget.id)
      return resultTarget
    }
    return { decision: 'reject' }
  } catch (error) {
    console.log(error)
    return {
      error: error.message
    }
  }
}
