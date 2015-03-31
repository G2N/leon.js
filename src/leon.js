/*jslint browser: true */
/* exported leon */
var leon = (function(rules) {
	'use strict';
	
	var DEFAULT_RULES = {
		/**
		 * Global options
		 */
		removeEmptyTags: false,
		/**
		 * Parse rules for html tags
		 * The following options are available:
		 * 
		 *  - rename: 			Rename to the given tagname
		 *  
		 *  - remove: 			Remove the element and its content
		 *  
		 *  - unwrap: 			Replaces the element with its contents
		 *  
		 *  - addClass: 		Automatically add a class to the element.
		 *  					Multiple class names must be space separated
		 *
		 *  - check_attributes: [TODO] Sanitizes attributes contents
		 */
		tags: {
			font: { 
				rename: 'span'
			},
			b: {
				rename: 'strong'
			},
			i: {
				rename: 'em'
			}
		},
		/**
		 * A whitelist of authorized classes
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
	
	var EMPTY_ELEMENTS = ['hr','br', 'input', 'img','textarea', 'meta','link','base','embed','param','area','col','iframe'];
	
	var parseRules = rules || DEFAULT_RULES;
	
	// Some dummy element to hold our HTML during parsing
	var dummy = document.createElement('div');
	
	/**
	 * Sets the dummy's content to whatever string was passed
	 * @param   {String}  html The HTMl we want to clean
	 * @returns {Boolean} false on error
	 */
	function _setDummyContent(html) {
		// Ensure that we've got some string and it's not empty
		if(typeof html !== 'string' || html === '') {
			return false;
		}
		
		dummy.innerHTML = html;
		
		return true;
	}
	
	/**
	 * Recursively walks through the element's children and parses them
	 * Calls itself after each child
	 * @param {Object} parent A parent node
	 */
	function _walk(parent) {	
		Array.prototype.map.call(parent.children, function(child) {
			_handleAttributes(child);
			// Reassign the element each time, because it might have been replaced by something else
			// ie: <font> becomes <span>
			child = _handleNode(child);
			_walk(child);
		});
	}
	
	/**
	 * Cleans everything up
	 * @param   {String}  html Some HTML string or an element
	 * @returns {String} The cleaned up HTML
	 */
	function _cleanUp(html) {
		if(!_setDummyContent(html)) {
			return html;
		}
		
		_walk(dummy);
		
		return dummy.innerHTML;
	}
	
	/**
	 * Manages all attributes on a given element
	 * @param {Object} elem The element
	 */
	function _handleAttributes(elem) {
		var attributes = elem.attributes;
		
		if(!attributes.length) {
			return;
		}
		
		Array.prototype.map.call(attributes, function(attribute) {
			switch(attribute.name) {
				case 'style':
					_parseStyles(elem);
					elem.removeAttribute(attribute.name);
					break;
				case 'size':
				case 'color':
					_parseAttribute(elem, attribute.name);
					elem.removeAttribute(attribute.name);
					break;
				case 'class':
					_purgeClassName(elem);
					break;
				case 'href':
				case 'src':
				case 'alt':
				case 'title':
					break;
				default:
					elem.removeAttribute(attribute.name);
					break;
			}
		});		
	}
	
	/**
	 * Handles nodes depending of the configuration (rename tag, remove, etc);
	 * @param   {Object} elem Some element to work with
	 * @returns {Object} Either the element that was passed or a new one if it was replaced
	 */
	function _handleNode(elem) {
		var tagName = elem.tagName.toLowerCase();
		
		// Remove every empty element if needed
		if(parseRules.removeEmptyTags && elem.innerHTML.trim() === '' && EMPTY_ELEMENTS.indexOf(tagName) < 0)  {
			elem = _removeTag(elem);
			// Obviously, we've got nothing left to do here.
			return elem;
		}
		
		if(parseRules.tags[tagName]) {
			// Remove tag and contents
			if(parseRules.tags[tagName].remove) {
				elem = _removeTag(elem);
				// Obviously, we've got nothing left to do here.
				return elem;
			}
			// Remove tag and contents
			if(parseRules.tags[tagName].unwrap) {
				elem = _unwrapTag(elem);
				// Obviously, we've got nothing left to do here.
				return elem;
			}
			// Add a class
			if(parseRules.tags[tagName].addClass) {
				_addClass(elem, parseRules.tags[tagName].addClass);
			}

			// Rename tag
			// WARNING : THIS MUST BE CALLED LAST !!!!
			if(parseRules.tags[tagName].rename) {
				elem = _renameTag(elem, parseRules.tags[tagName].rename);
				// Must reassign the tagName or it might not work with future tests
				tagName = elem.tagName.toLowerCase();
			}
		}
		
		// Is this an useful span ?
		if(tagName === 'span') {
			elem = _removeUselessSpan(elem);
		}
		
		return elem;
	}
	
	/**
	 * Parse style attributes and replaces with a class when possible
	 * @param {Object} elem The target DOM element
	 */
	function _parseStyles(elem) {
		var declarations = elem.style.cssText.replace(/\s/g, '').split(';'),
			declaration,
			rule,
			value;
		
		for (var i in declarations) {
			declaration = declarations[i].split(':');
			rule = declaration[0];
			value =  declaration[1];
			
			if(rule === 'color') {
				value = _reformatColor(value);
			}
			_applyClassFromAttr(elem, rule, value);
		}
	}
	
	/**
	 * Tries to convert an attribute to a class 
	 * @param {Object} elem      The element
	 * @param {String} attribute The attribute's name
	 */
	function _parseAttribute(elem, attribute) {
		var value = elem.attributes[attribute].value;
		if(attribute === 'color') {
			value = _reformatColor(value);
		}
		_applyClassFromAttr(elem, attribute, value);
	}
	
	/**
	 * Converts a string representing a color to #rrggbb
	 * @param   {String} color The color
	 * @returns {String} The formatted string
	 */
	function _reformatColor(color) {
		var isHex = color.substr(0, 1) === '#',
			colorRGB = color.match(/rgb\(\s?(\d{0,3})\s?,\s?(\d{0,3})\s?,\s?(\d{0,3})\s?\)/),
			hexColorArray;
		
		// Convert to lower case first
		color = color.toLowerCase();
		
		// If it's like #000, convert to #000000
		if(isHex && color.length < 7) {
			hexColorArray = color.split('');
			color = '#'+color[1]+color[1]+color[2]+color[2]+color[3]+color[3];
		}
		// If it's in RGB, convert to hex
		if(colorRGB) {
			color = '#'+colorRGB.slice(1).map(function(str) {
				var component = parseInt(str, 10).toString(16);
				return (component.length > 1) ? component : 0 + component;
			}).join('');
		}
		return color;
	}
	
	/**
	 * Applies a class to an element if it's in the white list
	 * [TODO] Take care of rules with no values
	 * @param {Object} elem  The target
	 * @param {String} rule  The style rule
	 * @param {String} value A value associated with the rule
	 */
	function _applyClassFromAttr(elem, rule, value) {
		var className;
		
		// Check if styleToClass is set and if the correspondign rule exists
		if(!parseRules.styleToClass || !parseRules.styleToClass[rule]) {
			return;
		}
		
		className = parseRules.styleToClass[rule][value];
		
		// Check that the class is allowed ;)
		if(!className || !parseRules.classes[className]) {
			return;
		}
		_addClass(elem, className);
	}
	
	/**
	 * Add a class to an element
	 * @param {Object} elem      The element
	 * @param {String} className The class name (multiple classes may be space separated)
	 */
	function _addClass(elem, className) {
		var classes = className.split(' ');
		for(var i = 0, l = classes.length; i < l; i++) {
			// Check that the class is allowed ;)
			if(classes[i] && parseRules.classes[classes[i]]) {
				elem.classList.add(classes[i]);
			}
		}
	}
	
	/**
	 * Removes all non authorized classes from an element
	 * @param {Object} elem The element
	 */
	function _purgeClassName(elem) {
		var classes = elem.className.split(' ');
		
		// Check every class applied
		for(var i = 0, l = classes.length; i < l; i++) {
			if(!parseRules.classes[classes[i]]) {
				elem.classList.remove(classes[i]);
			}
		}
		
		// If there is no class left, remove the attribute
		if(elem.className === '') {
			elem.removeAttribute('class');
		}
	}
	
	/**
	 * Replaces a tag with a new one (changes font to span)
	 * [TODO] Might need to preserve other attributes than className ?
	 * @param   {Object} oldElem The old tag
	 * @param   {String} tagName The desired new tagname
	 * @returns {Object} The newly created element
	 */
	function _renameTag(oldElem, tagName) {
		var newEl;
		
		// What if we're dumb ?
		if(oldElem.tagName === tagName.toUpperCase()) {
			return oldElem;
		}
		
		newEl = document.createElement(tagName);
		newEl.innerHTML = oldElem.innerHTML;
		
		if(oldElem.className) {
			newEl.className = oldElem.className;
		}
		
		oldElem.parentNode.replaceChild(newEl, oldElem);
		return newEl;
	}
	
	/**
	 * Removes a span if it is useless
	 * [TODO] Might need to preserve other attributes than class
	 * @param   {Object} elem The span
	 * @returns {Object} Either the span if nothing was done or its parent
	 */
	function _removeUselessSpan(elem) {
		var tagName = elem.tagName.toLowerCase(),
			parent = elem.parentNode,
			className;
		
		if(tagName !== 'span') {
			return elem;
		}
		
		// If it is the only child, merge it with daddy :)
		if(elem.parentNode.innerHTML.trim() === elem.outerHTML) {
			className = parent.className + ' ' +elem.className;
			parent.className = className.trim();
			parent.innerHTML = elem.innerHTML;
			
			return parent;
		}
		
		// It it has no meaningful attribute, remove it
		if(!elem.className) {
			elem.outerHTML = elem.innerHTML;
			// No choice but to return the parent
			return parent;
		}
		
		return elem;
	}
	
	/**
	 * Completely removes an element from the HTML
	 * @param   {Object} elem The undesirable element
	 * @returns {Object} Its parent
	 */
	function _removeTag(elem) {
		var parent = elem.parentNode;
		
		parent.removeChild(elem);
		
		return parent;
	}
	
	/**
	 * Unwraps a tag, leaving only its innerHTML
	 * @param   {Object} elem The unwanted tag
	 * @returns {Object} Its parent
	 */
	function _unwrapTag(elem) {
		var parent = elem.parentNode;
		
		elem.outerHTML = elem.innerHTML;
		
		return parent;
	}
	
	return {
		cleanUp: _cleanUp
	};
});