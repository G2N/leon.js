# leon.js

leon.js is a simple HTML Cleaner. It parses your ugly html (possibly generated with a wysiwyg) into something cleaner.
Leon does not depend on any library and should work in any modern browser.

**WARNING:** I still need to run more tests and to extend the default parser rules in order to generate the best HTML possible.
Comments and requests are welcome.

## Features

Leon will try to merge most tags and classes, drop empty element and useless spans and rename / remove tags you don't want.

## Usage

	// See below for the configuration details
	var config = {...}
	var leon = new leon(config);
	console.log( leon.cleanUp(myDirtyHTML) );
	
## Configuration

Pass an object containing the following. At the time, the defaults are simply overriden with your object. Will do a real
extend method soon.

	var config = 
		// Do we need to remove empty elements
		// Take care, for now, this one does not check much before deleting
		removeEmptyTags: false,
		/**
		 * Parse rules for html tags. 
		 * Tags not in this object will not be touched (except useless spans, useless spans are evil)
		 * Their classes and attributes will be parsed though
		 * The following options are available:
		 * 
		 *  - rename: 		Rename to the given tagname
		 *  
		 *  - remove: 		Remove the element and its content
		 *  
		 *  - unwrap: 		Replaces the element with its contents
		 *  
		 *  - addClass: 	Automatically add a class to the element.
		 *  				Multiple class names must be space separated
		 */
		tags: {
			font: { 
				rename: 'span'
			},
			strong: {
				rename: 'span',
				addClass: 'bold'
			}
			i: {
				rename: 'em'
			}
		},
		/**
		 * A whitelist of authorized classes, any class not declared here will be terminated
		 */
		classes: {
			'ta-right':1,
			'ta-center':1,
			'ta-left':1,
			'ta-justify':1,
			'color-red':1,
			'color-green':1,
			'color-blue':1,
			'fz-smallest':1,
			'fz-smaller':1,
			'fz-small':1,
			'fz-normal':1,
			'fz-big':1,
			'fz-bigger':1,
			'fz-biggest':1,
			'bold': 1,
			'italic': 1
		},
		/**
		 * CSS properties and HTML attributes that can be converted to classes
		 * The classes MUST be present in the classes whitelist
		 *
		 * Will change both <font color="red"> and <span style='color:red;'> to <span class="color-red">
		 */
		styleToClass: {
			'text-align': {
				right: 'ta-right',
				center: 'ta-center',
				left: 'ta-left',
				tajustify: 'ta-justify'
			},
			color: {
				red: 'color-red',
				green: 'color-green',
				blue: 'color-blue',
				'#ff0000': 'color-red',
				'#00ff00': 'color-green',
				'#0000ff': 'color-blue',
			},
			size: {
				1: 'fz-smallest',
				2: 'fz-smaller',
				3: 'fz-small',
				4: 'fz-normal',
				5: 'fz-big',
				6: 'fz-bigger',
				7: 'fz-biggest'
			}
		}		
	};
	
## Browser Support

Any modern browser that support [classList](http://caniuse.com/#feat=classlist) should be fine. 
Will add support for older browsers if needed.

* FF 3.6+
* Chrome 8+
* Opera 11.5+
* Safari 5.1+
* IE 10+
* Android 3+