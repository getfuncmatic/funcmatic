var Funcmatic = require('../lib/core')
var MyPlugin = require('../plugins/testplugin')

var handler = async (event, context) => {
  return { statusCode: 200 }
}

//expect(houseForSale).toMatchObject(desiredHouse);
describe('Use', () => {
  it ('should install a plugin', async () => {
    Funcmatic.use(MyPlugin, { hello: "world" })
    var hooks = Funcmatic.installedHooks()
    expect(hooks.request.length).toBe(1)
    expect(hooks.request[0].name).toBe("myplugin")
  })
}) 

describe('Event and Context', () => {
  it ('should mutate the passed in event and context', async () => {
    var event = { hello: 'world' }
    var context = { foo: 'bar' }
    
  })
  it ('should freeze originalEvent', async () => {
    var event = { hello: 'world' }
    var context = { foo: 'bar' }
    var handler = Funcmatic.wrap(async (event, context) => {
      event.hello = 'something'
      // below should no-op because originalEvent is frozen
      context.originalEvent.hello = 'something'
      return { statusCode: 200 }
    })
    var ret = await handler(event, context)
    expect(event).toMatchObject({
      hello: 'something'
    })
    expect(context.originalEvent).toMatchObject({
      hello: 'world'
    })
  })
})

describe('Wrap', () => {
  it ('should invoke the handler', async () => {
    var event = { path: '/', method: 'GET' }
    var context = { }
    var ret = await Funcmatic.wrap(handler)(event, context)
    expect(ret).toMatchObject({
      statusCode: 200
    })
  })
  it ('should call the start and request hooks when executing', async () => {
    Funcmatic.clear()
    MyPlugin.count = 0
    Funcmatic.use(MyPlugin, { hello: "world" })
    var event = { path: '/', method: 'GET' }
    var context = { }
    var ret = await Funcmatic.wrap(handler)(event, context)
    expect(ret).toMatchObject({
      myplugin: true
    })
    // call start hook during coldstart
    expect(MyPlugin.count).toBe(1)
    
    // should NOT call start hook on non coldstart
    var ret = await Funcmatic.wrap(handler)(event, context)
    expect(MyPlugin.count).toBe(1)
  })
})