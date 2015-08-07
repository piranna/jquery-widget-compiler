#!/usr/bin/env node

var path = require('path');

var compiler = require("..");


var input,output,dir,css
var recursive = false
var prefix = '';


function usage()
{
  console.log("Usage: jquery-widget-compiler [-i|--input widget.html] [-d|--dir directory] [-r|--recursive]  -o|--output widget.js -c|css widget.css");
};


for(var i=0; i<process.argv.length; ++i)
{
  switch(process.argv[i])
	{
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

    case "--css":
    case "-c":
      css = process.argv[++i];
    break;
  }
}

if((!input && !dir) || !output)
  return usage();

if(!css)
  css = path.basename(output,".js")+".css";


var options =
{
	input: dir,
	output: output,
	css: css
}

if(input)
  compiler.file(options);
else if(dir)
  compiler.directory(options);
else
	usage()
