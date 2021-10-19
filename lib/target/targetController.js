const targetService = require('./targetService')
const sendJson = require('send-data/json')
const { accumelateBodyBuffer } = require('../helpers/accumlateBuffer')

module.exports = {
  addTargetHandler,
  getTargetsHandler,
  getTargetByIdHandler,
  updateTargetByIdHandler
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

async function getTargetByIdHandler (req, res, query) {
  const id = query.params.id
  const target = await targetService.getTargetById(id)
  sendJson(req, res, { body: target, statusCode: target.id ? 200 : 404 })
}

async function updateTargetByIdHandler (req, res, query) {
  const id = query.params.id
  const body = await accumelateBodyBuffer(req)
  if (!body || body === '') {
    throw new Error('Malformed Request!')
  }
  const target = await targetService.updateTargetById(id, body)
  sendJson(req, res, { body: target, statusCode: target.id ? 200 : 404 })
}
