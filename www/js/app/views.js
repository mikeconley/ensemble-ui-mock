define(["jquery", "underscore", "backbone", "./models", "jquery-ui"], function($, _, Backbone, models) {

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
      $("#addContact, #removeContact, #contactsListSorter").click(
        function(aEvent) {
          alert("Sorry - this doesn't do anything yet.");
      });

      this.$feedback = $("#feedback");
      this.$feedback.click(function(aEvent) {
        const kFeedback = "https://docs.google.com/spreadsheet/viewform?formkey=dGJ5M1Uybk9sYlE0bmxMckhmaHpZQWc6MQ";

        window.open(kFeedback);
      });

      var self = this;
      $("#tagList li").click(function(aEvent) {
        if ($(this).attr("id") != "topSpot") {
          $("#tagList li").show();
          $("#topSpot").data("id", $(this).data("id"));
          $("#topSpot").html($(this).html());

          $(this).hide();
          $("#selectedTag").html($(this).html());
          $("#selectedTag").data("id", $(this).data("id"));

          self.doSearch();
        } else {
          self.toggleTagSelector(false);
        }
      });

      $("#wipeSearch").click(function(aEvent) {
        $("#search").val("");
        $("#wipeSearch").hide();
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
        if (e.data.length == 0) {
          console.log("NO RESULTS");
          $("#noResultsFor").text($("#search").val());
          $("#noResults").show();
        } else {
          $("#noResults").hide();
        }
        self.list = new models.ContactsList(e.data);
        self.listView = new ContactListView({list: self.list,
                                             app: self});
        self.listView.render(function() {
          $("#spinner").hide();
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
          if ($("#search").val() != "")
            $("#wipeSearch").show();
          else
            $("#wipeSearch").hide();
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
      var categoryId = $("#selectedTag").data("id");
      $("#spinner").show();
      if (categoryId != "") {
        console.log("Looking for " + categoryId);
        searchWorker.postMessage({cmd: 'searchForNameEmailInCategory',
                                  msg: {
                                    category: categoryId,
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
