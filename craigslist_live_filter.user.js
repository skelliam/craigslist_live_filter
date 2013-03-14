// ==UserScript==
// @name           Craiglist Live Filter
// @namespace      srawlins
// @description    Filter out listings with given words on Craigslist
// @include        http://*.craigslist.org/search/*
// ==/UserScript==

var Settings = {
   includetext: "",
   excludetext: "",
   boolregex: true,
   boolgray: true,
   booldisable: true,
}

var clfDiv, clfBr, clfExcludeText, clfIncludeText, listings, clfSettings;

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
   listings = document.evaluate("//blockquote[3]/p",
       document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
     
   for (var i = listings.snapshotLength - 1; i >= 0; i--) {
     var listing = listings.snapshotItem(i);
     for (var j = listing.childNodes.length - 1; j >= 0; j--) {
       if ( listing.childNodes[j].nodeName == "A" ) {
         listing.childNodes[j].innerHTML = listing.childNodes[j].innerHTML.toLowerCase();
         //listing.childNodes[j].innerHTML = listing.childNodes[j].innerHTML.replace(/[\x80-\xFFFF]/g, "X");
       }
       if ( listing.childNodes[j].nodeName == "FONT" ) { listing.childNodes[j].innerHTML = listing.childNodes[j].innerHTML.toLowerCase(); }
     }
   }
}


