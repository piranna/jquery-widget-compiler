'use strict'

var fs   = require("fs");
var path = require("path");

var extend   = require('extend');
var async = require('async')

require('tosource-polyfill')

var parser = require('./parser')


function writeJS(widget, options, callback)
{
  var templates = widget.templates.toSource()
  var scripts   = widget.scripts.join('\n')

  var js =
  [
    "module.exports = function(jquery)",
    "{",
    "  var Meteor = jquery.Meteor;",
    '',
    "  var Blaze     = Meteor.Blaze;",
    "  var HTML      = Meteor.HTML;",
    "  var Spacebars = Meteor.Spacebars;",
    "",
    "  // Templates",
    "  var templates = "+templates,
    "",
    "  // Scripts",
    scripts,
    "};"
  ].join('\n');

  fs.writeFile(options.output, js, callback);
}


function processors(name, options)
{
  var charset = options.charset || 'utf8'

  var result =
  {
    templates: function(callback)
    {
      var pathName = path.resolve(options.input, name, 'index.html')

      fs.readFile(pathName, charset, function(error, data)
      {
        if(error) return callback(error);

        //If we have a preffix
//        if(prefix) name = prefix + "." + name;
        callback(null, parser.parseTemplate(name, data))
      });
    },

    script: function(callback)
    {
      var pathName = path.resolve(options.input, name, 'index.js')

      fs.readFile(pathName, charset, function(error, data)
      {
        if(error)
        {
          if(error.code !== 'ENOENT')
            return callback(error);

          return callback();
        }

        callback(null, parser.parseJs(data))
      });
    }
  }

  return result
}


function reduceFiles(memo, item, callback)
{
  extend(memo.templates, item.templates);

  var script = item.script
  if(script) memo.scripts.push(script)

  callback(null, memo)
}


function file(options, callback)
{
  async.parallel(processors(options.input, options), function(error, results)
  {
    if(error) return callback(error)

    var memo =
    {
      scripts:   [],
      templates: {}
    }

    extend(memo.templates, item.templates);

    var script = item.script
    if(script) memo.scripts.push(script)

    writeJS(memo, options, callback);
  })
}

function directory(options, callback)
{
  function mapFiles(filename, callback)
  {
    async.parallel(processors(filename, options), callback)
  }

  function mapFiles_result(error, results)
  {
    if(error) return callback(error)

    var memo =
    {
      scripts  : [],
      templates: {}
    }

    async.reduce(results, memo, reduceFiles, reduceFiles_result)
  }

  function reduceFiles_result(error, result)
  {
    if(error) return callback(error)

    writeJS(result, options, callback);
  }


  fs.readdir(options.input, function(error, files)
  {
    if(error) return callback(error)

    async.map(files, mapFiles, mapFiles_result)
  })
}


exports.file      = file
exports.directory = directory
