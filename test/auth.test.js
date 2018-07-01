var Funcmatic = require('../lib/core')
var AuthPlugin = require('../plugins/auth')

const app = require('@funcmatic/lambda-router')

app.get('/', async (event, context) => {
  return { statusCode: 200, claims: context.auth.claims }
})  

describe('Request', () => {
  it ('should decode JWT token if provided', async () => {
    Funcmatic.use(AuthPlugin, { })
    var event = { path: '/', method: 'GET', headers: { } }
    var context = { }
    var ret = await Funcmatic.wrap(app.handler())(event, context)
    expect(ret.claims).toBeFalsy()
    
    event.headers.Authorization = "JWT-TOKEN"
    var ret2 = await Funcmatic.wrap(app.handler())(event, context)
    expect(ret2.claims).toMatchObject({
      sub: 'USER-ID',
      email: 'user@email.com'
    })
  })
})