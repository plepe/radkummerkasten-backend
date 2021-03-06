window.Radkummerkasten = require('../src/Radkummerkasten')
var createCsv = require('../src/createCsv')
var createGeoJson = require('../src/createGeoJson')
var createHTML = require('../src/createHTML')
var getTemplate = require('../src/getTemplate')
var Selection = require('./Selection')
var mapLayers = require('./mapLayers')
var commentedBetween = require('./commentedBetween')

var csvWriter = require('csv-write-stream')
var concat = require('concat-stream')
var stream = require('stream')
var Twig = require('twig')
var hash = require('sheet-router/hash')
var async = require('async')
var loadingIndicator = require('simple-loading-indicator')
var FileSaver = require('file-saver');
var querystring = require('querystring')
var moment = require('moment')
var scrollingElement = require('scrollingelement')
var turf = {
  inside: require('@turf/inside')
}
require('moment/locale/de')

var teaserTemplate
var pageOverviewLoaded = false
var popScrollTop = null
var preferredLayer = null
var entryOptions = {}
var currentPage = 'Overview'
var currentUrl = {}
global.filterOverview = null
window.knownEntries = {}
const step = 20

var postcodes = {}
var postcodeValues = {}
var surveys = {}
var surveyValues = {}
var states = {}
var statusValues = {}
var statusDefault = []
var view
var formDownload

var inlineForms = require('./inlineForms')

const DBApi = require('db-api')
var api

function restoreScroll(scroll) {
  if (scroll) {
    document.scrollingElement.scrollTop = scroll
  } else if (popScrollTop !== null) {
    document.scrollingElement.scrollTop = popScrollTop
  }

  popScrollTop = null
}

