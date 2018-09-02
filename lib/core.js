class Funcmatic {
  constructor(config) {
    this.init()
  }
  init() {
    this.started = false
    this.plugins = [ ]
    this.hooks = {
      start: [ ],
      service: [ ],
      request: [ ],
      response: [ ],
      error: [ ],
      end: [ ]
    }
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
  
  use(plugin, config) {
    var name = config.name || plugin.name
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
    
    // Start Hooks
    if (!this.started) {
      await this.startPlugins(this.hooks.start)
      this.started = true
    }
  
    // Plugin Request Hooks
    var request = await this.requestPlugins(this.hooks.request, event, context, services)
    event = request.event
    context = request.context
    services = request.services
  
    // User Handler
    try {
      response = await handler(event, context, services)
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
      for (var start of plugins) {
        var plugin = start.plugin
        var config = start.config
        await plugin.start(config)
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
        await plugin.end()
      } catch (err) {
        console.error(`Plugin '${plugin.name}' end handler threw an error: ${err.message}`)
        await this.errorPlugins(err)
      }
    }
  }

  async teardown() {
    //console.log("teardown is noop for now")
  }
}

function createFuncmatic(config) {
  return new Funcmatic(config)
}

module.exports = createFuncmatic

// module.exports = {
//   use,
//   wrap,
//   installedPlugins,
//   installedHooks,
//   clear
// }

// var started = false

// var hooks = {
//   start: [ ],
//   service: [ ],
//   request: [ ],
//   response: [ ],
//   error: [ ],
//   end: [ ]
// }

// var plugins = {
  
// }

// function installedHooks() {
//   return hooks
// }

// function installedPlugins() {
//   return plugins
// }

// function clear() {
//   started = false
//   hooks = {
//     start: [ ],
//     request: [ ],
//     response: [ ],
//     error: [ ],
//     end: [ ]
//   }
//   plugins = { }
// }

// // CHANGE: we don't actually call start here and so change use to not be async
// // we call start async in the actual wrap if the function is a cold start. then we run them await in order
// // this way .use can happen at class level synchronously
// // 
// // var coldStart = true;
// // console.log("This line of code exists outside the handler, and only executes on a cold start");


// // exports.myHandler = function(event, context, callback) {
// //   if (coldStart) {
// //     console.log("First time the handler was called since this function was deployed in this container");
// //   }
// //   coldStart = false;

// //   ...

// //   callback(...);
// // }

// function use(plugin, config) {
//   var name = config.name || plugin.name
//   if (plugin.start && typeof(plugin.start) == 'function') {
//     hooks.start.push({ plugin, config })
//   }
//   if (plugin.request && typeof(plugin.request) == 'function') {
//     hooks.request.push(plugin)
//   }
//   if (plugin.response && typeof(plugin.response) == 'function') {
//     hooks.response.push(plugin)
//   }
//   if (plugin.error && typeof(plugin.error) == 'function') {
//     hooks.error.push(plugin)
//   }
//   if (plugin.end && typeof(plugin.end) == 'function') {
//     hooks.end.push(plugin)
//   }
//   return this
// }

// // direct invocation which is more useful for testing
// // runs through entire 
// async function invoke(event, context, handler) {
//   event = event || { }
//   context = context || { }
//   var services = { }
//   var response = null 

//   var originalEvent = Object.freeze(Object.assign({}, event))
//   var originalContext = Object.freeze(Object.assign({}, context))
//   context.originalEvent = originalEvent
//   context.originalContext = originalContext
  
//   // Start Hooks
//   if (!started) {
//     await startPlugins(hooks.start)
//     started = true
//   }

//   // Plugin Request Hooks
//   var request = await requestPlugins(hooks.request, event, context, services)
//   event = request.event
//   context = request.context
//   services = request.services

//   // User Handler
//   try {
//     response = await handler(event, context, services)
//   } catch (err) {
//     console.error(`Error in user function: ${err.message}`)
//     await errorPlugins(err, event, context)
//     throw err
//   }
  
//   // Plugin Response Hooks
//   response = await responsePlugins(hooks.response, event, context, response, services)

//   // End Hooks
//   await endPlugins(hooks.end)

//   return response
// }

// function wrap(handler) {
//   return async (event, context) => {
//     return await invoke(event, context, handler)
//   }
// }