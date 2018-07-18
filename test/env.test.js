var Funcmatic = require('../lib/core')
var EnvPlugin = require('../plugins/env')

describe('Request', () => {
  it ('should install env and set process.env values', async () => {
    var conf = { }
    Funcmatic.use(EnvPlugin, conf)
    expect(EnvPlugin.env).toMatchObject({})
    var handler = Funcmatic.wrap(async (event, context, { env }) => { 
      return { 
        statusCode: 200, 
        env
      }
    })
    var ret = await handler({}, {})
    expect(ret.env).toMatchObject({
      "VARIABLE_A": "value-a",
      "VARIABLE_B": "value-b"
    })
    expect(process.env).toMatchObject({
      "VARIABLE_A": "value-a",
      "VARIABLE_B": "value-b"
    })
  })
}) 