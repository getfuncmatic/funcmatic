const util = require('../lib/util')

class LogPlugin {
  constructor() {
    this.name = 'log'
    this.buffer = [ ]
    this.flushed = null
  }
  
  async start(conf) {
    await util.wait(100)
  }

  async request(event, context) {
    var service = this.log.bind(this)
    return { service }
  }
  
  async end() {
    // we flush the logs
    await util.wait(100)
    this.flushed = this.buffer
    this.buffer = [ ]
  }

  log(s) {
    //console.log(`${this.name}: ${s}`)
    this.buffer.push(s)
  }
}

module.exports = LogPlugin

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