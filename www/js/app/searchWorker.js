var collection = null;

addEventListener('message', function(aEvent) {
  var data = aEvent.data
  switch (data.cmd) {
    case 'init':
      initialize();
      break;
    case 'searchForNameEmail':
      emitSimpleSearchResults(data.query);
      break;
    case 'searchForCategory':
      emitCategoryResults(data.query);
      break;
    case 'searchForNameEmailInCategory':
      var search = data.msg;
      emitCategorySearchResults(search.category, search.query);
      break;
  }
});

function initialize() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'fakecontacts.json', true);

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200 || xhr.status == 0) {
        collection = JSON.parse(xhr.responseText);
        postMessage(JSON.parse(xhr.responseText));
      }
    }
  }

  xhr.send(null);
}

function emitSimpleSearchResults(aQuery) {
  var results = [];
  aQuery = aQuery.toLowerCase();
  collection.forEach(function(aItem) {
    var nameString = String(aItem.name).toLowerCase();
    var emailString = String(aItem.email).toLowerCase();
    if (nameString.indexOf(aQuery) != -1 ||
        emailString.indexOf(aQuery) != -1)
      results.push(aItem);
  });

  postMessage(results);
}

function emitCategoryResults(aCategory) {
  var results = [];
  collection.forEach(function(aItem) {
    if (aItem.category && aItem.category.indexOf(aCategory) != -1)
      results.push(aItem);
  });
  postMessage(results);
}

function emitCategorySearchResults(aCategory, aQuery) {
  var results = [];
  collection.forEach(function(aItem) {
    if (aItem.categories.indexOf(aCategory) != -1) {
      var nameString = String(aItem.name);
      var emailString = String(aItem.email);
      if (nameString.indexOf(aQuery) != -1 ||
          emailString.indexOf(aQuery) != -1) {
        results.push(aItem);
      }
    }
  });

  postMessage(results);
}
