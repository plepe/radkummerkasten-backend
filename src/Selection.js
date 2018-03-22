class Selection {
  constructor () {
    this.list = []

    let menuTop = document.getElementById('menu-top')
    if (menuTop) {
      let li = document.createElement('li')

      let a = document.createElement('a')
      a.href = '#selected=1'
      a.appendChild(document.createTextNode('Auswahl: '))
      li.appendChild(a)

      this.domStatus = document.createElement('span')
      this.updateStatus()
      a.appendChild(this.domStatus)

      menuTop.appendChild(li)
    }

    register_hook('render-teaser', this.renderHook.bind(this))
    register_hook('render-show', this.renderHook.bind(this))
    register_hook('filter-formdef', formDef => {
      formDef.selected = {
        'type': 'select',
        'name': 'Auswahl',
        'values': {
          '1': 'nur ausgewählte'
        }
      }
    })
    register_hook('filter-to-param', (filter, param) => {
      if ('selected' in filter) {
        if (filter.selected === '1') {
          param.query.push([ 'id', 'in', this.list ])
        }

        delete filter.selected
      }
    })
  }

  updateStatus () {
    if (this.domStatus) {
      this.domStatus.innerHTML = this.list.length
    }
  }

  renderHook (div, data) {
    let menu = div.getElementsByClassName('menu')
    if (!menu.length) {
      return
    }

    let li = document.createElement('li')

    let a = document.createElement('a')
    a.appendChild(document.createTextNode('Füge zu Auswahl hinzu'))
    a.href = '#'
    a.onclick = () => {
      if (this.inList(data.id)) {
        this.del(data.id)
        a.innerHTML = ''
        a.appendChild(document.createTextNode('Füge zu Auswahl hinzu'))
      } else {
        this.add(data.id)
        a.innerHTML = ''
        a.appendChild(document.createTextNode('Aus Auswahl entfernen'))
      }
      this.updateStatus()
      return false
    }
    li.appendChild(a)

    menu[0].appendChild(li)
  }

  add (id) {
    this.list.push(id)
  }

  del (id) {
    let p = this.list.indexOf(id)

    if (p !== -1) {
      this.list.splice(p, 1)
    }
  }

  inList (id) {
    return this.list.indexOf(id) !== -1
  }

  getList () {
    return this.list
  }
}

module.exports = Selection
