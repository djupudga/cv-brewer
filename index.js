// Resume builder

// Read command line arguments
var argv = require('optimist')
  .usage('Usage')
  // Configuration file
  .demand('c')
  .alias('c', 'config')
  .describe('c', 'Config file')
  // Output file
  .demand('o')
  .alias('o', 'output')
  .describe('o', 'Output file')
  .argv

var _ = require('underscore')
var fs = require('fs')
var YAML = require('yamljs')
var wkhtmltopdf = require('wkhtmltopdf')

// Read config file
var config = YAML.load(argv.c)
// Check globals
if (config.globals) {
  for (var i in config.globals) {
    global[i] = config.globals[i]
  }
}
// Utils for templates
global.lines = function(text, sep) {
  return _.isArray(text)? text.join(sep): text
}

// Load and compile config
walkConfig(config)
// Generate HTML
var resumeHtml = config.template(config.resume)

// fs.writeFileSync('tmp.html', resumeHtml)
// Generate PDF
wkhtmltopdf(
  // 'tmp.html', 
  resumeHtml,
  {
    pageSize: config.pageSize || 'A4', 
    output: argv.o
  }
)
// fs.unlinkSync('tmp.html')

// Walk config to load templates and compile as necessary
function walkConfig(config) {
  var styles = ''
  config.template = _.template(fs.readFileSync(config.template).toString())
  _.each(config.styles, function(style) {
    styles += fs.readFileSync(style).toString()
  })
  config.resume.styles = styles
  config.resume.personal = YAML.load(config.resume.personal)
  walkSections(config.resume.sections)
}

// Walk section
function walkSections(sections) {
  _.each(sections, function(section) {
    loadSection(section)
  })
}

function loadSection(section) {
  if (section.sections) {
    walkSections(section.sections)
  } else {
    section.content = YAML.load(section.content)
    section.template = _.template(fs.readFileSync(section.template).toString())
  }
}

