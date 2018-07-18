var Funcmatic = require('../lib/core')
var LogPlugin = require('../plugins/log')

const app = require('@funcmatic/lambda-router')

app.get('/', async (event, context, { log }) => {
  if (!log) throw Error("Did not set 'log' service")
  log("mytest")
  return { statusCode: 200 }
})  

describe('Request', () => {
  it ("should set service 'log' and pass it into the user function", async () => {
    await Funcmatic.use(LogPlugin, { })
    var event = { path: '/', method: 'GET', headers: { } }
    var context = { }
    var handler = Funcmatic.wrap(app.handler())
    // this should not throw
    await handler(event, context)  
  })
})