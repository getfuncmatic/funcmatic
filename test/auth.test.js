var funcmatic = require('../lib/funcmatic')
var AuthPlugin = require('../plugins/auth')

funcmatic.use(AuthPlugin, { })

describe('Request', () => {
  var plugin = null

  beforeEach(async () => {
    funcmatic = funcmatic.clone()
    plugin = funcmatic.getPlugin('auth')
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