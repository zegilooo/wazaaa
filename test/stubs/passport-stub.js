const LAYER_ID = '::passport:stub'

function stubPassport (app) {
  const stack = app._router.stack
  if (!stack.some((layer) => layer.name === LAYER_ID)) {
    stack.unshift({
      handle: stubbedPassportMiddleware,
      handle_request: stubbedPassportMiddleware,
      match: () => true,
      name: LAYER_ID,
      path: ''
    })
  }

  let activeUser = null

  return {
    login,
    logIn: login,
    logout,
    logOut: logout,
    uninstall: uninstalledStubbedPassportMiddleware
  }

  function login (user) {
    activeUser = user
  }

  function logout () {
    activeUser = null
  }

  function stubbedPassportMiddleware (req, res, next) {
    const passport = {
      deserializeUser (user, req, done) { done(null, user) },
      serializeUser (user, req, done) { done(null, user) },
      _userProperty: 'user',
      _key: 'passport'
    }

    Object.defineProperty(req, '_passport', {
      get () {
        return {
          get instance () { return passport },
          get session () { return { user: activeUser } }
        }
      }
    })
    next()
  }

  function uninstalledStubbedPassportMiddleware () {
    const indices = stack.reduce((acc, layer, index) => {
      if (layer.name === LAYER_ID) {
        acc.push(index)
      }
      return acc
    }, [])
    indices.reverse().forEach((index) => stack.splice(index, 1))
  }
}

export { stubPassport as stub }
export default stubPassport
