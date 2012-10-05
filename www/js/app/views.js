define(["jquery", "underscore", "backbone", "./models", "jquery-ui"], function($, _, Backbone, models) {
 (function( $ ) {

  _.mixin({
    lowercaseDasherize: function(aString) {
      return aString.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .replace(/[\s]/g, '-');
    },
  });

  $.widget( "ensemble.combobox", {
    _create: function() {
      var input = this.element,
          self = this,
          toggle = $("<button>")
                   .addClass("combobox-toggle")
                   .insertAfter(input);
      var img = $("<img>")
                .attr("src", "imgs/tag.png")
                .appendTo(toggle);

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
        return true;
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
          if (li.text() != "All Contacts") {
            self.element.val("tag:" + _.lowercaseDasherize(li.text()) + " ");
          } else {
            self.element.val('');
          }
          self.element[0].selectionStart = self.element.val().length;
          self.element[0].selectionEnd = self.element.val().length;
          self.element.focus();
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
})( $ );

  var TimeoutQueue = function() {
    this._queue = [];
    this._finishedCallback = null;
  };
  TimeoutQueue.prototype = {
    addJob: function(aJobFunction) {
      this._queue.push(aJobFunction);
    },
    start: function(aCallback) {
      this._finishedCallback = aCallback;
      this._queue.reverse();
      this._tick();
    },
    _tick: function() {
      if (this._queue.length == 0) {
        this._finishedCallback();
        return;
      }
      var startTime = new Date();
      while((new Date() - startTime) < 50) {
        var job = this._queue.pop();
        if (job)
          job();
      }
      setTimeout(this._tick.bind(this), 10);
    },
  };

  var ContactItemView = Backbone.View.extend({
    tagName: "li",
    template: _.template($('#contact-list-tmpl').html()),

    initialize: function(args) {
      this.app = args.app;
      this.model.on('change', this.render, this);
    },

    events: {
      "click .contact-list-item": "showDetails"
    },

    showDetails: function( event ){
      this.app.showDetails(this.model);
    },

    render: function(event){
      this.$el.html(this.template(this.model.toJSON()));
      return this; // recommended as this enables calls to be chained.
    }
  });

  var ContactListView = Backbone.View.extend({
    tagName: "ol",
    id: "contactsList",

    initialize: function(args) {
      this.list = args.list;
      this.app = args.app;
      this.list.on('change', this.render, this);
    },

    render: function(aCallback) {
      var self = this;

      $("#contactsListPane").append(self.$el);
      var q = new TimeoutQueue();
      this.list.each(function(aContact) {
        q.addJob(function() {
          self.$el.append(new ContactItemView({model: aContact,
                                               app: self.app}).render().el);
        });
      });

      q.start(aCallback);
    },
  });

  var DetailView = Backbone.View.extend({
    tagName: "span",

    template: _.template($('#contact-detail-tmpl').html()),

    initialize: function(args) {
      this.app = args.app;
      this.model.on('change', this.render, this);
    },

    render: function(event){
      this.$el.html(this.template(this.model.toJSON()));
      return this; // recommended as this enables calls to be chained.
    }

  });

  var AppView = Backbone.View.extend({
    el: '#content',
    list: null,
    tagSelectorOpened: false,

    initialize: function() {
      this.$details = $('#details');
      this.$search = $("#search");
      $("#tagSelector").click(function(aEvent) {
        this.toggleTagSelector(!this._tagSelectorOpened);
        this._tagSelectorOpened = !this._tagSelectorOpened;
        aEvent.preventDefault();
        aEvent.stopPropagation();
        return false;
      }.bind(this));
      this.$addContact = $("#addContact");
      this.$addContact.click(function(aEvent) {
        alert("Sorry - this doesn't do anything yet.");
      });

      this.$feedback = $("#feedback");
      this.$feedback.click(function(aEvent) {
        const kFeedback = "https://docs.google.com/spreadsheet/viewform?formkey=dHY5NlFkSzdXSFl3VVRwQmdSRjNycEE6MQ";

        window.open(kFeedback);
      });

      var self = this;
      $("#tagList li").click(function(aEvent) {
        $("#selectedTag").text($(this).text());
        self.doSearch();
      });

    },

    render: function(event){
      return this; // recommended as this enables calls to be chained.
    },

    toggleTagSelector: function(shouldExpand) {
      const kSpeed = 100;
      if (shouldExpand) {
        $("#tagSelector").animate({height: "190px"}, kSpeed, function() {
          $("#tagList").show();
          $("#arrow").hide();
          $("#selectedTag").hide();
        });
        $("#contactsListSorter").animate({top: "240px"}, kSpeed);
        $("#contactsListPane").animate({top: "259px"}, kSpeed);
      } else {
        $("#tagList").hide();
        $("#selectedTag").show();
        $("#arrow").show();
        $("#tagSelector").animate({height: "30px"}, kSpeed);
        $("#contactsListSorter").animate({top: "71px"}, kSpeed);
        $("#contactsListPane").animate({top: "90px"}, kSpeed);
      }
    },

    populate: function() {

      var self = this;
      searchWorker = new Worker("js/app/searchWorker.js");

      searchWorker.addEventListener("message", function(e) {
        $("#contactsList").remove();
        self.list = new models.ContactsList(e.data);
        self.listView = new ContactListView({list: self.list,
                                             app: self});
        self.listView.render(function() {
          console.log("Hiding spinner.");
          $("#spinner").hide();
          console.log("Hidden");
          self.listView.$el.selectable({filter: 'li', tolerance: 'fit'});
        });
      });

      console.log("Showing spinner.");
      $("#spinner").show();
      searchWorker.postMessage({cmd: 'init'});

      $("#search").keyup(function(aEvent) {
        if (aEvent.keyCode == 13) {
          if (this._timeoutID)
            clearTimeout(this._timeoutID);
          doSearch();
        } else {
          self.scheduleSearch();
        }
      });
    },

    scheduleSearch: function() {
      if (this._timeoutID)
        clearTimeout(this._timeoutID);
      this.timeoutID = setTimeout(this.doSearch, 100);
    },

    doSearch: function(aCategory) {
      var searchTerm = $("#search").val();
      var category = $("#selectedTag").text();
      $("#spinner").show();
      if (category != "All Contacts") {
        category = _.lowercaseDasherize(category);
        searchWorker.postMessage({cmd: 'searchForNameEmailInCategory',
                                  msg: {
                                    category: category,
                                    query: searchTerm
                                  }});
      } else {
        searchWorker.postMessage({cmd: 'searchForNameEmail',
                                  query: searchTerm});
      }
    },

    showDetails: function(model) {
      var details = new DetailView({model: model});
      this.$details.html(details.render().el);
    }
  });

  return {AppView: AppView};

});
