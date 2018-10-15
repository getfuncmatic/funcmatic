var func = require('../lib/funcmatic')
var EnvPlugin = require('../plugins/env')

// let's set a variable to replicate if someone set it lambda env 
process.env['REDIS_HOST'] = 'redis://myredis.host'

// Manually create a plugin to test a 'downstream' consumer
// of the env set up by EnvPlugin
class EnvConsumerPlugin {
  constructor() {
    this.name = 'envconsumer'
    this.config = null
    this.env = null
  }
  async start(config, env) {
    this.config = JSON.parse(JSON.stringify(config))
    this.env = JSON.parse(JSON.stringify(env))
  }
  async request() {
    return { service: { config: this.config, env: this.env } }
  }
}

// should work without providing manual config
func.use(EnvPlugin)
func.use(EnvConsumerPlugin, env => ({ 
  vara: env.VARIABLE_A, // this should get set by EnvPlugin
  varb: env.VARIABLE_B,
  redis: env.REDIS_HOST // this exists in the process.env and merged in to initialize funcmatic's own env
}))

describe('Request', () => {
  var funcmatic = null
  var plugin = null

  beforeEach(async () => {
    funcmatic = func.clone()
    plugin = funcmatic.getPlugin('env')
  })
  it ('should update env instance of funcmatic', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { env }) => {
      expect(env).toMatchObject({
        "VARIABLE_A": "value-a",
        "VARIABLE_B": "value-b"
      })
      return { statusCode: 200 }
    })
    // variables in the plugin SHOULD NOT actually update process.env
    // plugins should only update the funcmatic process.env equivalent
    expect(process.env["VARIABLE_A"]).toBeFalsy()
    expect(process.env["VARIABLE_B"]).toBeFalsy()
  })
  it ('should call config defined as a function on plugin start', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { env, envconsumer }) => {
      expect(envconsumer).toMatchObject({
        // set at start time by the config function passed by the user
        config: {
          vara: env.VARIABLE_A,
          varb: env.VARIABLE_B,
          redis: process.env['REDIS_HOST']
        },
        // set at start time by the funcmatic framework and the EnvPlugin's start
        env: {
          VARIABLE_A: env.VARIABLE_A,
          VARIABLE_B: env.VARIABLE_B,
          REDIS_HOST: process.env['REDIS_HOST']
        }
      })
      return { statusCode: 200 }
    })
  })
}) 
