function KundoAPI(slug, format) {
  // Instance variables
  this.BASE_URL = "http://kundo.se/api";
  if (format != "json" && format != "xml") {
    throw "Invalid format type. Please use either json or xml.";
  }
  this.format = "." + format;
  if (!slug) {
    throw "Invalid slug. Please provide a proper slug.";
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

  // Helper
  this.get = function(url, settings) {
    var params = [];
    for (attrname in settings) {
      if (attrname == "callback") { continue; }
      params.push(attrname + "=" + settings[attrname]);
    }
    url = this.BASE_URL + url + "?" + params.join("&");
    $.ajax({ url: url, dataType: "jsonp", success: settings.callback });
  }

  // Get data from your forum
  this.all = function(settings) {
    settings = $.extend({}, default_sorted_settings, settings);
    this.get('/' + this.slug + this.format, settings);
  }
  this.single = function(id, settings) {
    if (!id || !typeof id == "number") {
      throw "Invalid id. It should be numeric.";
    }
    settings = $.extend({}, default_plain_settings, settings);
    this.get('/dialog/' + this.slug + '/' + id + this.format, settings);
  }
  this.comments = function(id, settings) {
    if (!id || !typeof id == "number") {
      throw "Invalid id. It should be numeric.";
    }
    settings = $.extend({}, default_sorted_settings, settings);
    this.get('/comment/' + this.slug + '/' + id + this.format, settings);
  }
  this.topic = function(type, settings) {
    if (type != "q" && type != "p" && type != "s" && type != "b") {
      throw "Invalid topic type. Please use one of: q, p, s, b.";
    }
    settings = $.extend({}, default_sorted_settings, settings);
    this.get('/' + this.slug + '/' + type + this.format, settings);
  }
  this.search = function(query, settings) {
    if (!query) { return; }
    query = decodeURIComponent(query);
    settings = $.extend({}, default_plain_settings, settings);
    this.get('/search/' + this.slug + '/' + query + this.format, settings);
  }
}
