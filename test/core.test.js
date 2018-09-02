var initFuncmatic = require('../lib/core')
var MyPlugin = require('../plugins/testplugin')

describe('Use', () => {
  it ('should install a plugin', async () => {
    var funcmatic = initFuncmatic()
    funcmatic.use(new MyPlugin(), { hello: "world" })
    var hooks = funcmatic.installedHooks()
    expect(hooks.request.length).toBe(1)
    expect(hooks.request[0].name).toBe("myplugin")
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
  })
  it ('should call the start and request hooks when executing', async () => {
    var event = { path: '/', method: 'GET' }
    var context = { }
    var coldret = await handler(event, context)
    expect(coldret).toMatchObject({
      myplugin: true,
      startcount: 1,
      requestcount: 1
    })

    // should NOT call start hook on non coldstart
    var warmret = await handler(event, context)
    expect(warmret).toMatchObject({
      myplugin: true,
      startcount: 1,
      requestcount: 2
    })
  })
})