const BLOCKLIST = {}

require('./util/conformance')(function (str) {
  return str.indexOf('more_functions') === 0 && !BLOCKLIST[str]
})
