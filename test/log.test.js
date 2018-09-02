var initFuncmatic = require('../lib/funcmatic').create
var LogPlugin = require('../plugins/log')

describe('Request', () => {
  var funcmatic = null
  var plugin = null

  beforeEach(async () => {
    funcmatic = initFuncmatic()
    plugin = new LogPlugin()
    funcmatic.use(plugin, { })
  })

  it ("should set service 'log' and pass it into the user function", async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { log }) => {
      log("hello world")
      return { statusCode: 200 }
    })
    expect(plugin.flushed.length).toBe(1)
    expect(plugin.flushed[0]).toBe("hello world")
    expect(plugin.buffer.length).toBe(0)
    // this should not throw
  })
})