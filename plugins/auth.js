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
    var claims = await this.auth(event.headers['Authorization'])
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

module.exports = new AuthPlugin()

// class A {
//   constructor(fooVal) {
//     this.foo = fooVal;
//   }
// }

// class AFactory {
//   static async create() {
//     return new A(await Promise.resolve('fooval'));
//   }
// }

// (async function generate() {
//   const aObj = await AFactory.create();
//   console.log(aObj);
// })()