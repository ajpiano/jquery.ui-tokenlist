/*!
 * jQuery UI Token List @VERSION
 *
 * Copyright (c) 2009 Adaptavist.com
 * Dual licensed under the MIT and GPL licenses.
 */
/* Depends:
 *  ui.core.js
 */
(function($) {

$.widget('ui.tokenlist', {
	options: {
		split: /\s*,\s*/,
		join: ', ',
		removeTip: "Remove Item",
		duplicates: false,
		validate: false // Maybe false, an array of allowed values, or a validation function
	},

	_create: function() {
		var self = this, key = $.ui.keyCode;

		if ( !this.options.items ) {
			this.options.items = [];
		}

		if (this.element.is(':text')) {
			this.textElem = this.element;

			this.textElem
				// Hide the original field
				.hide()
				// Update our list if the original field is changed
				.bind('change.' + this.widgetName, function() {
					self.value(self.textElem.val(), true);
				});

			// Generate a list element to replace the original field
			this.element =
				$('<ul/>')
					.insertAfter(this.textElem)
					// Allow the widget to also be accessed via the generated element
					.data(this.widgetName, this);
		}

		this.element
				.addClass(this.widgetBaseClass + ' ui-widget ui-widget-content ui-helper-clearfix')

				.bind('keydown.' + this.widgetName, function(ev) {
					var focus, disabled = self.option('disabled');
					var stop = true;

					switch (ev.keyCode) {
					case key.LEFT:
					case key.UP:
					case key.BACKSPACE:
						focus = $(ev.target).closest('li').prev('li');
						break;
					case key.RIGHT:
					case key.DOWN:
					case key.DELETE:
						focus = $(ev.target).closest('li').next('li.'+self.widgetBaseClass+'-item');
						if (!focus.length && !disabled) {
							focus = self.inputElem;
						}
						break;
					case key.HOME:
					case key.PAGE_UP:
						focus = $(ev.target).closest('ul').find('>li:first');
						break;
					case key.END:
					case key.PAGE_DOWN:
						focus = self.inputElem;
						break;
					}

					switch (ev.keyCode) {
					case key.DELETE:
					case key.BACKSPACE:
						if (disabled) {
							focus = undefined;
						} else {
							self._removeItem(ev.target);
						}
						break;
					}

					if (focus && focus.length) {
						focus[0].focus();
						ev.stopPropagation();
						ev.preventDefault();
					}
				})

				// Delete the item if the button is clicked
				.bind('click.' + this.widgetName, function(ev) {
					if (!self.option('disabled')) {
						if ($(ev.target).is('.'+self.widgetBaseClass+'-remove')) {
							self._removeItem(ev.target);
						}
						if (this === ev.target) {
							self.inputElem[0].focus();
						}
					}
				});

		this.inputElem =
			$('<input type="text"/>')
				.bind('keydown.' + this.widgetName, function(ev) {
					if (ev.keyCode === key.LEFT) {
						// If caret is at the far-left of the field, move focus to the last item
						var caret;
						if (this.selectionEnd !== undefined) {
							caret = this.selectionEnd;
						}
						if (caret === 0) {
							$(this).closest('li').prev('li').each(function() { this.focus(); });
							ev.preventDefault();
						}
					}
					ev.stopPropagation();
				})
				.bind('change.' + this.widgetName, function() {
					if (self.add($(this).val()).length) {
						$(this).val('');
					}
				});

		// Add the new item input field
		$('<li/>')
			.appendTo(this.element)
			.addClass(this.widgetBaseClass+'-input')
			.append(this.inputElem);

		if (this.textElem) {
			this.value(this.textElem.val());
			
			if (this.textElem[0].disabled) {
				this.disable();
			}
		} else {
			this.add(this.items());
		}
	},

	_setOption: function(key, value) {
		if (key === 'disabled') {
			this.inputElem[0].disabled = value;
		}

		$.Widget.prototype._setOption.apply( this, arguments );
	},

	input: function() {
		return $(this.inputElem);
	},

	items: function() {
		return this.option('items');
	},

	empty: function() {
		// Remove all existing items
		$('> li.'+this.widgetBaseClass+'-item', this.element).remove();
		this.options.items = [];
		return this;
	},

	value: function(newValue, noChange) {
		var value = this._stringify(this.items());

		if (arguments.length > 0) {
			var newItems = this._parse(newValue),
				newValue = this._stringify(newItems);

			if (newValue !== value) {
				this.empty().add(newItems, noChange);
				value = newValue;
			}
		}

		return value;
	},

	add: function(newItems, noChange) {
		var items = this.items(),
			unique = !this.option('duplicates'),
			validate = this.option('validate'),
			added = [],
			self = this;

		if (!$.isArray(newItems)) {
			newItems = [newItems];
		}

		$.each(newItems, function(i, item) {
			// Discard duplicate items if duplicates are not allowed
			if (unique && $.inArray(item, items) >= 0) { return; }

			// Validate the item
			if (validate) {
				if ($.isArray(validate)) {
					if ($.inArray(item, validate) < 0) { return; }
				} else if ($.isFunction(validate)) {
					if (!validate.call(self, item)) { return; }
				}
			}

			added.push(item);
			items.push(item);
			self._addItemElem(item);
		});

		if (added.length && !noChange) {
			this._change();
		}

		return added;
	},

	_addItemElem: function(token) {
		var input = $('.'+this.widgetBaseClass+'-input', this.element),
			label =
				$('<span/>')
					.addClass(this.widgetBaseClass+'-label')
					.text(token),
			button =
				$('<span>x</span>')
					.addClass(this.widgetBaseClass+'-remove ui-icon ui-icon-close')
					.attr('alt', this.option('removeTip'));

		return $('<li/>')
			.insertBefore(input)
			.addClass(this.widgetBaseClass+'-item ui-state-default ui-corner-all')
			.attr('tabindex','-1')
			.append(label)
			.append(button)

			// Apply/remove style for a focused item
			.bind('focus.' + this.widgetName, function() { $(this).addClass('ui-state-focus'); })
			.bind('blur.' + this.widgetName, function() { $(this).removeClass('ui-state-focus'); });

			// Fix focusing in IE when clicking within the item
//			.bind('click', function() { this.focus(); });
	},

	_removeItem: function(target) {
		var item = $(target).closest('li');
		this.items().splice($(item).prevAll('li').length, 1);
		item.remove();
		this._change();
	},

	_parse: function(value) {
		return (value || '').split(this.option('split'));
	},

	_stringify: function(items) {
		return items.join(this.option('join'));
	},

	_change: function() {
		if (this.textElem) {
			this.textElem
				.val(this._stringify(this.items()))
				.trigger('change');
		}
		this.element.trigger('change');
	}
});

$.extend($.ui.tokenlist, {
	version: "@VERSION"
});

})(jQuery);

