module.exports = {
  use,
  wrap,
  installedPlugins,
  installedHooks,
  clear
}

var started = false

var hooks = {
  start: [ ],
  service: [ ],
  request: [ ],
  response: [ ],
  error: [ ]
}

var plugins = {
  
}

function installedHooks() {
  return hooks
}

function installedPlugins() {
  return plugins
}

function clear() {
  started = false
  hooks = {
    start: [ ],
    //service: [ ],
    request: [ ],
    response: [ ],
    error: [ ]
  }
  plugins = { }
}

// CHANGE: we don't actually call start here and so change use to not be async
// we call start async in the actual wrap if the function is a cold start. then we run them await in order
// this way .use can happen at class level synchronously
// 
// var coldStart = true;
// console.log("This line of code exists outside the handler, and only executes on a cold start");


// exports.myHandler = function(event, context, callback) {
//   if (coldStart) {
//     console.log("First time the handler was called since this function was deployed in this container");
//   }
//   coldStart = false;

//   ...

//   callback(...);
// }

function use(plugin, config) {
  var name = config.name || plugin.name
  if (plugin.start && typeof(plugin.start) == 'function') {
    hooks.start.push({ plugin, config })
  }
  // if (plugin.service && typeof(plugin.service) == 'function') {
  //   hooks.service.push(plugin)
  // }
  if (plugin.request && typeof(plugin.request) == 'function') {
    hooks.request.push(plugin)
  }
  if (plugin.response && typeof(plugin.response) == 'function') {
    hooks.response.push(plugin)
  }
  if (plugin.error && typeof(plugin.error) == 'function') {
    hooks.error.push(plugin)
  }
  // try {
  //   await plugin.start(config) 
  //   //return plugin
  // } catch (err) {
  //   console.error(`Error initializing plugin: ${err.message}`)
  //   await errorPlugins(err)
  //   throw err
  // }
  return this
}

// direct invocation which is more useful for testing
async function invoke(event, context) {

}

function wrap(handler) {
  return async (event, context) => {
    event = event || { }
    context = context || { }
    if (!started) {
      try {
        for (var start of hooks.start) {
          var plugin = start.plugin
          var config = start.config
          await plugin.start(config)
        }
        started = true
      } catch (err) {
        console.error(`Error initializing plugin: ${err.message}`)
        await errorPlugins(err)
        throw err
      }
    }
    var originalEvent = Object.freeze(Object.assign({}, event))
    var originalContext = Object.freeze(Object.assign({}, context))
    context.originalEvent = originalEvent
    context.originalContext = originalContext
   
    var services = { }
    // // Plugin Service Hooks
    // try {
    //   for (var plugin of hooks.service) {
    //     var service = plugin.service(event, context)
    //     services[plugin.name] = service
    //   }
    // } catch (err) {
    //   console.error(`Error in plugin '${plugin.name}' service hook: ${err.message}`)
    //   await errorPlugins(err, event, context)
    //   throw err
    // }
    
    // Plugin Request Hooks
    try {
      for (var plugin of hooks.request) {
        var req = await plugin.request(event, context, services)
        if (req) {
          event = req.event || event
          context = req.context || context
          if (req.service) {
            services[plugin.name] = req.service
          }
        }
      }
    } catch (err) {
      console.error(`Error in plugin '${plugin.name}' request hook: ${err.message}`)
      await errorPlugins(err, event, context)
      throw err
    }

    // User Handler
    var ret = null
    try {
      ret = await handler(event, context, services)
    } catch (err) {
      console.error(`Error in user function: ${err.message}`)
      await errorPlugins(err, event, context)
      throw err
    }
    
    // Plugin Response Hooks
    try {
      for (plugin of hooks.response) {
        var pluginRet = await plugin.response(event, context, ret, plugin)
        if (pluginRet) {
          ret = pluginRet
        }
      }
    } catch (err) {
      console.error(`Error in plugin '${plugin.name}' response hook: ${err.message}`)
      await errorPlugins(err, event, newContext, ret)
      throw err
    }
  
    return ret
  }
}

// Plugin Error Hooks
async function errorPlugins(err, event, context, res) {
  for (var plugin of hooks.error) {
    try {
      await plugin.error(err, event, context, res)
    } catch (err) {
      console.error(`Plugin '${plugin.name}' error handler threw an error: ${err.message}`)
      console.error(err.stack)
    }
  }
}