function toUrl (r) {
  if ('commentedBetween' in r) {
    r.commentedBetween = (r.commentedBetween['>='] || '') + '..' + (r.commentedBetween['<='] || '')
  }
}

module.exports = {
  init () {
    register_hook('filter-onchange', toUrl)

    register_hook('filter-formdef', formDef => {
      formDef.commentedBetween =
        {
          'type': 'form',
          'name': 'Kommentiert zwischen',
          'def': {
            '>=': {
              'type': 'date',
              'name': 'ab'
            },
            '<=': {
              'type': 'date',
              'name': 'bis'
            }
          }
        }
    })

    register_hook('url-receive', url => {
      if ('commentedBetween' in url) {
        let value = url.commentedBetween.split(/\.\./)
        if (value.length == 2) {
          url.commentedBetween = {
            '>=': value[0],
            '<=': value[1]
          }
        } else {
          delete url.commentedBetween
        }
      }
    })
  }
}
