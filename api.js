function KundoAPI(slug) {
  // Instance variables
  this.BASE_URL = "http://localhost:8000/api";
  this.FORMAT = ".json";
  if (!slug) {
    throw new Error("Invalid slug. Please provide a proper slug.");
  }
  this.slug = slug;

  // Defaults
  var callback = function(data){ console.log(data); }
  var default_sorted_settings = {
    callback: callback,
    start: 0,
    sort: "-pub_date"
  }
  var default_plain_settings = {
    callback: callback,
    start: 0
  }

  // Helpers
  this.obj_to_qs = function(obj){
    var params = [];
    for (attrname in obj) {
      if (attrname == "callback") { continue; }
      params.push(attrname + "=" + decodeURIComponent(obj[attrname]));
    }
    return params.join("&")
  }
  this.extend = function(obj1, obj2) {
    return jQuery.extend({}, obj1, obj2);
  }
  this.jsonp_get = function(url, settings) {
    var params = this.obj_to_qs(settings);
    url = this.BASE_URL + url + "?" + params;
    jQuery.ajax({ url: url, dataType: "jsonp", success: settings.callback });
  }
  this.ajax_post = function(url, data, settings) {
    // Cross domain POST is not possible with IE6 and IE7 so we
    // simulate it with a jsonp_get instead.
    settings = $.extend({}, data, settings);
    this.jsonp_get(url, settings);
  }

  // Allow access to "this" inside this.GET and this.POST
  var that = this;

  // Get data from your forum
  this.GET = {
    all: function(settings) {
      settings = that.extend(default_sorted_settings, settings);
      that.jsonp_get('/' + that.slug + that.FORMAT, settings);
    },
    single: function(dialog_id, settings) {
      if (!dialog_id || !typeof dialog_id == "number") {
        throw new Error("Invalid id. It should be numeric.");
      }
      settings = that.extend(default_plain_settings, settings);
      that.jsonp_get('/dialog/' + that.slug + '/' + dialog_id + that.FORMAT, settings);
    },
    comments: function(dialog_id, settings) {
      if (!dialog_id || !typeof dialog_id == "number") {
        throw new Error("Invalid id. It should be numeric.");
      }
      settings = that.extend(default_sorted_settings, settings);
      that.jsonp_get('/comment/' + that.slug + '/' + dialog_id + that.FORMAT, settings);
    },
    topic: function(type, settings) {
      if (type != "q" && type != "p" && type != "s" && type != "b") {
        throw new Error("Invalid topic type. Please use one of: q, p, s, b.");
      }
      settings = that.extend(default_sorted_settings, settings);
      that.jsonp_get('/' + that.slug + '/' + type + that.FORMAT, settings);
    },
    search: function(query, settings) {
      if (!query) { return; }
      query = decodeURIComponent(query);
      settings = that.extend(default_plain_settings, settings);
      that.jsonp_get('/search/' + that.slug + '/' + query + that.FORMAT, settings);
    }
  }

  // Post data to your forum
  this.POST = {
    dialog: function(dialog, settings) {
      if (!dialog.name || !dialog.useremail || !dialog.topic || !dialog.title || !dialog.text) {
        throw "Need to specify both name, useremail, topic, title, and text.";
      }
      that.ajax_post('/' + that.slug, dialog, settings);
    },
    comment: function(dialog_id, comment, settings) {
      if (!dialog_id || !typeof dialog_id == "number") {
        throw "Invalid id. It should be numeric.";
      }
      if (!dialog.name || !dialog.useremail || !dialog.text) {
        throw "Need to specify both name, useremail, and text.";
      }
      that.ajax_post('/comment/' + that.slug + '/' + dialog_id, comment, settings);
    },
    vote: function(dialog_id, comment, settings) {
      if (!dialog_id || !typeof dialog_id == "number") {
        throw "Invalid id. It should be numeric.";
      }
      if (!dialog.name || !dialog.useremail) {
        throw "Need to specify both name and useremail.";
      }
      that.ajax_post('/vote/' + that.slug + '/' + dialog_id, comment, settings);
    }
  }
}
