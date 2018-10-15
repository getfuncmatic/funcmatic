const util = require('../lib/util')

class EnvPlugin {
  constructor() {
    this.name = 'env'
    this.env = { }
  }
  
  // hook
  // conf is the user specified conf provided in 'Funcmatic.use'
  // env is the global environment similar to process.env
  async start(conf, env) {
    this.name = conf.name || this.name
    var data = await fetchParams(conf)
    for (var param of data.Parameters) {
      // this is like setting in process.env 
      // so that 'start' methods of future plugins
      // down the line will be able to access them (env.REDIS_HOST)
      env[param.Name] = param.Value 
      // update this.env
      this.env[param.Name] = param.Value 
    }
    // no return, all you can do configure yourself
    // or mutate the 'env' param which is funcmatic's equivalent of process.env
    // return this.env
  }
  
  async request(event, context) {
    var service = this.env
    return { service }
  }
}

// Put actual logic to get params here
// e.g. AWS SSM Parameter store
async function fetchParams(conf) {
  await util.wait(100)  
  return { 
    Parameters: [ 
      {
        Name: "VARIABLE_A",
        Type: "String",
        Value: "value-a"
      },
      {
        Name: "VARIABLE_B",
        Type: "String",
        Value: "value-b"
      }
    ]
  }
}

module.exports = EnvPlugin