const util = require('../lib/util')

class NotifierPlugin {
  constructor() {
    this.name = 'notifier-demo'
  }
  
  async start(conf) {
    this.conf = conf
  }

  async request(event, context, services) {
    context.notify = this.notify.bind(this)
    return { event, context, services }
  }
  
  async error(err, event, context, res) {
    this.err = err
    return await this.notify(err)
  }
  
  async notify(err) {
    await util.wait(100)
    return true
  }
}

module.exports = new NotifierPlugin()

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