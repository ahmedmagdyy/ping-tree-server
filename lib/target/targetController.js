const targetService = require('./targetService')
const sendJson = require('send-data/json')
const { accumelateBodyBuffer } = require('../helpers/accumlateBuffer')

module.exports = {
  addTargetHandler,
  getTargetsHandler
}

async function addTargetHandler (req, res) {
  const body = await accumelateBodyBuffer(req)
  if (!body || body === '') {
    throw new Error('Malformed Request!')
  }

  const savedTarget = await targetService.addNewTarget(body)
  sendJson(req, res, savedTarget)
}

async function getTargetsHandler (req, res) {
  const targets = await targetService.getTargets()
  sendJson(req, res, targets)
}
