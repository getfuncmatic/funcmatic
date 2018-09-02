var Funcmatic = require('../lib/core')
var DatasourcePlugin = require('../plugins/datasource')

const app = require('@funcmatic/lambda-router')

app.get('/', async (event, context, { datasource }) => {
  if (context.error) throw new Error("my error message")
  return { statusCode: 200, conn: datasource.conn }
}) 

describe('Request', () => {
  it ('should set and cache a connection in the context', async () => {
    Funcmatic.clear()
    await Funcmatic.use(DatasourcePlugin, { cache: true })
    var event = { path: '/', method: 'GET', headers: { } }
    var context = { }
    await Funcmatic.wrap(app.handler())(event, context)
    expect(DatasourcePlugin.cachedConnection).toMatchObject({
      connected: true
    })
  })
  it ('should connect on request and not cache i.e. disconnect at response', async () => {
    Funcmatic.clear()
    await Funcmatic.use(DatasourcePlugin, { cache: false })
    var event = { path: '/', method: 'GET', headers: { } }
    var context = { }
    var ret = await Funcmatic.wrap(app.handler())(event, context)
    expect(ret).toMatchObject({
      conn: {
        connected: true
      }
    })
    expect(DatasourcePlugin.cachedConnection).toBeFalsy()
  })
  it ('should terminate the uncached connection on error', async () => {
    Funcmatic.clear()
    await Funcmatic.use(DatasourcePlugin, { cache: false })
    var event = { path: '/', method: 'GET', headers: { } }
    var context = { error: true }
    var ret = await Funcmatic.wrap(app.handler())(event, context)
    expect(ret.message).toBe("my error message")
    expect(DatasourcePlugin.cachedConnection).toBeFalsy()
  })
})