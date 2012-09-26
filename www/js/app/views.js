define(["jquery", "underscore", "backbone", "./models"], function($, _, Backbone, models) {

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

    initialize: function() {
      this.$details = $('#details');
      this.$search = $("#search");
      this.$search.combobox({
        collection: [
          "All Contacts", "My Favourites", "Baseball Team",
          "Clients", "Toronto Office"
        ],
        selected: function(aEvent, aCategory) {
          console.log("Searching for category: " + aCategory);
          if (aCategory == "All Contacts") {
            searchWorker.postMessage({cmd: 'searchForNameEmail',
                                      query: ""});
          } else {
            searchWorker.postMessage({cmd: 'searchForCategory',
                                      query: String(aCategory)});
          }
          $("#search").combobox('close');
        },
      });

      this.$search.bind("selected", function(aEvent, aCategory) {
      });
    },

    render: function(event){
      return this; // recommended as this enables calls to be chained.
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
          self.listView.$el.selectable({filter: 'li', tolerance: 'fit'});
        });
      });

      searchWorker.postMessage({cmd: 'init'});

      $("#search").keyup(function(aEvent) {
        if (aEvent.keyCode == 13) {
          var searchTerm = $("#search").val();
          searchWorker.postMessage({cmd: 'searchForNameEmail',
                                    query: searchTerm});
        }
      });
    },

    showDetails: function(model) {
      var details = new DetailView({model: model});
      this.$details.html(details.render().el);
    }
  });

  return {AppView: AppView};

});
