var func = require('../lib/funcmatic')
var LogPlugin = require('../plugins/log')

func.use(LogPlugin, { })

describe('Request', () => {
  var funcmatic = null
  var plugin = null
  beforeEach(async () => {
    funcmatic = func.clone()
    plugin = funcmatic.getPlugin('log')
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