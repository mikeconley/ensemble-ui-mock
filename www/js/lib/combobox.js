(function( $ ) {
  $.widget( "ensemble.combobox", {
    _create: function() {
      var input = this.element,
          self = this,
          toggle = $("<span>")
                   .addClass("combobox-toggle")
                   .html("&#9660;")
                   .insertAfter(input);

      var list = $("<ol>").addClass("combobox-list");
      var liNodes = this._processCollection(this.options.collection);
      var firstNode = liNodes.shift();
      list.append(firstNode, liNodes);

      var popup = $("<div id=\"combobox-popup\">")
                  .addClass("combobox-popup")
                  .append(list)
                  .hide()
                  .appendTo($('body'));

      toggle.click(function(aEvent) {
        popup.toggle();
      });

      this.popup = popup;
    },

    _processCollection: function(aCollection) {
      var self = this;
      var result = [];
      $.each(aCollection, function(aIndex, aItem) {
        var li = $("<li>").addClass('combobox-selectable');
        if (Array.isArray(aItem)) {
          var sublist = $("<ol>").addClass("combobox-list");
          sublist.append(self._processCollection(aItem).bind(self));
          li.append(sublist);
        } else {
          li.text(aItem);
        }

        li.click(function(aEvent) {
          self._trigger("selected", aEvent, li.text());
        });

        result.push(li);
      });
      return result;
    },

    _setOption: function(key, value) {
    },

    close: function() {
      this.popup.hide();
    },

    destroy: function() {
    }
  });
})( jQuery );
