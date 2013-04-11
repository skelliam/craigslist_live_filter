// ==UserScript==
// @name           Craiglist Live Filter
// @namespace      srawlins
// @description    Filter out listings with given words on Craigslist
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js
// @include        http://*.craigslist.org/search/*
// ==/UserScript==

var Settings = {
   includetext: "",
   excludetext: "",
   boolregex: true,
   boolgray: true,
   booldisable: true,
}

var jExcludeText, jIncludeText, listings, clfSettings;
var desiredPreset = 0;

var cssText = 
  "div#clfDiv {\n" +
  "  position: fixed;\n" +
  "  bottom: 5px;\n" +
  "  right: 5px;\n" +
  "  font-family: sans-serif;\n" +
  "  font-size: 0.8em;\n" +
  "  padding: 0.1em;\n" +
  "}\n\n" +

  "div#clfDiv * {\n" +
  "  vertical-align: middle;\n" +
  "}\n\n" +

  "div#clfDiv textarea {\n" +
  "  font-family: sans-serif;\n" +
  "  font-size: 1.1em;\n" +
  "  background-color: #ffffff;\n" +
  "  opacity: 0.700\n" +
  "}\n\n" +

  "blockquote p {\n" +
  "  padding-top: 6px;\n" +
  "  padding-bottom: 6px;\n" +
  "  margin: 0px;\n" +
  "}\n\n" +

  ".filterOK {\n" +
  "  font-size: 1em;\n" +
  "}\n\n" +

  ".filterOut {\n" +
  "  color: #999999;\n" +
  "  font-size: 0.8em;\n" +
  "  padding-top: 0px;\n" +
  "  padding-bottom: 0px;\n" +
  "}\n\n" +

  ".filterOut a {\n" +
  "  color: #999999;\n" +
  "}\n\n" +

  ".filterOut span.p {\n" +
  "  color: #999999;\n" +
  "}\n\n" +

  ".filterIn {\n" +
  "  color: #0000ff;\n" + 
  "}\n\n" +

  ".CLFactiveinvert {\n" +
  "  background-color: #CCCCCC;\n" +
  "}\n" +

  ".CLFinvert {\n" +
  "  background-color: #CCCCCC;\n" +
  "  color: #FFFFFF;\n" +
  "}\n";

function getListings() {
   listings = $("#toc_rows > p.row");  
}


function getUserSettings() {
   var temp = GM_getValue("CLFsettings", "");
   desiredPreset = Number(GM_getValue("CLFpreset", ""));

   if (temp == "") {
      //nothing stored yet so let's create a new object
      //is there a more elegant way to init?
      clfSettings = new Array(5);
      clfSettings[0] = eval(uneval(Settings));  //init each element in the array as a new Settings object
      clfSettings[1] = eval(uneval(Settings));
      clfSettings[2] = eval(uneval(Settings));
      clfSettings[3] = eval(uneval(Settings));
      clfSettings[4] = eval(uneval(Settings));
   } else {
      //something is there to we need to de-serialize it
      clfSettings = eval(temp);  //un-serialize the string
   }

   refreshGUI();  //populate fields
}

