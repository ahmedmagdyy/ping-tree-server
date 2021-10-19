const routeService = require('./routeService')
const sendJson = require('send-data/json')
const { accumelateBodyBuffer } = require('../helpers/accumlateBuffer')

module.exports = {
  getRouteDecisionHandler
}

async function getRouteDecisionHandler (req, res) {
  const body = await accumelateBodyBuffer(req)
  if (!body || body === '') {
    throw new Error('Malformed Request!')
  }

  const foundTarget = await routeService.getDecision(body)
  sendJson(req, res, foundTarget.id ? { url: foundTarget.url } : foundTarget)
}
