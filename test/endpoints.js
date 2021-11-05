process.env.NODE_ENV = 'test'

const test = require('ava')
const servertest = require('servertest')
const server = require('../lib/server')

const targetMockObj = {
  id: '1',
  url: 'http://example.com',
  value: '0.50',
  maxAcceptsPerDay: '10',
  accept: {
    geoState: {
      $in: ['ca', 'ny']
    },
    hour: {
      $in: ['13', '14', '15']
    },
    zipcode: {
      $in: ['10001', '10002']
    },
    salary: {
      $in: ['150000', '175000']
    }
  }
}

const secondTargetMockObj = {
  id: '2',
  url: 'http://example.v2.com',
  value: '0.20',
  maxAcceptsPerDay: '8',
  accept: {
    geoState: {
      $in: ['ca', 'ny']
    },
    hour: {
      $in: ['13', '14', '15']
    },
    zipcode: {
      $in: ['20002', '20003']
    },
    salary: {
      $in: ['200000', '225000']
    }
  }
}

const updateTargetMockObj = {
  id: '1',
  url: 'http://example.com',
  value: '0.60',
  maxAcceptsPerDay: '60',
  accept: {
    geoState: {
      $in: ['la', 'ny', 'tx']
    },
    hour: {
      $in: ['21', '13', '9']
    },
    zipcode: {
      $in: ['10001', '10002']
    },
    salary: {
      $in: ['150000', '175000']
    }
  }
}

const firstDecisionBody = {
  geoState: 'ny',
  timestamp: '2018-07-19T13:28:59.513Z'
}

const firstDecisionBodyModified = {
  salary: '150000',
  zipcode: '10001'
}

const secondDecisionBody = {
  geoState: 'ny',
  timestamp: '2018-07-19T13:28:59.513Z',
  salary: '200000',
  zipcode: '20002'
}

const wrongRouteDecisionBody = {
  geoState: 'tx',
  timestamp: '2018-07-19T22:28:59.513Z'
}

test.serial.cb('healthcheck', function (t) {
  const url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('get empty targets', function (t) {
  const getUrl = '/api/targets'
  const getOpts = { method: 'GET', encoding: 'json' }
  servertest(server(), getUrl, getOpts, (_err, res) => {
    t.is(res.statusCode, 200)
    t.deepEqual(res.body, [])
    t.end()
  })
})

test.serial.cb('add target', function (t) {
  const postUrl = '/api/targets'
  const postOpts = { method: 'POST', encoding: 'json' }
  servertest(server(), postUrl, postOpts, (_err, res) => {
    t.is(res.statusCode, 200)
    t.deepEqual(res.body, targetMockObj)
    t.end()
  }).end(JSON.stringify(targetMockObj))
})

test.serial.cb('add second target', function (t) {
  const postUrl = '/api/targets'
  const postOpts = { method: 'POST', encoding: 'json' }
  servertest(server(), postUrl, postOpts, (_err, res) => {
    t.is(res.statusCode, 200)
    t.deepEqual(res.body, secondTargetMockObj)
    t.end()
  }).end(JSON.stringify(secondTargetMockObj))
})

test.serial.cb('get targets', function (t) {
  const getUrl = '/api/targets'
  const getOpts = { method: 'GET', encoding: 'json' }
  servertest(server(), getUrl, getOpts, (_err, res) => {
    t.is(res.statusCode, 200)
    t.deepEqual(res.body, [targetMockObj, secondTargetMockObj])
    t.end()
  })
})

test.serial.cb('get target by id', function (t) {
  const getUrl = '/api/targets/1'
  const getOpts = { method: 'GET', encoding: 'json' }
  servertest(server(), getUrl, getOpts, (_err, res) => {
    t.is(res.statusCode, 200)
    t.deepEqual(res.body, targetMockObj)
    t.end()
  })
})

test.serial.cb('get target by id not found', function (t) {
  const getUrl = '/api/targets/100'
  const getOpts = { method: 'GET', encoding: 'json' }
  servertest(server(), getUrl, getOpts, (_err, res) => {
    t.deepEqual(res.body, { error: 'Target not found!' })
    t.end()
  })
})

test.serial.cb('update target by id', function (t) {
  const updateUrl = '/api/targets/1'
  const updateOpts = { method: 'POST', encoding: 'json' }

  servertest(server(), updateUrl, updateOpts, (_err, res) => {
    t.is(res.statusCode, 200)
    t.deepEqual(res.body, updateTargetMockObj)
    t.notDeepEqual(res.body, targetMockObj)
    t.end()
  }).end(JSON.stringify(updateTargetMockObj))
})

test.serial.cb('update target by id not found', function (t) {
  const updateUrl = '/api/targets/100'
  const updateOpts = { method: 'POST', encoding: 'json' }

  servertest(server(), updateUrl, updateOpts, (_err, res) => {
    t.deepEqual(res.body, { error: "Target doesn't Exists" })
    t.end()
  }).end(JSON.stringify(updateTargetMockObj))
})

// this test will return url with id 1 -> http://example.com
test.serial.cb('post route decision', function (t) {
  const postUrl = '/route'
  const postOpts = { method: 'POST', encoding: 'json' }
  servertest(server(), postUrl, postOpts, (_err, res) => {
    t.is(res.statusCode, 200)
    t.deepEqual(res.body, { url: updateTargetMockObj.url })
    t.end()
  }).end(JSON.stringify(firstDecisionBody))
})

test.serial.cb('post route decision based on salary and zipcode only', function (t) {
  const postUrl = '/route'
  const postOpts = { method: 'POST', encoding: 'json' }
  servertest(server(), postUrl, postOpts, (_err, res) => {
    t.is(res.statusCode, 200)
    t.deepEqual(res.body, { url: updateTargetMockObj.url })
    t.end()
  }).end(JSON.stringify(firstDecisionBodyModified))
})

test.serial.cb('post route decision with wrong data', function (t) {
  const postUrl = '/route'
  const postOpts = { method: 'POST', encoding: 'json' }
  servertest(server(), postUrl, postOpts, (_err, res) => {
    t.deepEqual(res.body, { error: 'Invalid geostate or timestamp!' })
    t.end()
  }).end(JSON.stringify(wrongRouteDecisionBody))
})

// this test will return url with id 2 -> http://example.v2.com
test.serial.cb('post route decision based on second target data', function (t) {
  const postUrl = '/route'
  const postOpts = { method: 'POST', encoding: 'json' }
  servertest(server(), postUrl, postOpts, (_err, res) => {
    t.is(res.statusCode, 200)
    t.deepEqual(res.body, { url: secondTargetMockObj.url })
    t.end()
  }).end(JSON.stringify(secondDecisionBody))
})
