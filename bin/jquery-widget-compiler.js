#!/usr/bin/env node
var input,output,dir,i,css,recursive = false,prefix = '';
var path = require('path');

function showHelp() {
	console.log("Usage: jquery-widget-compiler [-i|--input widget.html] [-d|--dir directory] [-r|--recursive]  -o|--output widget.jsi -c|css widget.css");
};

for(i=0;i<process.argv.length;++i) { 
	switch(process.argv[i]) {
		case "--input":
		case "-i":
			input = process.argv[++i];
			break;
		case "--dir":
		case "-d":
			dir = process.argv[++i];
			break;
		case "--output":
		case "-o":
			output = process.argv[++i];
			break;
		case "--recursive":
		case "-r":
			recursive = true;
			break;
		case "--css":
		case "-c":
			css = process.argv[++i];
			break;
	}
}

if ((!input && !dir) || !output)
	return showHelp();
if (!css)
	css = path.basename(output,".js")+".css";

var compiler = require("../jquery-widget-compiler.js");

if (input)
	compiler.file({
		input: input,
		output: output,
		css: css
	});
else if (dir)
	compiler.directory({
		dir: dir,
		output: output,
		recursive: recursive,
		css: css
	});

