var loadingIndicator = require('simple-loading-indicator')
var EventEmitter = require('events')
var _ = require('lodash')

function loadForms (div, entry, fieldValues) {
  var emitter = new EventEmitter()

  entry.formDef({}, loadForms2.bind(this, div, entry, emitter))

  return emitter
}

function loadForms2 (div, entry, emitter, err, def) {
  var spans = div.getElementsByTagName('span')

  _.forEach(spans, function (span) {
    var element = null

    if (!span) {
      // how can this happen?
      return
    }

    if (span.className == 'form-select') {
      var element = document.createElement('select')
      element.name = span.getAttribute('name')

      if (element.name in def) {
        if (!def[element.name].may_write) {
          return
        }

        _.forEach(def[element.name].values, function (value, key) {
          var option = document.createElement('option')
          option.value = key
          option.appendChild(document.createTextNode(value))
          option.selected = span.getAttribute('value') == key

          element.appendChild(option)
        })
      }
    }

    if (element) {
      span.parentNode.insertBefore(element, span)
      span.parentNode.removeChild(span)

      element.onchange = function () {
        var data = {}
        data[this.name] = this.value

        var k = this.name
        entry.save(data,
          function (err) {
            if (err) {
              alert(err)
            }

            emitter.emit('save')
          }
        )

      }.bind(element)
    }
  })

  return emitter
}

module.exports = loadForms
