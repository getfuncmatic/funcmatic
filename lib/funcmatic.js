class Funcmatic {
  constructor(config) {
    this.init()
  }
  init() {
    this.started = false
    this.pluginClasses = [ ]
    this.plugins = [ ]
    this.hooks = {
      start: [ ],
      service: [ ],
      request: [ ],
      response: [ ],
      error: [ ],
      end: [ ]
    },
    this.env = { }
    // hardcoded setting to 
    // export stageVariables into process.env
    this.exportStageVariables = true
    this.stageVariables = { }
    // optionally expire 
    // 0: means no expiration
    this.expiry = 0
    this.expiresAt = null
  }

  setExpiration(seconds) {
    this.expiry = seconds
  }

  calcExpiresAt(t) {
    t = t || (new Date()).getTime()
    return t + (this.expiry * 1000)
  }

  isColdStart(t) {
    t = t || (new Date()).getTime()
    // true cold start (never been started)
    if (!this.started) return true
    // treat as cold start because expired
    if (this.expiresAt && this.expiresAt <= t) {
      return true
    }
    return false 
  }

  installedHooks() {
    return this.hooks
  }

  installedPlugins() {
    return this.plugins
  }

  getPlugin(name) {
    for (var plugin of this.plugins) {
      if (plugin.name == name) {
        return plugin
      }
    }
    return null
  }
  
  clear() {
    this.init()
  }
  
  clone() {
    var funcmaticClone = createInstance()
    for (var { PluginClass, config } of this.pluginClasses) {
      funcmaticClone.use(PluginClass, config)
    }
    return funcmaticClone
  }

  use(PluginClass, config) {
    config = config || { }
    this.pluginClasses.push({ PluginClass, config })
    var plugin = new PluginClass() 
    plugin.name = config.name || plugin.name
    this.plugins.push(plugin)
    if (plugin.start && typeof(plugin.start) == 'function') {
      this.hooks.start.push({ plugin, config })
    }
    if (plugin.request && typeof(plugin.request) == 'function') {
      this.hooks.request.push(plugin)
    }
    if (plugin.response && typeof(plugin.response) == 'function') {
      this.hooks.response.push(plugin)
    }
    if (plugin.error && typeof(plugin.error) == 'function') {
      this.hooks.error.push(plugin)
    }
    if (plugin.end && typeof(plugin.end) == 'function') {
      this.hooks.end.push(plugin)
    }
    return this
  }

  async invoke(event, context, handler) {
    event = event || { }
    context = context || { }
    var services = { }
    var response = null 
  
    var originalEvent = Object.freeze(Object.assign({}, event))
    var originalContext = Object.freeze(Object.assign({}, context))
    context.originalEvent = originalEvent
    context.originalContext = originalContext
    
    // If there are stageVariables we put them into process.env
    // this means that stageVariables will override the user lambda env variables
    if (this.exportStageVariables && event.stageVariables) {
      this.stageVariables = event.stageVariables
      for (var key in event.stageVariables) {
        process.env[key] = event.stageVariables[key]
      }
    }

    // Start Hooks
    if (this.isColdStart()) {
      await this.startPlugins(this.hooks.start)
      this.started = true
      if (this.expiry) {
        this.expiresAt = this.calcExpiresAt()
        console.log("SET EXPIREAT", this.expiry, this.expiresAt, (new Date()).getTime())
      }
    }
  
    // Plugin Request Hooks
    var request = await this.requestPlugins(this.hooks.request, event, context, services)
    event = request.event
    context = request.context
    services = request.services
  
    // User Handler
    try {
      response = await handler(event, context, services) 
      response = response || { }
    } catch (err) {
      console.error(`Error in user function: ${err.message}`)
      await this.errorPlugins(err, event, context)
      await this.endPlugins(this.hooks.end)
      throw err
    }
    
    // Plugin Response Hooks
    response = await this.responsePlugins(this.hooks.response, event, context, response, services)
  
    // End Hooks
    await this.endPlugins(this.hooks.end)
  
    return response
  }

  wrap(handler) {
    var f = async (event, context) => {
      return await this.invoke(event, context, handler)
    }
    return f.bind(this)
  }

  async startPlugins(plugins) {
    try {
      // we initialize env by merging process.env
      this.env = Object.assign(this.env, process.env)
      for (var start of plugins) {
        var plugin = start.plugin
        var config = start.config || { }  // config can be null
        // config can be a function e.g. 
        // so that statements like "process.env.MY_ENV" 
        // are bound at runtime
        if (typeof(config) === 'function') {
          config = config(this.env) // env => { ... }
        }
        await plugin.start(config, this.env)
      }
    } catch (err) {
      console.error(`Error initializing plugin: ${err.message}`)
      await this.errorPlugins(err)
      await this.endPlugins(this.hooks.end)
      throw err
    }
  }

  async requestPlugins(plugins, event, context, services) {
    var plugin = null
    try {
      for (plugin of plugins) {
        var req = await plugin.request(event, context, services)
        if (req) {
          event = req.event || event
          context = req.context || context
          if (req.service) {
            services[plugin.name] = req.service
          }
        }
      }
      return { event, context, services }
    } catch (err) {
      console.error(`Error in plugin '${plugin.name}' request hook: ${err.message}`)
      await this.errorPlugins(err, event, context)
      await this.endPlugins(this.hooks.end) 
      throw err
    }
  }

  async responsePlugins(plugins, event, context, response, services) {
    var plugin = null
    try {
      for (plugin of plugins) {
        var pluginRet = await plugin.response(event, context, response, services)
        response = pluginRet || response
      }
      return response
    } catch (err) {
      console.error(`Error in plugin '${plugin.name}' response hook: ${err.message}`)
      await this.errorPlugins(err, event, context, response)
      await this.endPlugins(this.hooks.end)
      throw err
    }
  }

  // Plugin Error Hooks
  async errorPlugins(err, event, context, response) {
    var plugin = null
    for (plugin of this.hooks.error) {
      try {
        await plugin.error(err, event, context, response)
      } catch (err) {
        console.error(`Plugin '${plugin.name}' error handler threw an error: ${err.message}`)
        console.error(err.stack)
      }
    }
  }

  async endPlugins(plugins) {
    var plugin = null
    for (plugin of plugins) {
      try {
        await plugin.end({ })
      } catch (err) {
        console.error(`Plugin '${plugin.name}' end handler threw an error: ${err.message}`)
        await this.errorPlugins(err)
      }
    }
  }

  // Currently, only used for testing when we want modules to clean up after themselves
  // e.g. after a test finishes
  async teardown() {
    var plugin = null 
    for (plugin of this.hooks.end) {
      try {
        await plugin.end({ teardown: true })
      } catch (err) {
        console.error(`Plugin '${plugin.name}' end handler threw an error in teardown: ${err.message}`)
        await this.errorPlugins(err)
      }
    }
  }
}

function createInstance(config) {
  return new Funcmatic(config)
}

// Create the default instance to be exported
var funcmatic = createInstance()

// Expose Funcmatic class
funcmatic.Funcmatic = Funcmatic

// Factory for creating new instances
funcmatic.create = function create(instanceConfig) {
  return createInstance(instanceConfig)
}

module.exports = funcmatic
//module.exports.default = funcmatic