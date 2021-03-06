var func = require('../lib/funcmatic')
var DatasourcePlugin = require('../plugins/datasource')
func.use(DatasourcePlugin, { cache: false })

describe('Request', () => {
  var funcmatic = null
  beforeEach(async () => {
    funcmatic = func.clone()
  })
  afterEach(async () => {
    await funcmatic.teardown() 
  })
  it ('should set and cache a connection in the context', async () => {
    funcmatic.clear()
    funcmatic.use(DatasourcePlugin, { cache: true })
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { datasource }) => {
      expect(datasource.conn.connected).toBeTruthy()
      return { }
    })
    var plugin = funcmatic.getPlugin('datasource')
    expect(plugin.cachedConnection && plugin.cachedConnection.connected).toBeTruthy()
  })
  it ('should connect on request and disconnect at response', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { datasource }) => {
      expect(datasource.conn.connected).toBeTruthy()
      return { }
    })
    var plugin = funcmatic.getPlugin('datasource')
    expect(plugin.cachedConnection).toBeFalsy()
  })
  it ('should terminate the uncached connection on error', async () => {
    var event = { }
    var context = { }
    try { 
      await funcmatic.invoke(event, context, async (event, context, { datasource }) => {
        expect(datasource.conn.connected).toBeTruthy()
        throw new Error("my error message")
      })
    } catch (err) {
      expect(err.message).toBe("my error message")
    }
    var plugin = funcmatic.getPlugin('datasource')
    expect(plugin.cachedConnection).toBeFalsy()
  })
})
