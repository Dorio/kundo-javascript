Simple Javascript library to access Kundo's API
===============================================

Test with live data:
--------------------

Clone this repository, and open [test_get.html](https://github.com/kundo/kundo-javascript/blob/master/test_get.html) or [test_post.html](https://github.com/kundo/kundo-javascript/blob/master/test_post.html) locally.

Examples of GET:s against the API:
----------------------------------

``` js
// Create a new API object, that will be used for all subsequent calls
var API = new KundoAPI(slug);

// Get all dialogs in your forum (API gives you 50 at a time)
API.all({
  callback: function(data){ console.log(data); }
});

// Get the next 50 dialogs in your forum
API.all({
  start: 50,
  callback: function(data){ console.log(data); }
});

// Get the all dialogs of the type "q". Other types are: q, p, s, b.
API.topic("q", {
  callback: function(data){ console.log(data); }
});

// Search your forum for a specific phrase. The matched phrase will be
// highlighted with <span class="highlighted">phrase</span>
API.search("fråga", {
  callback: function(data){ console.log(data); }
});

// We want to demo fetching one specific ID, but we don't know the ID of any
// posts in your specific forum. So lets get all dialogs, fetch the ID
// of the first dialogs we find, and make a request for that dialog.
// While we're there, get all the comments for that dialog too.
API.all({
  sort: "pub_date",
  callback: function(data){
    var dialog_id = data[0].id;
    API.single(dialog_id, {
      callback: function(data){ console.log(data); }
    });
    API.comments(dialog_id, {
      sort: "pub_date",
      callback: function(data){ console.log(data); }
    });
  }
});
```

Examples of POST:s against the API:
-----------------------------------

``` js
// Success will be called if the dialog was posted correctly.
// You are free to provide any callback you like. In this case we
// remove all previous errors and show an alert.
function success(){
  $('.kundo_error').remove();
  alert("Your message was successfully posted");
}

// Error will be called if there's a validation error. It receives a
// objects with keys representing the keys that where incorrect, and
// values specifying what the error message was. In this case we remove
// all previous errors and create an error message connected to each
// input field.
function error(data){
  $('.kundo_error').remove();
  $.each(data, function(name, error) {
    $("[name='" + name + "']").after(
      $('<span class="kundo_error">' + error + '</span>')
    );
  });
}

// Post to the dialog, sending in the form that you want to post,
// and the two callback previous defined. The API will create a hidden
// iframe, post the data in that iframe, and receive the response, parse
// it and call either the success or error callbacks.
API.POST.dialog(form, {
  success: success,
  error: error
});
```
