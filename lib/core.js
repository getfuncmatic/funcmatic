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

function wrap(handler) {
  return async (event, context) => {
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
    
    var ret = null
    var plugin = null
    var services = { }
    try {
      for (plugin of hooks.request) {
        var r = await plugin.request(event, context)
        if (r) {
          event = r.event || event
          context = r.context || context
          if (r.service) {
            services[plugin.name] = r.service
          }
        }
      }
    } catch (err) {
      console.error(`Error in plugin '${plugin.name}' request hook: ${err.message}`)
      await errorPlugins(err, event, context)
      throw err
    }
    try {
      ret = await handler(event, context, services)
    } catch (err) {
      console.error(`Error in user function: ${err.message}`)
      await errorPlugins(err, event, context)
      throw err
    }
    
    try {
      for (plugin of hooks.response) {
        var pluginRet = await plugin.response(event, context, ret, plugin)
        if (pluginRet) {
          ret = pluginRet
        }
      }
    // response stuff
    } catch (err) {
      console.error(`Error in plugin '${plugin.name}' response hook: ${err.message}`)
      await errorPlugins(err, event, newContext, ret)
      throw err
    }
  
    return ret
  }
}

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