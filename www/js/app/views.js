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
      var job = this._queue.pop();
      job();
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
      this.$list = $('#contactsList');
      this.$details = $('#details');
    },

    render: function(event){
      return this; // recommended as this enables calls to be chained.
    },

    addOne: function(contact) {
      var view = new ContactItemView({model: contact, app: this});
      this.$list.append(view.render().el);
    },

    addData: function(aData) {
      var contact = new models.Contact(aData);
      this.addOne(contact);
    },

    populate: function() {
      var self = this;
      $.getJSON('assets/fakecontacts/fakecontacts.json', function(data) {
        var q = new TimeoutQueue();
        data.forEach(function(aData) {
          q.addJob(function() {
            self.addData(aData);
          });
        });

        q.start(function() {
          console.log("ALL DONE");
        });
        self.$list.selectable();
      });

      this.$list.empty();
    },

    showDetails: function(model) {
      var details = new DetailView({model: model});
      this.$details.html(details.render().el);
    }
  });

  return {AppView: AppView};

});
