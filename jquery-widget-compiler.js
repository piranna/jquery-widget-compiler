var fs       = require("fs");
var path     = require("path");
var lodash   = require("lodash");
var uglify   = require("uglify-js");
var Meteor   = require("meteor-core")(lodash);
require("meteor-htmljs")(Meteor);
require("meteor-html-tools")(Meteor);
require("meteor-blaze-tools")(Meteor);
require("meteor-spacebars-compiler")(Meteor);

module.exports =
{
	file : function (options) {
		fs.readFile(options.input, options.charset, function (err,data) {
			if (err) 
				return console.log("Error opening input template file " +err);
			var js = "module.exports = function(jquery) {\r\n";
			var scripts = "";
			var num = 0;
			var links = "";
			var templates = "";
			templates += "\tvar Meteor = jquery.Meteor;\r\n";
			templates += "\tvar HTML = Meteor.HTML;\r\n";
			templates += "\tvar Blaze = Meteor.Blaze;\r\n";
			templates += "\tvar Spacebars = Meteor.Spacebars;\r\n";
			templates += "\tvar templates = {};\r\n";
			
			//Parse html content
			var html = Meteor.SpacebarsCompiler.parse(String(data));
			//Now parse all elements
			for (i=0;i<html.length;++i) {
				//Get tag name
				var tag = html[i].tagName;
				//Check
				if (tag)
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
						default:
							console.log("Ignoring unkown tag: " + tag);
					}
			}
			js += "\t//Links\r\n";
			js += links;
			js += "\t//Templates\r\n";
			js += templates;
			js += "\t//Scripts\r\n";
			js += scripts;
			js += "};\r\n";	
			//Add support for i18n with {{[xxx]}} -> {{t 'xxx'}}
			if (options.i18n)
				//Replace
				data.replace(/\{\{\s*\[\s*([^\s]*)\s*\]\s*\}\}/g,"{{t '$1'}}");
			//Write JS to file
			fs.writeFile(options.output,js,{flags:'w'}, function(err) {
				if(err) 
					return console.log("Error writing output js file "+ err);
				console.log("done!");
			}); 
		});
	}
};

