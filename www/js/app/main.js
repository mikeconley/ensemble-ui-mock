define(function (require) {
  var views = require('./views');
  var $ = require("jquery");
  require("jquery-ui");

  var appView = new views.AppView();
  appView.populate();
});
