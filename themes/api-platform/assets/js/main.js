function toggleClasses(elements, open, close, toggle) {
  ;[].slice.call(elements).forEach((el) => {
    const openClasses = el.dataset[open]?.split(' ') || []
    const closeClasses = el.dataset[close]?.split(' ') || []
    const update = (classes, op) => classes.forEach((c) => el.classList[op](c))

    if (toggle) {
      update(closeClasses, 'remove')
      update(openClasses, 'add')
    } else {
      update(openClasses, 'remove')
      update(closeClasses, 'add')
    }
  })
}

function ApiPlatform() {
  const state = {
    menu: false,
    sidebar: true,
  }

  function toggleMenu(event) {
    const menuElements = document.querySelectorAll('[data-open]')
    event.preventDefault()
    state.menu = !state.menu
    toggleClasses(menuElements, 'open', 'close', state.menu)
  }

  window.toggleMenu = toggleMenu

  function toggleSidebar(event) {
    const sidebarElements = document.querySelectorAll('[data-minimize]')
    event.preventDefault()
    state.sidebar = !state.sidebar
    toggleClasses(sidebarElements, 'maximize', 'minimize', state.sidebar)
  }

  window.toggleSidebar = toggleSidebar

  function toggleSidebarMenu(event) {
    event.preventDefault()
    const target = event.target.closest('.doc-nav')
    const id = target.dataset.identifier
    if (undefined === state[id]) {
			const isOpen = 1 === parseInt(target.dataset.isOpen || 0)
      state[id] = !isOpen	
    } else {
      state[id] = !state[id]
    }

    const elements = target.querySelectorAll('[data-menu-open]')
    toggleClasses(elements, 'menuOpen', 'menuClose', state[id])
  }

  window.toggleSidebarMenu = toggleSidebarMenu

  const typeSelectedClasses = ['text-blue', 'dark:text-white', 'border-blue', 'bg-blue-black/5', 'dark:bg-blue-black/30'];
  const typeClasses = ['text-gray-400', 'dark:text-blue/60', 'border-transparent'];

  document.addEventListener("DOMContentLoaded", (event) => {
    // To use Shortcodes (https://gohugo.io/templates/shortcode-templates/) we'd need to change how this is declared in the documentation itself...
    ;[].slice.call(document.querySelectorAll('[data-code-selector]')).forEach((codeselector) => {
      const container = document.createElement('div')
      container.classList.add('mb-4', 'overflow-hidden', 'rounded-2xl', 'bg-gray-100', 'dark:bg-blue-darkest')
      const types = document.createElement('div')
      types.classList.add('flex', 'flex-wrap', '-mb-px', 'bg-gray-300/10', 'dark:bg-blue/20', 'border-b', 'border-gray-300', 'dark:border-blue-dark')

      const codes = [].slice.call(codeselector.querySelectorAll('.highlight'))
      codes.forEach((c, i) => {
        const link = document.createElement('a')
        link.classList.add('inline-block', 'py-2', 'px-6', 'border-b-2', 'font-semibold', 'text-sm', 'uppercase', 'hover:bg-blue-black/5', 'dark:hover:bg-blue-black/30', 'transition-all')
        link.setAttribute('role', 'button')

        const type = c.querySelector('[data-lang]').dataset.lang
        link.dataset.lang = type

        if (i === 0) {
          link.classList.add(...typeSelectedClasses)
        } else {
          link.classList.add(...typeClasses)
        }

        // type.classList.add()
        link.innerText = type
        link.onclick = function(event) {
          event.preventDefault()
          ;[].slice.call(types.querySelectorAll('a')).forEach((e) => {
            e.classList.remove(...typeSelectedClasses)
            e.classList.add(...typeClasses)
          })

          link.classList.add(...typeSelectedClasses)

          ;[].slice.call(container.querySelectorAll('.highlight')).forEach((e) => {
            const type = e.querySelector('[data-lang]').dataset.lang
            if (this.dataset.lang === type) {
              e.classList.remove('hidden')
              return;
            }

            e.classList.add('hidden')
          })
        }

        types.appendChild(link)
      })

      container.appendChild(types)

      codes.forEach((c) => {
        codeselector.removeChild(c)
      })

      codeselector.appendChild(container)

      codes.forEach((c, i) => {
        if (i !== 0) {
          c.classList.add('hidden')
        }
        container.appendChild(c)
      })

    })
	})
}

ApiPlatform()
