#!/usr/bin/env node
var input,output,dir,i,i18n = false,recursive = false,prefix = '';

function showHelp() {
	console.log("Usage: jquery-widget-compiler [-i|--input widget.html] [-d|--dir directory] [-r|--recursive]  -o|--output widget.js");
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
	}
}

if ((!input && !dir) || !output)
	return showHelp();

var compiler = require("../jquery-widget-compiler.js");

if (input)
	compiler.file({
		input: input,
		output: output
	});
else if (dir)
	compiler.directory({
		dir: dir,
		output: output,
		recursive: recursive,
	});

