const util = require('../lib/util')

class DatasourcePlugin {
  
  constructor() {
    this.name = 'datasource'
    this.cachedConnection = null
    this.cache = false
  }
  
  async start(conf) {
    this.conf = conf
    this.cache = conf.cache 
    this.cachedConnection = await this.connectToDatasource(conf)
  }
  
  async request(event, context) {
    var conn = await this.connectToDatasource()
    var service = { conn }
    return { service }
  }
  
  async response(event, context, res) {
    if (!this.cache) {
      await this.disconnectFromDatasource()
      this.cachedConnection = null
    }
  }
  
  async connectToDatasource() {
    if (this.cache && this.cachedConnection && this.cachedConnection.connected) {
      return this.cachedConnection
    }
    await util.wait(100)
    this.cachedConnection = { connected: true }
    return this.cachedConnection
  }
  
  async disconnectFromDatasource() {
    await util.wait(100)
    this.cachedConnection = null
  }
}

module.exports = new DatasourcePlugin()