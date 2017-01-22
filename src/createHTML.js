var Radkummerkasten = require('./Radkummerkasten')
var async = require('async')
var jsdom = require('jsdom').jsdom
global.window = jsdom().defaultView
global.document = window.document

module.exports = function (filter, pipe, callback) {
  var entries = []
  var renderParam = {
  }

  pipe.write('<html><head></head><body>\n')

  Radkummerkasten.getEntries(
    filter,
    function (err, entry) {
      if (err) {
        throw (err)
      }

      entries.push(entry)
    },
    function (err) {
      if (err) {
        throw (err)
      }

      async.each(
        entries,
        function (entry, callback) {
          entry.renderHTML(renderParam, function (err, result) {
            pipe.write(result, null, '  ')

            callback()
          })
        },
        function (err) {
          pipe.write('</body></html>')
        }
      )
    }
  )
}
