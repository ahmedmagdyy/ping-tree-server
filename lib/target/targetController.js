const targetService = require('./targetService')
const sendJson = require('send-data/json')
const { accumelateBodyBuffer } = require('../helpers/accumlateBuffer')

module.exports = {
  addTargetHandler
}

async function addTargetHandler (req, res) {
  const body = await accumelateBodyBuffer(req)
  if (!body || body === '') {
    throw new Error('Malformed Request!')
  }

  const savedTarget = await targetService.addNewTarget(body)
  sendJson(req, res, savedTarget)
}
