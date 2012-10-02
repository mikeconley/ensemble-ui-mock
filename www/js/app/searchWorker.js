var collection = null;

function lowercaseDasherize(aString) {
  return aString.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/[\s]/g, '-');
}

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

function emitCategoryResults(aCategorySearch) {
  var results = [];
  collection.forEach(function(aItem) {
    if (aItem.category) {
      aItem.category.forEach(function(aCategory) {
        if (lowercaseDasherize(aCategory) == aCategorySearch) {
          results.push(aItem);
        }
      });
    }
  });
  postMessage(results);
}

function emitCategorySearchResults(aCategorySearch, aQuery) {
  var results = [];
  aQuery = aQuery.toLowerCase();
  collection.forEach(function(aItem) {
    if (aItem.category) {
      var nameString = String(aItem.name).toLowerCase();
      var emailString = String(aItem.email).toLowerCase();;
      aItem.category.forEach(function(aCategory) {
        if (lowercaseDasherize(aCategory) == aCategorySearch &&
            (nameString.indexOf(aQuery) != -1 ||
             emailString.indexOf(aQuery) != -1))
          results.push(aItem);
      });
    }
  });

  postMessage(results);
}
