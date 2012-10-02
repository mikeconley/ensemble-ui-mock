define(["backbone"], function(Backbone) {
  var Contact = Backbone.Model.extend({
    defaults: function Contact_defaults() {
      return {
        name: [],
        honorificPrefix: [],
        givenName: [],
        additionalName: [],
        familyName: [],
        honorificSuffix: [],
        nickname: [],
        email: [],
        photo: [],
        url: [],
        category: [],
        adr: [],
        tel: [],
        impp: [],
        org: [],
        other: [],
        jobTitle: [],
        department: [],
        bday: null,
        note: [],
        anniversary: null,
        sex: null,
        genderIdentity: null,
        popularity: 0,
        defaultEmail: null,
        defaultImpp: null,
        defaultTel: null,
        defaultPhoto: null,
      };
    }
  });

  var ContactsList = Backbone.Collection.extend({
    model: Contact,
    comparator: function(aContact) {
      var name = accentsTidy(aContact.get("name").join(' '));
      var regex = /^[a-zA-Z \.\!\?]*$/;
      if (regex.test(name)) {
        return name;
      }
      else {
        return pinyin(name, false).join(' ').toLowerCase();
      }
    }
  });

  function accentsTidy(s){
    var r=s.toLowerCase();
    r = r.replace(new RegExp("[àáâãäå]", 'g'),"a");
    r = r.replace(new RegExp("æ", 'g'),"ae");
    r = r.replace(new RegExp("ç", 'g'),"c");
    r = r.replace(new RegExp("[èéêë]", 'g'),"e");
    r = r.replace(new RegExp("[ìíîï]", 'g'),"i");
    r = r.replace(new RegExp("ñ", 'g'),"n");
    r = r.replace(new RegExp("[òóôõö]", 'g'),"o");
    r = r.replace(new RegExp("œ", 'g'),"oe");
    r = r.replace(new RegExp("[ùúûü]", 'g'),"u");
    r = r.replace(new RegExp("[ýÿ]", 'g'),"y");
    return r;
  };

  return {
    Contact: Contact,
    ContactsList: ContactsList
  };
});
