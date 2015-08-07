'use strict'

var lodash = require("lodash");
var Meteor = require("meteor-core")(lodash);
var uglify = require("uglify-js");

require("meteor-htmljs")(Meteor);
require("meteor-html-tools")(Meteor);
require("meteor-blaze-tools")(Meteor);
require("meteor-spacebars-compiler")(Meteor);


function parse(name, data)
{
  var result = {};

  function parseTemplate(name, data)
  {
    //Compile and generate entry in template map
    result[name] = Meteor.SpacebarsCompiler.codeGen(data, {isTemplate: true});
  }

  function parseTemplates(element)
  {
    // Get tag
    var tag = element.tagName;

    // Check tag
    switch(tag)
    {
      case "div":
        parseTemplate(name, element)
      break;

      case "template":
        parseTemplate(element.attrs['name'], element.children)
      break;
    }
  }

  //Parse html content
  var templates = Meteor.SpacebarsCompiler.parse(data)

  if(templates.length === 1)
    parseTemplate(name, templates[0])
  else
    templates.forEach(parseTemplates)

  return result;
}

function parseJs(data)
{
  return uglify.minify(data, {fromString: true}).code
}


exports.parseJs       = parseJs
exports.parseTemplate = parse
