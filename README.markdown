Simple Javascript library to access Kundo's API
===============================================

Test with live data:
--------------------

Clone this repository, and open [index.html](https://github.com/kundo/kundo-javascript/blob/master/index.html) locally.

Examples:
---------

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
