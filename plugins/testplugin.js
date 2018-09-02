class MyPlugin {
  
  constructor() {
    this.name = 'myplugin'
    this.count = 0
    this.requests = 0
  }
  
  async start(conf) {
    this.conf = conf
    this.count += 1
  }
  
  async request(event, context) {
    event.myplugin = true
    context.myplugin = true
    this.requests += 1
    var service = true
    return { event, context, service } 
  }

  async response(event, context, res) {
    res.myplugin = true
    res.requestcount = this.requests
    res.startcount = this.count
    return res
  }

  async error(event, context, err) {
    return { event, context, err }
  }
}

module.exports = MyPlugin
