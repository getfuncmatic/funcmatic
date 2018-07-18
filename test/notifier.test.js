var Funcmatic = require('../lib/core')
var NotifierPlugin = require('../plugins/notifier')

describe('Request', () => {
  it ("should throw a user error and call the notifier plugin", async () => {
    await Funcmatic.use(NotifierPlugin, { })
    var event = { path: '/', method: 'GET', headers: { } }
    var context = { }
    var handler = Funcmatic.wrap(async (event, context, { notify }) => {
      throw Error("User Error")
    })
    var error = null
    // this should throw 
    try {
      var ret = await handler(event, context)  
    } catch (err) {
      error = err
    }
    expect(error).toBeTruthy()
    expect(error.message).toBe("User Error")
    expect(NotifierPlugin.err).toMatchObject(error)
  })
})