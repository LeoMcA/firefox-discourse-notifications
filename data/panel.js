MessageBus.baseUrl = 'http://discourse.local/'
MessageBus.start()
MessageBus.subscribe("/notification/2", function (data) { console.err(data) })

// stores

var unread = {}
unread.global = 0

// ui

$('#add-instance').addEventListener('click', handleSidebarButtonClick)

$('#settings').addEventListener('click', handleSidebarButtonClick)

// ui/add-instance-panel

$('#add-instance-panel form').addEventListener('submit', function (e) {
  e.preventDefault()
  portEmit('addInstance', $('input', e.target).value)
})

// ports

self.port.on('addInstanceSuccess', function () {
  $('#add-instance-panel form').reset()
})

self.port.on('addInstanceError', function (e) {
  console.error('Error: ' + e.error)
})

self.port.on('createInstance', handleCreateInstance)

self.port.on('notifications', handleNotifications)

function portEmit (name, data) {
  self.port.emit(name, data)
}

// helper functions

function incUnread (hash) {
  ++unread.global
  ++unread[hash]
  updateUnread(hash)
}

function decUnread (hash) {
  --unread.global
  --unread[hash]
  updateUnread(hash)
}

function resetUnread (hash) {
  unread.global -= unread[hash]
  unread[hash] = 0
  updateUnread(hash)
}

function updateUnread (hash) {
  // update global count in ui
  if (!unread.global) // if (unread == 0)
    portEmit('badgeValue', undefined)
  else
    portEmit('badgeValue', unread.global)
  // update instance count in ui
  var button = document.getElementById(hash)
  $('.badge', button).innerHTML = unread[hash]
  if (!unread[hash])
    button.classList.remove('notifications')
  else
    button.classList.add('notifications')
}

function handleSidebarButtonClick (e) {
  var hash = e.currentTarget.id
  $('.active').classList.remove('active')
  document.getElementById(hash).classList.add('active')
  $('.active-panel').classList.remove('active-panel')
  document.getElementById(hash + '-panel').classList.add('active-panel')
}

function handleCreateInstance (instance) {
  unread[instance.hash] = 0
  // create notification panel
  $('#main').insertAdjacentHTML('beforeend', '<div id="' + instance.hash + '-panel" class="notifications"></div>')
  // create sidebar button
  $('#instances').insertAdjacentHTML('beforeend', '<button id="' + instance.hash + '"><div class="badge"></div><img src="' + instance.faviconUrl + '"></button>')
  var button = document.getElementById(instance.hash)
  button.addEventListener('click', handleSidebarButtonClick)
}

function handleNotifications (instance) {
  var panel = document.getElementById(instance.hash + '-panel')
  panel.innerHTML = ''
  resetUnread(instance.hash)
  for (notification of instance.notifications) {
    panel.insertAdjacentHTML('beforeend', '<a href="' + instance.url + 't/' + notification.slug + '/' + notification.topic_id + '/' + notification.post_number + '" target="_blank" data-instance-hash="' + instance.hash + '">' + returnNotificationHTML(notification) + '</a>')
    var link = $('a:last-child', panel)
    link.addEventListener('click', handleNotificationClick)
    if (!notification.read) {
      link.classList.add('unread')
      incUnread(instance.hash)
    }
  }
}

function handleNotificationClick (e) {
  e.preventDefault()
  var t = e.currentTarget
  if(t.classList.contains('unread'))
    decUnread(t.dataset.instanceHash, true)
  t.classList.remove('unread')
  portEmit('notificationClick', t.href)
}

function returnNotificationHTML (notification) {
  switch (notification.notification_type) {
    case 1:
      //mentioned
      return '<i title="mentioned" class="fa fa-at"></i><p><span>' + notification.data.display_username + '</span> ' + notification.data.topic_title + '</p>'
      break
    case 2:
      //replied
      return '<i title="replied" class="fa fa-reply"></i><p><span>' + notification.data.display_username + '</span> ' + notification.data.topic_title + '</p>'
      break
    case 3:
      //quoted
      return '<i title="quoted" class="fa fa-quote-right"></i><p><span>' + notification.data.display_username + '</span> ' + notification.data.topic_title + '</p>'
      break
    case 4:
      //edited
      return '<i title="edited" class="fa fa-pencil"></i><p><span>' + notification.data.display_username + '</span> ' + notification.data.topic_title + '</p>'
      break
    case 5:
      //liked
      return '<i title="liked" class="fa fa-heart"></i><p><span>' + notification.data.display_username + '</span> ' + notification.data.topic_title + '</p>'
      break
    case 6:
      //private_message
      return '<i title="private message" class="fa fa-envelope-o"></i><p><span>' + notification.data.display_username + '</span> ' + notification.data.topic_title + '</p>'
      break
    case 7:
      //invited_to_private_message
      return '<i title="private message" class="fa fa-envelope-o"></i><p><span>' + notification.data.display_username + '</span> ' + notification.data.topic_title + '</p>'
      break
    case 8:
      //invitee_accepted
      return '<i title="accepted your invitation" class="fa fa-user"></i><p><span>' + notification.data.display_username + '</span> accepted your invitation</p>'
      break
    case 9:
      //posted
      return '<i title="replied" class="fa fa-reply"></i><p><span>' + notification.data.display_username + '</span> ' + notification.data.topic_title + '</p>'
      break
    case 10:
      //moved_post
      return '<i title="moved post" class="fa fa-sign-out"></i><p><span>' + notification.data.display_username + '</span> moved ' + notification.data.topic_title + '</p>'
      break
    case 11:
      //linked
      return '<i title="linked post" class="fa fa-arrow-left"></i><p><span>' + notification.data.display_username + '</span> ' + notification.data.topic_title + '</p>'
      break
    case 12:
      //granted_badge
      return '<i title="badge granted" class="fa fa-certificate"></i><p>Earned \'' + notification.data.badge_name + '\'</p>'
      break
    case 13:
      //invited_to_topic
      return '<i title="invited to topic" class="fa fa-hand-o-right"></i><p><span>' + notification.data.display_username + '</span> ' + notification.data.topic_title + '</p>'
      break
    default:
      return ''
  }
}

function $ (query, element) {
  if (!element)
    element = document
  return element.querySelector(query)
}
