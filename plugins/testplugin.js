class MyPlugin {
  
  constructor() {
    this.name = 'myplugin'
    this.count = 0
  }
  
  async start(conf) {
    this.conf = conf
    this.count += 1
  }
  
  async request(event, context) {
    context[this.name] = true
    return { event, context } 
  }

  async response(event, context, res) {
    res.myplugin = true
    return res
  }

  async error(event, context, err) {
    return { event, context, err }
  }
}

module.exports = new MyPlugin()
