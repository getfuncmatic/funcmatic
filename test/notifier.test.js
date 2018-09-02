var initFuncmatic = require('../lib/core').create
var NotifierPlugin = require('../plugins/notifier')

describe('Request', () => {
  var funcmatic = null
  var plugin = null

  beforeEach(async () => {
    funcmatic = initFuncmatic()
    plugin = new NotifierPlugin()
    funcmatic.use(plugin, { })
  })

  it ("should throw a user error and call the notifier plugin", async () => {
    var event = { }
    var context = { }
    var error = null
    try {
      await funcmatic.invoke(event, context, async (event, context, { notify }) => {
        throw Error("User Error")
      })  
    } catch (err) {
      error = err
    }
    expect(error).toBeTruthy()
    expect(error.message).toBe("User Error")
    expect(plugin.err).toMatchObject(error)
  })
})