window.onload = function () {
  document.getElementById('version').appendChild(document.createTextNode(Radkummerkasten.version))

  // initalize modules
  new Selection()
  commentedBetween.init()

  window.addEventListener('popstate', function (event) {
    if (event.state && 'scrollTop' in event.state) {
      popScrollTop = event.state.scrollTop
    } else {
      popScrollTop = null
    }
  })
  window.addEventListener('scroll', function (event) {
    history.replaceState({ scrollTop: document.scrollingElement.scrollTop }, '', location.hash)
  })

  loadingIndicator.setActive()

  Twig.extendFilter('parameter', function (value, args) {
    if (args[0] === 'survey') {
      if (value in surveys) {
        return surveys[value]
      } else {
        return { id: value, name: value }
      }
    }
    else if (args[0] === 'states') {
      if (value in states) {
        return states[value]
      } else {
        return { id: value, name: value }
      }
    }
  })

  async.series([
    function (callback) {
      api = new DBApi('api.php', {}, (err) => {
        if (err) {
          return alert(err)
        }
        loadingIndicator.setValue(0.2)

        callback()
      })
    },
    function (callback) {
      Radkummerkasten.loadPostcodes(function (err, result) {
        if (err) {
          alert('Kann Postcodes nicht laden! ' + err)
          return
        }

        postcodes = result
        postcodes.forEach(function (postcode) {
          postcodeValues[postcode.id] = postcode.properties.NAMEK_NUM
        })
        postcodeValues[0] = 'außerhalb Wien'

        loadingIndicator.setValue(0.4)

        callback()
      })
    },
    function (callback) {
      Radkummerkasten.surveys(function (err, result) {
        if (err) {
          alert('Kann Kategorien nicht laden! ' + err)
          return
        }

        loadingIndicator.setValue(0.6)

        result.forEach(function (survey) {
          surveys[survey.id] = survey
          surveyValues[survey.id] = survey.name
        })

        callback()
      })
    },
    function (callback) {
      Radkummerkasten.states(function (err, result) {
        if (err) {
          alert('Kann Stati nicht laden! ' + err)
          return
        }

        loadingIndicator.setValue(0.8)

        result.forEach(function (state) {
          states[state.id] = state
          statusValues[state.id] = state.name
          if (state.showDefault) {
            statusDefault.push(state.id + '')
          }
        })

        callback()
      })
    },
    function (callback) {
      Radkummerkasten.checkUpdate(function () {
        loadingIndicator.setValue(1)
        callback()
      })
    },
    function (callback) {
      Radkummerkasten.initNew(api, callback)
    },
    function (callback) {
      loadingIndicator.setInactive()

      filterFormDef =
        {
          'postcode': {
            'type': 'select',
            'name': 'Postcode',
            'values': postcodeValues
          },
          'status:in': {
            'type': 'checkbox',
            'name': 'Status',
            'values': statusValues,
            'default': statusDefault
          },
          'survey': {
            'type': 'select',
            'name': 'Kategorie',
            'values': surveyValues
          },
          'comments.name:strsearch': {
            'type': 'text',
            'name': 'Autor',
          },
          'day:>=': {
            'type': 'date',
            'name': 'Erstellungsdatum ab',
          },
          'day:<=': {
            'type': 'date',
            'name': 'Erstellungsdatum bis',
          },
          'lastCommentDay:>=': {
            'type': 'date',
            'name': 'Zuletzt kommentiert ab',
          },
          'lastCommentDay:<=': {
            'type': 'date',
            'name': 'Zuletzt kommentiert bis',
          },
          'group': {
            'type': 'select',
            'name': 'Gruppieren',
            'values': {
              'postcode': 'Nach PLZ gruppieren',
              'survey': 'Nach Kategorie gruppieren',
              'status': 'Nach Status gruppieren',
            }
          },
          'order': {
            'type': 'select',
            'name': 'Sortierung',
            'default': '-lastCommentDate',
            'values': {
              '-lastCommentDate': 'Neueste Kommentare bzw. Einträge zuerst',
              '-id': 'Neueste Einträge zuerst',
              '-likes': 'Einträge mit den meisten Unterstützungen zuerst',
              '-commentsCount': 'Einträge mit den meisten Kommentaren zuerst',
              'postcode': 'Nach PLZ sortieren',
              'survey': 'Nach Kategorie sortieren'
            }
          }
        }

      call_hooks('filter-formdef', filterFormDef)

      filterOverview = new form(
        null,
        filterFormDef,
        {
          'type': 'form_chooser',
          'button:add_element': 'Filter hinzufügen / Sortierung ändern',
          'order': false,
          'empty_value': {}
        }
      )

      filterOverview.show(document.getElementById('filterOverview'))
      filterOverview.onchange = function () {
        currentUrl = filterOverview.get_data()

        call_hooks('filter-onchange', currentUrl)

        return update(false, true)
      }

      hash(newLoc)
      newLoc(location.hash)

      function newLoc (loc) {
        let m = loc.match(/^#([0-9]+)(?:\/([a-z]+))?(?:\?(.*))?$/)

        if (m) {
          currentUrl = {}
          if (m[3]) {
            currentUrl = querystring.parse(m[3])
          }

          currentUrl.id = m[1]
          currentUrl.view = m[2] || 'show'

          call_hooks('url-receive', currentUrl)
        } else {
          currentUrl = {}

          if (loc.match(/^#/)) {
            currentUrl = querystring.parse(loc.substr(1))
          }
          updateFormFromUrl(currentUrl)
        }

        _update()
      }
    }
  ])
}

function updateFormFromUrl (param) {
  call_hooks('url-receive', param)
  filterOverview.set_data(param)
}

window.update = function (force, pushState) {
  if (force) {
    api.clearCache()
  }

  _update(force, pushState)
}

function buildFilter () {
  if (currentPage === 'Show') {
    return {
      id: currentUrl.id
    }
  }

  var r = JSON.parse(JSON.stringify(filterOverview.get_data()))
  var param = {
    query: [],
    order: []
  }

  if (r === null) {
    r = {}
  }

  for (var k in filterOverview.def) {
    if (!(k in r)) {
      let def = filterOverview.def[k]

      if ('default' in def) {
        r[k] = def.default
      }
    }
  }

  call_hooks('filter-to-param', r, param)

  if ('group' in r) {
    if (r.group) {
      param.order.push(r.group)
    }

    delete r.group
  }

  if ('order' in r) {
    if (r.order) {
      param.order.push(r.order)
    }

    delete r.order
  }

  for (var k in r) {
    var v = r[k]

    if (r[k] !== null) {
      let op = '='
      let m = k.match(/^(.*):(.*)$/)
      if (m) {
        k = m[1]
        op = m[2]
      }

      if (k.match(/\./)) {
        k = k.split(/\./)
      }

      param.query.push([ k, op, v ])
    }
  }

  return param
}

function buildUrl () {
  var r = currentUrl

  if (r === null) {
    r = {}
  }

  call_hooks('url-build', r)

  return r
}

function updateUrl (pushState) {
  var ret = buildUrl()
  var param = JSON.parse(JSON.stringify(ret))
  var url = '#'

  if ('id' in param) {
    url += param.id

    if ('view' in param && param.view !== 'show') {
      url += '/' + param.view
    }

    delete param.id
    delete param.view

    if (Object.keys(param).length) {
      url += '?'
    }
  }

  url += querystring.stringify(param)
  url = url.replace(/%2C/g, ',')
  if (pushState) {
    history.pushState({ scrollTop: document.body.scrollTop }, '', url)
  } else {
    history.replaceState({ scrollTop: document.body.scrollTop }, '', url)
  }

  return ret
}

function _update (force, pushState) {
  pageOverviewLoaded = true

  var param = updateUrl(pushState)

  if (param.id) {
    currentPage = 'Show'
    pageShow(
      param.id,
      {
        viewId: param.view || 'show',
        scroll: popScrollTop
      },
      (err) => {
        if (err) {
          alert(err)
        }
      }
    )
  } else {
    currentPage = 'Overview'
    let filter = buildFilter()
    pageOverview(
      filter,
      {
        viewId: param.view || 'index',
        scroll: popScrollTop,
        group: filterOverview.get_data().group
      },
      (err) => {
        if (err) {
          alert(err)
        }
      }
    )
  }
}

window.openDownload = function () {
  document.getElementById('downloadForm').style.display = 'block'

  if (!formDownload) {
    getTemplate('downloadOptions', function (err, data) {
      call_hooks('download-options-form', data)

      if (rights && rights.markers && rights.markers.fields && rights.markers.fields.status && rights.markers.fields.status.write) {
        data.changeStatus = {
          "type": "select",
          "name": "Ändere Status",
          "help": "Status aller exportierten Einträge wird auf gewählten Status geändert.",
          "placeholder": "-- nicht ändern --",
          "values": statusValues
        }
      }

      formDownload = new form('downloadOptions', data)
      formDownload.show(document.getElementById('downloadOptions'))

      document.getElementById('downloadCancel').onclick = cancelDownload
    })
  } else {
    formDownload.resize()
  }
}

function createDownload (downloadDom, fileType, data) {
}

function cancelDownload () {
  document.getElementById('downloadForm').style.display = 'none'
}

window.submitDownloadForm = function () {
  var filter = buildFilter()
  filter.table = 'markers'

  var options = formDownload.get_data()

  call_hooks('download-options-filter', filter, options)

  getTemplate(options.view, function (err, result) {
    view = api.createView(result, { twig: Twig, split: step, leafletLayers: mapLayers() })
    view.extend({
      type: 'Leaflet',
      latitudeField: 'lat',
      longitudeField: 'lng',
      layers: mapLayers()
    })

    let globalData = JSON.parse(JSON.stringify(twigGlobal))

    if (currentPage === 'Overview' && (!options.select || options.select !== 'selected')) {
      globalData.filter = filterOverview.get_data()
      globalData.filterDef = filterOverview.def
    }

    view.set_query(filter)
    view.export(
      {
        global: globalData
      },
      function (err, result, contentType, extension) {
        var blob = new Blob([ result ], { type: contentType + ";charset=utf-8" })
        FileSaver.saveAs(blob, 'radkummerkasten.' + extension)
        document.getElementById('downloadForm').style.display = 'none'

        if (options.changeStatus) {
          let query = JSON.parse(JSON.stringify(filter))
          query.action = 'update'
          query.update = {
            'status': options.changeStatus
          }

          api.exec([ query ], function (err, result) {
            update(true)

            if (err) {
              alert(err)
            }
          })
        }
      }
    )
  })

  return false
}

window.pageShow = function (id, options, callback) {
  if (!('viewId' in options)) {
    options.viewId = 'show'
  }

  currentPage = 'Show'
  document.getElementById('menuOverview').style.display = 'none'
  document.getElementById('pageOverview').style.display = 'none'
  var menu = document.getElementById('menuShow')
  menu.style.display = 'block'
  var page = document.getElementById('pageShow')
  page.style.display = 'block'
  page.innerHTML = ''
  document.getElementById('filterShow').elements.filterId.value = id
  page.className = 'template-' + options.viewId

  loadingIndicator.setActive()

  getTemplate(options.viewId, function (err, result) {
    if (err) {
      loadingIndicator.setInactive()

      if (err.status === 404) {
        return alert("No such view '" + options.viewId + "'")
      }
      return alert("An error occured: " + err)
    }

    view = api.createView(result, { twig: Twig, split: step, leafletLayers: mapLayers() })
    view.extend({
      type: 'Leaflet',
      latitudeField: 'lat',
      longitudeField: 'lng',
      layers: mapLayers()
    })
    view.set_query({
      table: 'markers',
      id
    })
    view.on('loadend', () => {
      loadingIndicator.setValue(1)
      loadingIndicator.setInactive()
    })
    view.on('savestart', () => {
      loadingIndicator.setActive()
    })
    view.on('showEntry', (ev) => {
      call_hooks('render-entry', ev.dom, ev.entry)
    })
    view.on('save', (ev) => {
      if (ev.error) {
        alert(ev.error)
      }

      loadingIndicator.setValue(1)
      loadingIndicator.setInactive()
    })
    view.show(page, {
      global: twigGlobal
    }, (err) => {
      restoreScroll(options.scroll)
      callback(err)
    })
  })
}

window.pageOverview = function (filter, options, callback) {
  currentPage = 'Overview'
  document.getElementById('pageOverview').style.display = 'block'
  document.getElementById('pageOverview').className = 'template-' + options.viewId
  document.getElementById('menuOverview').style.display = 'block'
  document.getElementById('pageShow').style.display = 'none'
  document.getElementById('menuShow').style.display = 'none'

  var oldContent, content

  oldContent = document.getElementById('pageOverview')
  content = document.createElement('div')
  oldContent.parentNode.insertBefore(content, oldContent)
  content.id = 'pageOverview'
  content.className = 'template-' + options.viewId

  filter.table = 'markers'
  filter.offset = 0

  loadingIndicator.setActive()

  getTemplate(options.viewId, function (err, result) {
    view = api.createView(result, { twig: Twig, split: step, leafletLayers: mapLayers() })
    view.extend({
      type: 'Leaflet',
      latitudeField: 'lat',
      longitudeField: 'lng',
      layers: mapLayers()
    })
    view.set_query(filter)
    view.on('loadend', () => {
      loadingIndicator.setValue(1)
      loadingIndicator.setInactive()
    })
    view.on('savestart', () => {
      loadingIndicator.setActive()
    })
    view.on('save', (ev) => {
      if (ev.error) {
        alert(ev.error)
      }

      loadingIndicator.setValue(1)
      loadingIndicator.setInactive()
    })
    view.on('showEntry', (ev) => {
      call_hooks('render-entry', ev.dom, ev.entry)
    })
    let param = {
      global: twigGlobal
    }

    if (options.group) {
      let formatGroup = {
        postcode: '{{ entry.postcode }}',
        survey: "{{ entry.survey|dbApiGet('survey').name }}",
        status: "{{ entry.survey|dbApiGet('states').name }}"
      }

      param.group = '<h2>' + formatGroup[options.group] + '</h2>'
    }

    view.show(content, param, (err) => {
      restoreScroll(options.scroll)
      callback(err)
    })
  })

  oldContent.parentNode.removeChild(oldContent)
}
