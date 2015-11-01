var { ToggleButton } = require('sdk/ui/button/toggle')
var Panel = require('sdk/panel').Panel
var Request = require('sdk/request').Request
var Storage = require('sdk/simple-storage').storage
var Url = require('sdk/url').URL
var Base64 = require('sdk/base64')
var { setInterval } = require('sdk/timers')
var tabs = require('sdk/tabs')

var button = ToggleButton({
  id: 'button',
  label: 'Discourse Notifications',
  icon: './addon.png',
  onChange: function (state) {
    if (state.checked) {
      panel.show({
        position: button
      })
    }
  }
})

var panel = Panel({
  contentURL: './panel.html',
  contentScriptFile: [
    './message_bus/assets/jquery-1.8.2.js',
    './message_bus/assets/message-bus.js',
    './panel.js'
    ],
  onHide: function () {
    button.state('window', { checked: false })
  }
})

if (Storage.instances) {
  for (hash in Storage.instances) {
    Storage.instances[hash].notifications = undefined
    createInstance(Storage.instances[hash])
  }
} else {
  Storage.instances = {}
}

function createInstance (instance) {
  panel.port.emit('createInstance', instance)
  getNotifications(instance)
  setInterval(function () {
    getNotifications(instance)
  }, 60 * 1000)
}

function getNotifications (instance) {
  Request({
    url: instance.url + 'notifications.json',
    onComplete: function (res) {
      var notifications = res.json
      if (notifications.errors) {
        panel.port.emit('error', { error: 'signin' })
      } else if (JSON.stringify(Storage.instances[instance.hash].notifications) == JSON.stringify(notifications.notifications)) {
      } else {
        Storage.instances[instance.hash].notifications = instance.notifications = notifications.notifications
        panel.port.emit('notifications', instance)
      }
    }
  }).get()
}

panel.port.on('addInstance', function (url) {
  url = Url(url)
  var hash = Base64.encode(url.host)
  if (Storage.instances[hash]) {
    panel.port.emit('addInstanceError', { error: 'exists' })
  } else {
    Request({
      url: url.href,
      onComplete: function (res) {
        var regex = /<link rel="icon".*href="([^"]*)"/i
        var result = regex.exec(res.text)
        var faviconUrl = result[1]
        var instance = {}
        instance.hash = hash
        instance.url = url.href
        instance.faviconUrl = faviconUrl
        Storage.instances[hash] = instance
        panel.port.emit('addInstanceSuccess')
        createInstance(instance)
      }
    }).get()
  }
})

panel.port.on('badgeValue', function (value) {
  button.badge = value
})

panel.port.on('notificationClick', function (url) {
  tabs.open(url)
})
