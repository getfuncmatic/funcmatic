var func = require('../lib/funcmatic')
var EnvPlugin = require('../plugins/env')
func.use(EnvPlugin, { })

describe('Request', () => {
  var funcmatic = null
  var plugin = null

  beforeEach(async () => {
    funcmatic = func.clone()
    plugin = funcmatic.getPlugin('env')
  })

  it ('should install env and set process.env values', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { env }) => {
      expect(env).toMatchObject({
        "VARIABLE_A": "value-a",
        "VARIABLE_B": "value-b"
      })
      return { statusCode: 200 }
    })
    expect(process.env).toMatchObject({
      "VARIABLE_A": "value-a",
      "VARIABLE_B": "value-b"
    })
  })
}) 