'use strict'

var fs       = require("fs");
var path     = require("path");
var lodash   = require("lodash");
var uglify   = require("uglify-js");
var Meteor   = require("meteor-core")(lodash);
var async = require('async');

require("meteor-htmljs")(Meteor);
require("meteor-html-tools")(Meteor);
require("meteor-blaze-tools")(Meteor);
require("meteor-spacebars-compiler")(Meteor);

function parse(data) {
	var num = 0;
	var scripts = "";
	var links = "";
	var templates = "";
	var styles = "";
	//Parse html content
	var html = Meteor.SpacebarsCompiler.parse(String(data));
	var i;
	//Now parse all elements
	for (i=0;i<html.length;++i) {
		//Get tag name
		var tag = html[i].tagName;
		//Check
		if (tag) {
			//Check tag name
			switch(tag) {
				case "script":
					try {
						//One more script
						num++;
						//Parse script to check if there is any syntax error
						uglify.parse(html[i].children[0]);
						//get content
						scripts += html[i].children[0];
					} catch (e) {
						console.error(e.message);
						console.error("script:"+num+" line: "+e.line+" pos:"+e.pos);
						//Get line
						var ini = html[i].children[0].lastIndexOf("\n",e.pos);
						var fin = html[i].children[0].indexOf("\n",e.pos);
						//Put it
						console.error(html[i].children[0].substring(ini,fin).replace("\t"," "));
						console.error(Array(e.pos-ini).join(" ")+"^");
						return;
					}
					break;
				case "template":
					//Compile and generate entry in template map
					templates += "\ttemplates['" + html[i].attrs['name'] + "'] = " + Meteor.SpacebarsCompiler.codeGen(html[i].children, {isTemplate: true}) + ";\r\n";
					break;
				case "link":
					links += "\tjquery('<link/>')";
					for (k in html[i].attrs)
						links += ".attr('"+k+"','"+html[i].attrs[k]+"')";
					links += ".appendTo(head);\r\n";
					break;
				case "style":
					//TODO: parse style for errors?
					styles += html[i].children[0];
					break;
				default:
					console.log("Ignoring unkown tag: " + tag);
			}
		}
	}
	//Return widget
	return {links: links, templates: templates, scripts: scripts, styles: styles };
}

module.exports =
{
	file : function (options) {
		fs.readFile(options.input, options.charset, function (err,data) {
			if (err) 
				return console.log("Error opening input widget file " +err);
			var js = "module.exports = function(jquery) {\r\n";
			js += "\tvar Meteor = jquery.Meteor;\r\n";
			js += "\tvar HTML = Meteor.HTML;\r\n";
			js += "\tvar Blaze = Meteor.Blaze;\r\n";
			js += "\tvar Spacebars = Meteor.Spacebars;\r\n";
			js += "\tvar templates = {};\r\n";
			//Parse HTML web widget
			var widget = parse(data);
			js += "\t//Links\r\n";
			js += widget.links;
			js += "\t//Templates\r\n";
			js += widget.templates;
			js += "\t//Scripts\r\n";
			js += widget.scripts;
			js += "};\r\n";	
			//Write JS to file
			fs.writeFile(options.output,js,{flags:'w'}, function(err) {
				if(err) 
					return console.log("Error writing output js file "+ err);
				console.log("done!");
			}); 
			//Write css to file
			fs.writeFile(options.css,widget.styles,{flags:'w'}, function(err) {
				if(err) 
					return console.log("Error writing output css file "+ err);
				console.log("done!");
			}); 
		});
	},
	directory : function (options, callback) {
		//JS file header
		var js = "module.exports = function(jquery) {\r\n";
		js += " var Meteor = jquery.Meteor;\r\n";
		js += "	var HTML = Meteor.HTML;\r\n";
		js += "	var Blaze = Meteor.Blaze;\r\n";
		js += "	var Spacebars = Meteor.Spacebars;\r\n";
		//CSS
		var css = "";
		//Traverse dir
		var walk = function(dir,recursive,prefix, cb) {
			var files,i;
			try {
				//Get files
				files = fs.readdirSync(dir);
			} catch(err) {
				//Exit
				cb({
					message: "Accessing directory with input widget files for " + dir,
					error: err
				});

				// return;
			}
			//Log
			console.log("Processing directory:" + dir);
			//For each file in dir
			for(i=0;i<files.length;++i) {
				//Get file name
				var name = files[i];
				//Get full path
				var file = path.join(dir,name);
				//Get file stats
				var stats = fs.statSync(file);
				//Check if it is a directory
				if (stats.isDirectory()) {
					//If we are recursing
					if (recursive)
						//Append files in it
						walk(file,recursive,(prefix.length?prefix+".":"")+name);
				//if it is a widget
				} else if (stats.isFile() && path.extname(file)===".html") {
					//Get widget name
					var widget = path.basename(name,".hbs");
					//If we have a preffix
					if (prefix.length)
						//Prepend
						widget = prefix + "." + widget;
					//Log
					console.log("appending widget '" + widget +"'");
					//Read data
					var data = fs.readFileSync(file, 'utf8');
					//Parse HTML web widget
					var tree = parse(data);
					//Write closure
					js += "/*** " + widget + " **/\r\n";
					js += "(function(){\r\n";
					js += "\t//Links\r\n";
					js += tree.links;
					js += "\t//Templates\r\n";
					js += "\tvar templates = {};\r\n";
					js += tree.templates;
					js += "\t//Scripts\r\n";
					js += tree.scripts;
					js += "}());\r\n";	
					//Write css
					css += "/*** " + widget + " **/\r\n";
					css += tree.styles;
				}
			}
			cb();
		};
		async.parallel([
			function(cbAsync){
				// Init recursivity
				walk(options.dir, options.recursive, "", cbAsync);
				//JS file footer
				js += "};\r\n";
			},
			function(cbAsync){
				// Write JS to file
				fs.writeFile(options.output,js,{flags:'w'}, function(err) {
					if(err) {
						cbAsync("Error writing output js file "+ err);

						return;
					}
					cbAsync();
					console.log("done js!");
				});
			},
			function(cbAsync) {
				//Write css to file
				fs.writeFile(options.css,css,{flags:'w'}, function(err) {
					if(err) {
						cbAsync("Error writing output js file "+ err);

						return;
					}
					cbAsync();
					console.log("done css!");
				});
			}
		],
		function (err) {
			callback(err);
		});

	}
};