function getUserSettings() {
   var temp = GM_getValue("CLFsettings", "");
   if (temp == "") {
      //nothing stored yet so let's create a new object
      //is there a more elegant way to init?
      clfSettings = new Array(5);
      clfSettings[0] = eval(uneval(Settings));
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
  var filterRegex = document.getElementById("CLFregex").checked;
  if ( filterRegex ) {
    //detect and tweak bad input
    regString = regex.replace(/[|(]+$/, "")
  } else {
    regString = regex.replace(/[,\s]+$/, "").replace(/,\s?(?=[^,\s])/g, "|")
  }

  return regString;
}

function disableToggle() {
   var stat = document.getElementById("CLFdisable").checked;
   clfExcludeText.disabled = stat;
   clfIncludeText.disabled = stat;
}


function updateFilterType(event) {
   //store user settings
   //GM_setValue("CLFregex", document.getElementById("CLFregex").checked);
   //GM_setValue("CLFgray", document.getElementById("CLFgray").checked);
   //GM_setValue("CLFdisable", document.getElementById("CLFdisable").checked);
   disableToggle();
   updateFilter(event);
}

function resetDisplay() {
  //---Reset display, who knows what the user typed/untyped!
  for (var i = listings.snapshotLength - 1; i >= 0; i--) {
     var listing = listings.snapshotItem(i);
     listing.setAttribute("class", 'filterOK');
     listing.style.display = "block";
  }
  
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

function limit(val, min, max) {
   if (val > max)
      val = max;
   if (val < min)
      val = min;
   return val
}

function writeUserSettings(preset) {

   preset = limit(preset, 0, 4)

   GM_setValue("CLFexcludetext", clfExcludeText.value);
   GM_setValue("CLFincludetext", clfIncludeText.value);

   //for presets
   clfSettings[preset].includetext = clfIncludeText.value;
   clfSettings[preset].excludetext = clfExcludeText.value;
   clfSettings[preset].boolregex = document.getElementById("CLFregex").checked;
   clfSettings[preset].boolgray = document.getElementById("CLFgray").checked;
   clfSettings[preset].booldisable = document.getElementById("CLFdisable").checked;

   GM_setValue("CLFsettings", uneval(clfSettings));
}

function refreshGUI() {
   var preset = getPreset()-1;
   clfExcludeText.value = clfSettings[preset].excludetext;
   clfIncludeText.value = clfSettings[preset].includetext;
   document.getElementById("CLFwords").checked = !clfSettings[preset].boolregex;
   document.getElementById("CLFhide").checked = !clfSettings[preset].boolgray;
   document.getElementById("CLFdisable").checked = clfSettings[preset].booldisable;
}

function updateFilter(event) {

   //reset all of the existing mods to the display
   resetDisplay();

   var filterGray = document.getElementById("CLFgray").checked;
   var filterDisable = document.getElementById("CLFdisable").checked;

   // If blank, leave page "cleaned up"
   if (     ((clfExcludeText.value == "") && (clfIncludeText.value == ""))
         || (filterDisable)
      ) { 
     return false; 
   }


   regString = fixRegex(clfExcludeText.value);
   var excluderegex = new RegExp(regString);
   regString = fixRegex(clfIncludeText.value);
   var includeregex = new RegExp(regString);

   for (var i = listings.snapshotLength - 1; i >= 0; i--) {
      var listing = listings.snapshotItem(i);
      for (var j = listing.childNodes.length - 1; j >= 0; j--) {
         if (    listing.childNodes[j].nodeName == "A"
              || listing.childNodes[j].nodeName == "FONT" ) 
         {

            if (clfExcludeText.value != "") {
               //discard what the user wants to exclude
               if ( listing.childNodes[j].innerHTML.match(excluderegex) ) {
                  //make what the user wants to exclude gray or remove it
                  if (filterGray) {
                     listing.setAttribute("class", 'filterOut');
                     listing.childNodes[j].innerHTML = listing.childNodes[j].innerHTML.replace(excluderegex, "<span class='CLFinvert'>$&</span>");
                     break;  //exclude matched and we are done!
                  } else {
                     listing.style.display = "none";
                     break;
                  }
               } 
            }

            if (clfIncludeText.value != "") {
               // keep want the user wants to include

               if ( listing.childNodes[j].innerHTML.match(includeregex) ) {
                  //highlight what the user is looking for
                  listing.childNodes[j].innerHTML = listing.childNodes[j].innerHTML.replace(includeregex, "<span class='CLFactiveinvert'>$&</span>");
                  break;
               } else {
                  //make the other stuff gray or remove it
                  if (filterGray) {
                     //listing.setAttribute("class", 'filterOut');
                     break;
                  } else {
                     listing.style.display = "none";
                     break;
                  }
               }
            }

         }
      }
   }

   var adjustedHeight = clfExcludeText.clientHeight;
   var maxHeight = 500

   if ( !maxHeight || maxHeight > adjustedHeight ) {
      adjustedHeight = Math.max(clfExcludeText.scrollHeight, adjustedHeight);
      if ( maxHeight )
         adjustedHeight = Math.min(maxHeight, adjustedHeight+5);
      if ( adjustedHeight > clfExcludeText.clientHeight+5 )
         clfExcludeText.style.height = adjustedHeight + "px";
   }

   writeUserSettings(getPreset()-1);
}

function getPreset() {
   temp = Number(document.getElementById("CLFpreset").textContent.substr(1,2));
   return temp;
}

function addGlobalStyle(css) {
   try {
      var elmHead, elmStyle;
      elmHead = document.getElementsByTagName('head')[0];
      elmStyle = document.createElement('style');
      elmStyle.type = 'text/css';
      elmHead.appendChild(elmStyle);
      elmStyle.innerHTML = css;
   } catch (e) {
      if (!document.styleSheets.length) {
         document.createStyleSheet();
      }
      document.styleSheets[0].cssText += css;
   }
}


function rotatePreset() {
   //rotate through presets as user clicks box
   var preset = document.getElementById('CLFpreset');
   var pval = getPreset();

   if (pval < 5) 
      pval += 1;
   else
      pval = 1;

   preset.textContent="P" + String(pval);
   refreshGUI();  //populate fields
}

function main() {
   addGlobalStyle(cssText);

   clfDiv = document.createElement('div');
   clfDiv.setAttribute("id", "clfDiv");
   clfDiv.innerHTML = "<span>Filter:   </span>" +
     "<input type='radio' name='CLFfiltertype' value='regex' id='CLFregex' style='vertical-align: middle;' checked='checked' /><span>regex  </span>" +
     "<input type='radio' name='CLFfiltertype' value='words' id='CLFwords' style='vertical-align: middle;' /><span>words&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>" +
     "<input type='radio' name='CLFhidetype' value='gray' id='CLFgray' style='vertical-align: middle;' checked='checked' /><span>gray  </span>" +
     "<input type='radio' name='CLFhidetype' value='hide' id='CLFhide' style='vertical-align: middle;' /><span>hide&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>" +
     "<input type='checkbox' name='CLFdisabletype' value='disable' id='CLFdisable' style='vertical-align: middle;' /><span>disable</span>" +
     "<span>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>" + 
     "<span title='preset selection' value='1' id='CLFpreset' style='border:solid 1px black;'>P1</span>"

   clfBr = document.createElement('br');

   //create exclude text element with properties
   clfExcludeText = document.createElement('textarea');

   clfExcludeText.cols = 48;
   clfExcludeText.rows = 2;
   clfExcludeText.spellcheck = false;
   clfExcludeText.title = "Filter for listings to exclude"
   clfExcludeText.addEventListener("keyup", updateFilter, false);

   //includetext element is exact duplicate of excludetext
   clfIncludeText = clfExcludeText.cloneNode();
   clfIncludeText.title = "Filter for listings to include"
   clfIncludeText.addEventListener("keyup", updateFilter, false);

   //append everything into the div`
   clfDiv.appendChild(clfBr);
   clfDiv.appendChild(clfExcludeText);
   clfDiv.appendChild(clfBr.cloneNode());
   clfDiv.appendChild(clfIncludeText);

   document.body.appendChild(clfDiv);

   document.getElementById("CLFregex").addEventListener("click", updateFilterType, false);
   document.getElementById("CLFwords").addEventListener("click", updateFilterType, false);
   document.getElementById("CLFgray").addEventListener("click", updateFilterType, false);
   document.getElementById("CLFhide").addEventListener("click", updateFilterType, false);
   document.getElementById("CLFdisable").addEventListener("click", updateFilterType, false);
   document.getElementById("CLFpreset").addEventListener("click", rotatePreset, false);

   getUserSettings();
   disableToggle();
   getListings();
   updateFilter();
}

main();
