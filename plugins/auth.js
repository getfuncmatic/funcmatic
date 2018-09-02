const util = require('../lib/util')

class AuthPlugin {
  constructor() {
    this.name = 'auth'
  }
  
  async start(conf) {
    await util.wait(100)
    this.setup = true
  }
  
  async request(event, context) {
    var claims = await this.auth(event.headers && event.headers['Authorization'])
    //context['auth'] = { claims }
    var service = { claims }
    //return { event, context }
    return { service }
  }
  
  async auth(token) {
    util.wait(100)
    if (token) {
      return {
        sub: 'USER-ID',
        email: 'user@email.com'
      }
    }
    return null
  }
}

module.exports = AuthPlugin
