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
    url: '/assets/fakecontacts/fakecontacts.json'
  });

  return {
    Contact: Contact,
    ContactsList: ContactsList
  };
});
