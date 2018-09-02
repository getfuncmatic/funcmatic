var initFuncmatic = require('../lib/funcmatic').create
var AuthPlugin = require('../plugins/auth')

describe('Request', () => {
  var funcmatic = null
  var plugin = null

  beforeEach(async () => {
    funcmatic = initFuncmatic()
    plugin = new AuthPlugin()
    funcmatic.use(plugin, { })
  })

  it ('should decode JWT token if provided', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { auth }) => {
      expect(auth.claims).toBeFalsy()
    })
    event.headers = { Authorization: "JWT-TOKEN" }
    await funcmatic.invoke(event, context, async (event, context, { auth }) => {
      expect(auth.claims).toMatchObject({
        sub: 'USER-ID',
        email: 'user@email.com'
      })
    })
  })
})