const util = require('../lib/util')

class LogPlugin {
  constructor() {
    this.name = 'log-demo'
  }
  
  async start(conf) {
    await util.wait(100)
  }

  async request(event, context) {
    context['log'] = this.log.bind(this)
    return { event, context }
  }
  
  log(s) {
    console.log(`${this.name}: ${s}`)
  }
}

module.exports = new LogPlugin()

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