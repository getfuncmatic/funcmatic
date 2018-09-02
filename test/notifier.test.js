var func = require('../lib/funcmatic')
var NotifierPlugin = require('../plugins/notifier')

func.use(NotifierPlugin)

describe('Request', () => {
  var funcmatic = null
  var plugin = null

  beforeEach(async () => {
    funcmatic = func.clone()
    plugin = funcmatic.getPlugin('notify')
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