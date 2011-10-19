/*
This script helps to put readable links to Open Library books into
online book catalogs.

When loaded, it searches the DOM for <div> elements with class
"ol_readapi_book", extracts book identifiers from them (e.g. isbn,
lccn, etc.) and puts those into an asynchronous call to the Read API.

When the call returns, the results are used to add clickable links
to the "ol_readapi_book" elements found earlier.

A demonstration use of this script is available here:

http://internetarchive.github.com/read_api_extras/readapi_demo.html
*/

var ol_readapi_automator =
(function () { // open anonymous scope for tidiness

// 'constants'
var readapi_bibids = ['isbn', 'lccn', 'oclc', 'olid', 'iaid', 'bibkeys'];
var magic_classname = 'ol_readapi_book';

// added to book divs to correlate with API results
var magic_bookid = 'ol_bookid';
var ol_button_classname = 'ol_readapi_button';

// Find all book divs and concatenate ids from them to create a read
// API query url
function create_query() {
    var q = 'http://openlibrary.org/api/volumes/brief/json/';

    function add_el(i, el) {
        // tag with number found so it's easy to discover later
        // (necessary?  just go by index?)
        // (choose better name?)
        $(el).attr(magic_bookid, i);

        if (i > 0) {
            q += '|';
        }
        q += 'id:' + i;

        for (bi in readapi_bibids) {
            bibid = readapi_bibids[bi];
            if ($(el).attr(bibid)) {
                q += ';' + bibid + ':' + $(el).attr(bibid);
            }
        }
    }

    $('.' + magic_classname).each(add_el);
    return q;
}

function make_read_button(bookdata) {
    buttons = {
        'full access':
        "http://openlibrary.org/images/button-read-open-library.png",
        'lendable':
        "http://openlibrary.org/images/button-borrow-open-library.png",
        'checked out':
        "http://openlibrary.org/images/button-checked-out-open-library.png"
    };
    if (bookdata.items.length == 0) {
        return false;
    }
    first = bookdata.items[0];
    if (!(first.status in buttons)) {
        return false;
    }
    result = '<a href="' + first.itemURL + '">' +
      '<img class="' + ol_button_classname +
      '" src="' + buttons[first.status] + '"/></a>';
    return result;
}

// Default function for decorating document elements with read API data
function default_decorate_el_fn(el, bookdata) {
    // Note that 'bookdata' may be undefined, if the Read API call
    // didn't return results for this book
    if (!bookdata) {
        decoration = 'Not found';
    } else {
        decoration = make_read_button(bookdata);
    }
    if (decoration) {
        el.innerHTML += decoration;
    }
}

function do_query(q, decorate_el_fn) {
    if (!decorate_el_fn) {
        decorate_el_fn = default_decorate_el_fn;
    }
    var starttime = (new Date()).getTime();

    // Call a function on each <div class="ol_readapi_book"> element
    // with the target element and the data found for that element.
    // Use decorate_el_fn if supplied, falling back to
    // default_decorate_el_fn, above.
    function query_callback(data, textStatus, jqXHR) {
        var endtime = (new Date()).getTime();
        var duration = (endtime - starttime) / 1000;
        // console.log('took ' + duration + ' seconds');

        $('.' + magic_classname).each(function(i, el) {
                var bookid = $(el).attr(magic_bookid);
                if (bookid && bookid in data) {
                    decorate_el_fn(el, data[bookid]);
                } else {
                    decorate_el_fn(el);
                }
            });
    }

    // console.log('calling ' + q);
    $.ajax({ url: q,
                data: { 'show_all_items': 'true' },
                dataType: 'jsonp',
                success: query_callback
                });
}

// Do stuff
var q = create_query();
do_query(q);

result = {
    do_query: do_query,
    create_query: create_query,
    make_read_button: make_read_button
};

return result;
})(); // close anonymous scope

/*

Possible futures:

* Support alternate query targets, e.g. Hathi
* show_all_items
* show_inlibrary
* ezproxy prefix (implies show_inlibrary?)
* console debug output? (check all console.log)

*/
