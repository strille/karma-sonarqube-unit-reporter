var path = require('path')
var fs = require('fs')

module.exports = {
  getFilesForDescriptions: getFilesForDescriptions
}

function getFilesForDescriptions (startPaths, filter, log) {
  var ret = {}

  startPaths.forEach(function (startPathItem) {
    var files = findFilesInDir(startPathItem, filter, log)
    files.forEach(findDescriptionInFile)
  })

  function findDescriptionInFile (item, index) {
    try {
      var fileText = fs.readFileSync(item, 'utf8')
      var position = 0
      while (position !== -1) {
        position = fileText.indexOf('describe(')
        if (position !== -1) {
          var delimeter = ' '
          var len_to_delimeter = 8
          while (delimeter === ' ') {
            len_to_delimeter += 1
            delimeter = fileText[position + len_to_delimeter]
          }
          var descriptionEnd = fileText.indexOf(delimeter, position + len_to_delimeter + 1) + 1
          var describe = fileText.substring(position + len_to_delimeter + 1, descriptionEnd - 1)
          describe = describe.replace(/\\\\/g, '/')
          item = item.replace(/\\\\/g, '/').replace(/\\/g, '/')
          ret[describe] = item
          position = 0
          fileText = fileText.substring(descriptionEnd)
        }
        log.debug('-- describe: ' + describe + ' -> file: ' + item)
      }
    } catch (e) {
      log.error('Error:', e.stack)
    }
  }

  return ret
}

function findFilesInDir (startPath, filter, log) {
  var results = []

  if (!fs.existsSync(startPath)) {
    log.error('Source directory not found. ', startPath)
    return
  }

  var files = fs.readdirSync(startPath)
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i])
    var stat = fs.lstatSync(filename)
    if (stat.isDirectory()) {
      if (filename !== 'node_modules') {
        results = results.concat(findFilesInDir(filename, filter, log))
      }
    } else if (filename.endsWith(filter)) {
      results.push(filename)
    }
  }
  return results
}
