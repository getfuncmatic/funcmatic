const util = require('../lib/util')

class EnvPlugin {
  constructor() {
    this.name = 'env-demo'
    this.env = { }
  }
  
  // hook
  async start(conf) {
    this.name = conf.name || this.name
    var data = await fetchParams(conf)
    var env = { }
    for (var param of data.Parameters) {
      this.env[param.Name] = param.Value
      process.env[param.Name] = param.Value
    }
    return this.env
  }
  
  async request(event, context) {
    context['env'] = this.env
    return { event, context }
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

module.exports = new EnvPlugin()