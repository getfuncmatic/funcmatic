var initFuncmatic = require('../lib/core').create
var MyPlugin = require('../plugins/testplugin')

describe('Use', () => {
  it ('should install a plugin', async () => {
    var funcmatic = initFuncmatic()
    funcmatic.use(new MyPlugin(), { hello: "world" })
    var plugin = funcmatic.getPlugin('myplugin')
    expect(plugin).toMatchObject({
      name: 'myplugin'
    })
    var hooks = funcmatic.installedHooks()
    expect(hooks.start.length).toBe(1)
    expect(hooks.start[0]).toMatchObject({
      plugin: {
        name: "myplugin"
      },
      config: {
        hello: "world"
      }
    })
  })
}) 

describe('Event and Context', () => {
  var funcmatic = null
  beforeEach(async () => {
    funcmatic = initFuncmatic()
    funcmatic.use(new MyPlugin(), { })
  })
  afterEach(async () => {
    funcmatic.teardown()
  })
  it ('should mutate the passed in event and context', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { myplugin }) => {
      return { }
    })
    expect(event).toMatchObject({
      myplugin: true
    })
    expect(context).toMatchObject({
      myplugin: true
    })
  })
  it ('should freeze originalEvent', async () => {
    var event = { hello: 'world' }
    var context = { foo: 'bar' }
    await funcmatic.invoke(event, context, async (event, context) => {
      event.hello = 'something'
      // below should no-op because originalEvent is frozen
      context.originalEvent.hello = 'something'
      return { }
    })
    expect(event).toMatchObject({
      hello: 'something'
    })
    expect(context.originalEvent).toMatchObject({
      hello: 'world'
    })
  })
})

describe('Wrap', () => {
  var funcmatic = null
  var handler = null
  beforeEach(async () => {
    funcmatic = initFuncmatic()
    funcmatic.use(new MyPlugin(), { })
    handler = funcmatic.wrap(async (event, context, { myplugin }) => {
      if (event.error) {
        throw new Error("user handler error")
      }
      return { statusCode: 200 }
    })
  })
  it ('should invoke the handler', async () => {
    var event = { }
    var context = { }
    var ret = await handler(event, context)
    expect(ret).toMatchObject({
      statusCode: 200
    })
    expect(ret).toMatchObject({
      statusCode: 200
    })
    var plugin = funcmatic.getPlugin('myplugin')
    expect(plugin.counts).toMatchObject({
      start: 1,
      request: 1,
      response: 1,
      error: 0,
      end: 1
    })
  })
  it ('should NOT call start on subsequent requests', async () => {
    var plugin = funcmatic.getPlugin('myplugin')
    expect(plugin.counts).toMatchObject({
      start: 0,
      request: 0,
      response: 0,
      error: 0,
      end: 0
    })

    var event = { }
    var context = { }
    await handler(event, context)
    expect(plugin.counts).toMatchObject({
      start: 1,
      request: 1,
      response: 1,
      error: 0,
      end: 1
    })
    // should NOT call start hook on non coldstart
    await handler(event, context)
    expect(plugin.counts).toMatchObject({
      start: 1,
      request: 2,
      response: 2,
      error: 0,
      end: 2
    })
  })
  it ('should call error and end if user handler throws an error', async () => {
    var plugin = funcmatic.getPlugin('myplugin')
    var event = { error: true }
    var context = { }
    try { 
      await handler(event, context)
    } catch (err) {
      expect(err.message).toBe("user handler error")
    }
    expect(plugin.counts).toMatchObject({
      start: 1,
      request: 1,
      response: 0,
      error: 1,
      end: 1
    })
  })
})