class MyPlugin {
  
  constructor() {
    this.name = 'myplugin'
    this.counts = {
      'start': 0,
      'request': 0,
      'response': 0,
      'error': 0,
      'end': 0
    }
    this.count = 0
    this.requests = 0
  }
  
  inc(name) {
    this.counts[name] += 1 
  }

  async start(conf) {
    this.inc('start')
    this.conf = conf
  }
  
  async request(event, context) {
    this.inc('request')
    event.myplugin = true
    context.myplugin = true
    var service = { conf: this.conf }
    return { event, context, service } 
  }

  async response(event, context, res) {
    this.inc('response')
    res.myplugin = true
    return res
  }

  async error(event, context, err) {
    this.inc('error')
  }

  async end(options) {
    this.inc('end')
    if (options && options.teardown) {
      this.teardown = true
    }
  }
}

module.exports = MyPlugin
