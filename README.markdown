A Greasemonkey User Script
==========================
v 1.2

Summary
-------
A fork of https://github.com/srawlins/craigslist_live_filter

This script adds two boxes to the lower right of craigslist search pages.  The script adds a filter-out box (top) and a filter-in box (bottom).  Listings are not set to all lowercase, instead I use case-insensitive searching.

Search options will persist after you close your browser.  You can save up to five 'preset' searches and they'll all persist even after closing the browser.  This lets you save your Jeep Wranger search separate from a search for a Dell Laptop or Ikea furniture.

Features at a glance:

+ filter out listings by regex or by lists of words
+ filter in listings by regex or by lists of words
+ gray out filtered-out listings, or hide them
+ persistent settings (up to five different) and filter text (uses Greasemonkey's storage)

How to Use
----------
There are two ways to list the content that you want filtered out.

+ First is with regex (regular expressions). This is a sweet feature, but personally I've been using the second way.
+ The second way is with words, comma-separated. You can simply list terms you wish to filter out, like so:

Examples
--------

+ In "words" mode, "apartment, 1ba" will filter out all listings with the term "apartment" or with the term "1ba".
+ In "words" mode, "vail" will unfortunately filter out all listings with the term "vail", including any with the word "available". :( **It is not a whole-word-only filter.**
+ In "regex" mode, "\Wvail" will filter out listings with terms such as "(vail" and " vail", but not "available" ("\W" is regex for a non-word character).
+ In "regex" mode, "apartment|1ba" gives the same results as the above "words" mode example.
+ In "words" mode, "oro valley, loma linda" will filter out all listings with the term "oro valley" or with the term "loma linda"; spaces are fair game within a term; **commas** are used to separate terms.
+ In "words" mode, you can secretly add most forms of regex as well: "\Wapt\W, \Wvail\W, ranch" will search for the term "ranch" and the terms "apt" and "vail" with non-word characters surrounding them (thus *not* matching "aptitude" or "available").

Filter-Out Display
------------------
You can also choose how filtered-out listings are displayed. The two choices are:

+ Gray: Gray out listings, and highlight the term that caused the listing to be filtered out.
+ Hide: Hide the filtered-out listings.

Todo
----

+ Drop down to view more than one page of listings.
+ Other UI tweaks, like listing $/month/person or something...
+ X out listings as you go.
+ Date separaters
+ I'm noticing a performance lag when I have > 60 words filtered...

Changes
-------

v 1.2

+ Tweaked performance
+ Fixed so only displays on search results pages

v 1.1

+ Added filtered-word highlighting

v 1.0

+ initial release
