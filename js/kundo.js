Kundo = {
    TOPIC_MAPPING: {
        "Q": {
            "full": "Ställ en fråga",
            "compact": "Fråga"
        },
        "S": {
            "full": "Lämna ett förslag",
            "compact": "Förslag"
        },
        "P": {
            "full": "Rapportera problem",
            "compact": "Problem"
        },
        "B": {
            "full": "Ge beröm",
            "compact": "Beröm"
        }
    },

    /*
        iOS intercepts all http calls, and captures preregistered ones. So by
        setting the URL of this iframe, it's possible to communicate between
        the web view and native code. kund-o:// is the scheme
        for native code interaction.
    */
    createBridge: function() {
        var nativeBridge = document.createElement("iframe");
        nativeBridge.setAttribute("style", "display:none; height:0; width:0");
        nativeBridge.setAttribute("frameborder","0");
        document.documentElement.appendChild(nativeBridge);
        return nativeBridge;
    },

    /*
        This is called by native code as a response
        to the bridgeReady event
    */
    ready: function(slug, userEmail, userName) {
        // Create "API" as a global variable
        window.API = new KundoAPI(slug);

        // Fetch initial forum data here, to save time for later
        window.FORUM = null;
        Kundo.fetch_forum();
    },

    /*
        Fetch initial data about the forum
    */
    fetch_forum: function(callback) {
        callback = callback || function(){};
        if (window.FORUM) {
            callback(window.FORUM);
            return;
        }

        API.GET.properties({
            callback: function(data){
                window.FORUM = data[0];
                callback(window.FORUM);
            }
        });
    },

    /*
        jQuery Mobile does not support query parameters in the URL by default,
        so we patch it in.
    */
    patch_changepage: function(event, data){
        if (typeof data.toPage === "string") {
            var url = $.mobile.path.parseUrl(data.toPage),
                $page = $(url.hash.replace(/\?.*$/, "")),
                params = API.qs_to_obj(url.hash.replace(/^.*\?/, ""));

            data.options.dataUrl = url.href;
            data.options.params = params;

            $.mobile.changePage($page, data.options);
            event.preventDefault();
        }
    },

    /*
        Route to the correct controller based on hash, and send in the
        values from the query string as parameters.
    */
    route: function(event, data){
        var page = data.toPage;
        var params = data.options.params;
        if (page.attr("id") == "select-type") {
            Kundo.Controllers.selecttype();
        } else if (page.attr("id") == "feedback-form") {
            Kundo.Controllers.feedbackform(params.type);
        } else if (page.attr("id") == "dialog-page") {
            Kundo.Controllers.dialogpage(params.id);
        }
    },

    Templates: {
        html_for_message: function(message, error, icon){
            error = error || false;
            icon = icon || "alert"
            return '<div class="kundo-message ' + ((error)?"error":"") + '">' +
                    '<span class="ui-icon ui-icon-' + icon + '"></span>' +
                    '<span class="message">' + message + '</span>' +
                '</div>';
        },
        html_for_user: function(data) {
            return '<img width="47" height="47" src="' + data.user.gravatar_image + '">' +
                '<strong>' + data.user.first_name + '</strong>' +
                '<time datetime="' + data.pub_date + '">' + data.pub_date + '</time>'
        }
    },

    /* Loading and sending of feedback form */
    Controllers: {
        selecttype: function(){
            var page = $("#select-type");
            Kundo.fetch_forum(function(forum){
                var title = forum.name;
                page.find("h1").text(title);
                $("title").text(title);

                var list = page.find("#dialog-types").empty();
                $.each(forum.enabled_topics, function(idx, topic_key){
                    list.append(
                        '<li><a href="#feedback-form?type=' + topic_key + '">' +
                            Kundo.TOPIC_MAPPING[topic_key].full +
                        '</a></li>'
                    );
                });
                list.listview("refresh");
            });
        },
        feedbackform: function(type) {
            type = type.toUpperCase();
            var DIALOGS_PER_PAGE = 5;
            var form = $("#feedback-form form");
            var search_container = form.find("#search-container");
            var dialog_list = $("#dialog-list");

            /* Set the page header */
            var title = Kundo.TOPIC_MAPPING[type].full;
            $("#feedback-form h1:first").text(title)
            $("title").text(title);

            /* Clear errors if a new form type */
            var current_type = form.find('#form_topic').val();
            if (current_type && current_type != type) {
                form[0].reset();
                form.find('.kundo-message.error').remove();
                search_container.empty();
                form.find("#form_title").autocomplete("destroy");
                dialog_list.empty();
            }

            /* Prepare form for sending, and set callbacks for responses */
            var api_url = API.BASE_URL + "/" + API.slug;
            form.attr("action", api_url);
            form.find('#form_topic').val(type);
            form.find('#form_error_url').val(api_url + "/js-endpoint/");
            form.find('#form_success_url').val(api_url + "/js-endpoint/");
            form.submit(function(){
                API.POST.dialog(this, {
                    success: function(){
                        Kundo.fetch_forum(function(forum){
                            form.before(
                                '<div class="thanks">' +
                                    '<h2>Tack!</h2>' +
                                    '<p>' + forum.thankyou_message + '</p>' +
                                '</div>'
                            ).remove();
                        });
                    },
                    error: function(data){
                        form.find('.kundo-message.error').remove();
                        $.each(data, function(name, message) {
                            form.find("[name='" + name + "']").after(
                                Kundo.Templates.html_for_message(message, true)
                            );
                        });
                    }
                });
            });

            /* Prepare title/search field */
            var SEARCH_MIN_LENGTH = 3;
            form.find("#form_title").autocomplete({
                minLength: SEARCH_MIN_LENGTH,
                delay: 800,
                source: function(request, response) {
                    var query = encodeURIComponent($.trim(request.term));
                    API.GET.search(query, {
                        callback: function(data){
                            if (data.length == 0) return;

                            /* Fill the search box with results*/
                            var results = $("#search-results");
                            var refresh_needed = (results.find("li").length > 0);
                            results.empty();
                            var hit_len = Math.min(data.length, DIALOGS_PER_PAGE);
                            for (var i = 0; i < hit_len; i++) {
                                results.append(
                                    '<li><a href="#dialog-page?id=' + data[i].id + '">' +
                                        '<span class="ui-li-count">' + data[i].num_comments + ' svar</span>' +
                                        data[i].title +
                                    '</a></li>'
                                );
                            }
                            if (refresh_needed) {
                                results.listview("refresh");
                            }

                            /* Add message and link for opening the search result dialog */
                            var message = '<a href="#search-dialog" data-rel="dialog" class="ui-link">Hittade ' + hit_len + ' liknande inlägg</a>';
                            search_container
                                .empty().hide()
                                .append(Kundo.Templates.html_for_message(message, false, "search"))
                                .fadeIn();
                        }
                    });
                }
            }).keyup(function(event){
                if ($(this).val().length < SEARCH_MIN_LENGTH) {
                    search_container.empty();
                }
            });

            /* Fetch popular dialogs of a given type */
            if (dialog_list.find("li").length == 0) {
                API.GET.popular(type, {
                    callback: function(data){
                        if (data.length == 0) {
                            dialog_list.append('<li>Hittade inget inlägg.</li>');
                            dialog_list.listview('refresh');
                            return;
                        }
                        for (var i = 0, len = Math.min(data.length, DIALOGS_PER_PAGE); i < len; i++) {
                            dialog_list.append(
                                '<li data-theme="a"><a href="#dialog-page?id=' + data[i].id + '">' +
                                    '<span class="ui-li-count">' + data[i].num_comments + ' svar</span>' +
                                    data[i].title +
                                '</a></li>'
                            );
                        }
                        dialog_list.listview('refresh');
                    }
                });
            }
        },
        dialogpage: function(id) {
            var dialog_page = $("#dialog-page");

            /* Render data about the current dialog */
            API.GET.single(id, {
                callback: function(data){
                    var title = Kundo.TOPIC_MAPPING[data.topic].compact;
                    $("title").text(title);
                    dialog_page
                        .find("h1:first,").text(title).end()
                        .find("h2:first").text(data.title).end()
                        .find("#dialog-content").html(data.text).end()
                        .find(".meta:first").html(Kundo.Templates.html_for_user(data)).end();

                    var state = dialog_page.find("#state").empty();
                    state.parent().hide();
                    if (data.state) {
                        Kundo.fetch_forum(function(forum){
                            var message = forum.formal_name + " har markerat att " + data.state;
                            state.html(
                                Kundo.Templates.html_for_message(message, false, "info")
                            );
                            state.parent().show();
                        });
                    }
                }
            });

            /* Render data about the current dialog's comments */
            var comments_box = dialog_page.find("#dialog-comments");
            comments_box.empty();
            API.GET.comments(id, {
                sort: "pub_date",
                callback: function(data){
                    if (data.length == 0) {
                        comments_box.append('<li>Inga kommentarer.</li>');
                        comments_box.listview('refresh');
                        return;
                    }
                    for (var i = 0, len = data.length; i < len; i++) {
                        comments_box.append(
                            '<li data-theme="' + (data[i].is_org_reply? "d": "") + '">' +
                                '<div>' +
                                    data[i].text +
                                    '<div class="meta">' +
                                        Kundo.Templates.html_for_user(data[i]) +
                                    '</div>' +
                                '</div>' +
                            '</li>'
                        );
                    }
                    comments_box.listview('refresh');
                }
            });
        }
    },

    /*
        Initialize. Called from KundoViewController.m or
        directly at the bottom of this file when testing
    */
    init: function() {
        $(document).bind('pagebeforechange', Kundo.patch_changepage);
        $(document).bind('pagechange', Kundo.route);

        //Kundo.bridge = Kundo.createBridge();
        //Kundo.bridge.src = "kund-o://bridgeReady";

        // TEMPORARY: Makes testing possible without iOS. This is normally
        // called from iOS in response the the bridgeReady call above
        Kundo.ready('kundo', '', '');
    }
}

// TODO: Temporary, to make testing possible without iOS.
Kundo.init();