function fixRegex(regex) {
  if ( $("#CLFregex").prop('checked') ) {
    //detect and tweak bad input
    regString = regex.replace(/[|(]+$/, "")
  } else {
    regString = regex.replace(/[,\s]+$/, "").replace(/,\s?(?=[^,\s])/g, "|")
  }

  return regString;
}

function animateOpenClose() {
}

function disableToggle() {
   jExcludeText.disabled = $("#CLFdisable").prop("checked");;
   jIncludeText.disabled = $("#CLFdisable").prop("checked");;
   animateOpenClose()
}


function updateFilterType(event) {
   //store user settings
   writeUserSettings(desiredPreset);
   disableToggle();
   updateFilter(event);
}

function resetDisplay() {
  //---Reset display, who knows what the user typed/untyped!

  listings.each( function() {
     $(this).attr('class', 'filterOK');
     $(this).css('display', 'inherit');  //restore stuff that was possibly hidden
  });

  //inversions are text inversions
  //commenting this out for the jQuery version of this script, I'm looking at the entire 
  //internal text of the listing, can't really do inversions anymore --Skellenger 4/10/13
  if (0) {
     var inversions = document.evaluate("//*[@class='CLFinvert']",
       document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
     for (var i = inversions.snapshotLength - 1; i >= 0; i--) {
        var inversion = inversions.snapshotItem(i);
        inversion.parentNode.replaceChild(document.createTextNode(inversion.innerHTML), inversion);
     }

     var inversions = document.evaluate("//*[@class='CLFactiveinvert']",
       document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
     for (var i = inversions.snapshotLength - 1; i >= 0; i--) {
        var inversion = inversions.snapshotItem(i);
        inversion.parentNode.replaceChild(document.createTextNode(inversion.innerHTML), inversion);
     }
  }
}

function limit(val, min, max) {
   if (val > max)
      val = max;
   if (val < min)
      val = min;
   return val
}

function writeUserSettings(preset) {

   preset = limit(preset, 0, 4)

   //GM_setValue("jExcludeText", jExcludeText.value);
   //GM_setValue("jIncludeText", jIncludeText.value);
   GM_setValue("CLFpreset", desiredPreset);

   //for presets
   clfSettings[preset].includetext = jIncludeText.val();
   clfSettings[preset].excludetext = jExcludeText.val();
   clfSettings[preset].boolregex = $("#CLFregex").prop("checked");
   clfSettings[preset].boolgray = $("#CLFgray").prop("checked");
   clfSettings[preset].booldisable = $("#CLFdisable").prop("checked");

   //console.log(clfSettings);

   GM_setValue("CLFsettings", uneval(clfSettings));
}

function refreshGUI() {
   var preset = desiredPreset;
   jExcludeText.val(clfSettings[preset].excludetext);
   jIncludeText.val(clfSettings[preset].includetext);

   $("#CLFwords").prop("checked", !clfSettings[preset].boolregex);
   $("#CLFhide").prop("checked", !clfSettings[preset].boolgray);

   $("#CLFdisable").prop("checked", clfSettings[preset].booldisable);

   disableToggle();
   updatePresetLabel();
}

function updateFilter(event) {

   //reset all of the existing mods to the display
   resetDisplay();

   var filterGray = $("#CLFgray").prop("checked");
   var filterDisable = $("#CLFdisable").prop("checked");

   // If blank, leave page "cleaned up"
   if (     ((jExcludeText.val() == "") && (jIncludeText.val() == ""))
         || (filterDisable)
      ) { 
     return false; 
   }


   regString = fixRegex(jExcludeText.val());
   var excluderegex = new RegExp(regString, 'i');  //'i' means case-insensitive
   regString = fixRegex(jIncludeText.val());
   var includeregex = new RegExp(regString, 'i');

   listings.each(function() {
      if (jExcludeText.val() != "") {
         //discard what the user wants to exclude
         if ( $(this).text().match(excluderegex) ) {
            //make what the user wants to exclude gray or remove it
            if (filterGray) {
               $(this).attr("class", "filterOut");
               //highlighting the text doesn't work when looking at the entire innertext
               //$(this).html($(this).html().replace(excluderegex, "<span class='CLFinvert'>$&</span>"));
               return;  //exclude matched and we are done!
            } else {
               $(this).css('display', 'none');
               return;
            }
         } 
      }

      if (jIncludeText.val() != "") {
         // keep want the user wants to include

         if ( $(this).text().match(includeregex) ) {
            //highlight what the user is looking for
            //highlighting the text dosn't work when looking at the entire innertext
            //$(this).html($(this).html().replace(includeregex, "<span class='CLFactiveinvert'>$&</span>"));
            return;
         } else {
            //make the other stuff gray or remove it
            if (filterGray) {
               $(this).attr("class", "filterOut");
               return;
            } else {
               $(this).css('display', 'none');
               return;
            }
         }
      }
   });

   //not sure what this stuff was originally for (Skellenger 4/10/13)

   //var adjustedHeight = jExcludeText.clientHeight;
   //var maxHeight = 500

   //if ( !maxHeight || maxHeight > adjustedHeight ) {
   //   adjustedHeight = Math.max(jExcludeText.scrollHeight, adjustedHeight);
   //   if ( maxHeight )
   //      adjustedHeight = Math.min(maxHeight, adjustedHeight+5);
   //   if ( adjustedHeight > jExcludeText.clientHeight+5 )
   //      jExcludeText.style.height = adjustedHeight + "px";
   //}

   writeUserSettings(desiredPreset);
}

function updatePresetLabel() {
   $("#CLFpreset").text("P" + String(desiredPreset+1));  //user index value 1-5
}

function addGlobalStyle(css) {
   try {
      var elmStyle;
      elmStyle = $("<style>").prop("type", "text/css");
      elmStyle.html(css);
      $(document.head).append(elmStyle);
   } catch (e) {
      if (!document.styleSheets.length) {
         document.createStyleSheet();
      }
      document.styleSheets[0].cssText += css;
   }
}


function rotatePreset(event) {
   //rotate through presets as user clicks box
   //console.log(desiredPreset);

   if (desiredPreset < 4) 
      desiredPreset += 1;
   else
      desiredPreset = 0;

   refreshGUI();  //populate fields
   updateFilterType(event);
}

function main() {
   addGlobalStyle(cssText);

   var jDiv = $("<div id='clfDiv'>");
   jDiv.append($("<span>Filter:   </span>"));
   jDiv.append($("<input type='radio' name='CLFfiltertype' value='regex' id='CLFregex' style='vertical-align: middle;' checked='checked' />"));

   jDiv.append($("<span>regex  </span>"));
   jDiv.append($("<input type='radio' name='CLFfiltertype' value='words' id='CLFwords' style='vertical-align: middle;' />"));

   jDiv.append($("<span>words&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>"));
   jDiv.append($("<input type='radio' name='CLFhidetype' value='gray' id='CLFgray' style='vertical-align: middle;' checked='checked' />"));

   jDiv.append($("<span>gray  </span>"));
   jDiv.append($("<input type='radio' name='CLFhidetype' value='hide' id='CLFhide' style='vertical-align: middle;' />"));

   jDiv.append($("<span>hide&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>"));
   jDiv.append($("<input type='checkbox' name='CLFdisabletype' value='disable' id='CLFdisable' style='vertical-align: middle;' />"));

   jDiv.append($("<span>disable</span>"));
   jDiv.append($("<span>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>"));

   jDiv.append($("<span title='preset selection' value='1' id='CLFpreset' style='cursor:pointer; border:solid 1px black;'>P1</span>"));
   jDiv.append("<br>");

   //create exclude text element with properties
   jExcludeText = ($("<textarea cols='48' rows='2' spellcheck='false' title='Filter for listings to exclude'/>"));
   jExcludeText.keyup(updateFilter);
   jDiv.append(jExcludeText);

   jDiv.append("<br>");

   jIncludeText = jExcludeText.clone(true);
   jIncludeText.prop('title', "Filter for listings to include");
   jDiv.append(jIncludeText);

   $(document.body).append(jDiv);

   $("#CLFdisable").click(updateFilterType);
   $("#CLFregex").click(updateFilterType);
   $("#CLFwords").click(updateFilterType);
   $("#CLFgray").click(updateFilterType);
   $("#CLFhide").click(updateFilterType);
   $("#CLFpreset").click(rotatePreset);

   getUserSettings();
   disableToggle();
   getListings();
   updateFilter();
}

main();
