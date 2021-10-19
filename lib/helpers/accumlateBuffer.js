function accumelateBodyBuffer (req) {
  return new Promise((resolve, reject) => {
    let data = ''

    req.on('data', buff => {
      data += buff
    })

    req.on('end', () => {
      resolve(JSON.parse(data))
    })
  })
}

module.exports = { accumelateBodyBuffer }
