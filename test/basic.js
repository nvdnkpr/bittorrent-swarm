var hat = require('hat')
var portfinder = require('portfinder')
var Swarm = require('../')
var test = require('tape')

var infoHash = 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36'
var peerId1 = '-WW0001-' + hat(48)
var peerId2 = '-WW0001-' + hat(48)

test('create swarm, check invariants', function (t) {
  var swarm = new Swarm(infoHash, peerId1)

  t.equal(swarm.infoHash.toString('hex'), infoHash)
  t.equal(swarm.peerId.toString('utf8'), peerId1)
  t.equal(swarm.downloaded, 0)
  t.equal(swarm.uploaded, 0)
  t.ok(Array.isArray(swarm.wires))
  t.equal(swarm.wires.length, 0)
  t.end()
})

test('swarm listen', function (t) {
  t.plan(2)

  var swarm = new Swarm(infoHash, peerId1)
  t.equal(swarm.port, 0, 'port param initialized to 0')
  portfinder.getPort(function (err, port) {
    if (err) throw err
    swarm.listen(port)

    swarm.on('listening', function () {
      t.equal(swarm.port, port, 'listened on requested port ' + port)
      swarm.destroy()
    })
  })
})

test('swarm join', function (t) {
  t.plan(10)

  var swarm1 = new Swarm(infoHash, peerId1)
  portfinder.getPort(function (err, port) {
    if (err) throw err
    swarm1.listen(port)

    swarm1.on('listening', function () {
      var swarm2 = new Swarm(infoHash, peerId2)

      t.equal(swarm1.wires.length, 0)
      t.equal(swarm2.wires.length, 0)

      swarm1.on('wire', function (wire) {
        t.ok(wire, 'Peer join our swarm via listening port')

        t.equal(swarm1.wires.length, 1)
        t.ok(wire.remoteAddress.indexOf('127.0.0.1:') === 0)
        t.equal(wire.peerId.toString('utf8'), peerId2)

        swarm1.destroy()
      })

      swarm2.on('wire', function (wire) {
        t.ok(wire, 'Joined swarm, got wire')

        t.equal(swarm2.wires.length, 1)
        t.equal(wire.remoteAddress, '127.0.0.1:8000')
        t.equal(wire.peerId.toString('utf8'), peerId1)

        swarm2.destroy()
      })

      swarm2.add('127.0.0.1:' + swarm1.port)
    })
  })
})

