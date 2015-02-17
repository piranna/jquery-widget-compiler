# jQuery pseudo web components based on UI widgets and Meteor Blaze reactive templates

The pourpose of this project is to be able to create jquery widgets using Meteor Blaze reactive templates from a self contained widget file.

The widget file can contain both the HTML template code and the widget script code. The file must be a valid HTML file and can contain the following top elements:

- *template* with the blaze templates data. Each tag found and add it to a *template* map variable which could be used later on by the widget.
- *script* with the jquery widget initialiation code
- *link* which will be added to the head of the host html page on load.

## Dependencies
The genereated JS code requires [jQuery](https://github.com/jquery/jquery), [jQuery UI](https://github.com/jquery/jquery-ui) and the [jQuery Meteor Blaze plugin](https://github.com/eface2face/jquery-meteor-blaze)

## Install
```shell
npm install -g jquery-widget-compiler
```
	
## Usage
```shell
jquery-widget-compiler [-i|--input widget.html] -o|--output widget.js
```

## Example

Given the followinf example widget file:
```html
<template name="main">
        Hello world!
        <button id="number-a">{{a}}</button> &times; <button id="number-b">{{b}}</button> = {{c}}
</template>
<script>
        jquery.widget("hello.world",{
                _create : function() {
                        var self = this;
                        this.a = query.Meteor.ReactiveVar(1);
                        this.b = query.Meteor.ReactiveVar(1);
                        this.element
                                .blaze(templates.main)
                                .reactive('a',this.a)
                                .reactive('b',this.b)
                                .helper('c',function() {
                                        return self.a.get()*self.b.get();
                                })
                                .render()
                                .on('click #number-a',function () {
                                        self.a.set(self.a.get() + 1);
                                }).
                                .on('click #number-b': function () {
                                        self.b.set(self.b.get() + 1);
                                });
        });
</script>

```
Just compile it by:
```shell
jquery-widget-compiler -i example/widget.html -o example/widget.js
```

It will generate the following javascript file:
```javascript
module.exports = function(jquery) {
        //Links
        //Templates
        var Meteor = jquery.Meteor;
        var HTML = Meteor.HTML;
        var Blaze = Meteor.Blaze;
        var Spacebars = Meteor.Spacebars;
        var templates = {};
        templates['main'] = (function () { var view = this; return ["\n\tHello world!\n\t", HTML.BUTTON({id: "number-a"}, Blaze.View(function () { return Spacebars.mustache(view.lookup("a")); })), HTML.Raw(" &times; "), HTML.BUTTON({id: "number-b"}, Blaze.View(function () { return Spacebars.mustache(view.lookup("b")); })), " = ", Blaze.View(function () { return Spacebars.mustache(view.lookup("c")); }), "\n"]; });
        //Scripts

        jquery.widget("hello.world",{
                _create : function() {
                        var self = this;
                        this.a = jquery.Meteor.ReactiveVar(1);
                        this.b = jquery.Meteor.ReactiveVar(1);
                        this.element
                                .blaze(templates.main)
                                .reactive('a',this.a)
                                .reactive('b',this.b)
                                .helper('c',function() {
                                        return self.a.get()*self.b.get();
                                })
                                .render()
                                .on('click #number-a',function () {
                                        self.a.set(self.a.get() + 1);
                                }).
                                .on('click #number-b': function () {
                                        self.b.set(self.b.get() + 1);
                                });
        });
};
```
You can now require the js file in your code and use browserify to import it into your page.

