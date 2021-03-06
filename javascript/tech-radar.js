var defaultRadarUrl = "radars/lsTechRadar.json";
var defaultRadarJson = '{"mainTitle": "Test radar","blips":{"1":{"x":399,"y":449,"label":"AWS","shape":"circle"},"2":{"x":294,"y":477,"label":"GCP","shape":"circle"},"3":{"x":500,"y":358,"label":"Grafana","shape":"circle"},"4":{"x":386,"y":364,"label":"Trunk based development","shape":"circle"},"5":{"x":408,"y":319,"label":"dsfvdsf","description":"","shape":"circle"},"6":{"x":326,"y":78,"label":"sdfv","description":"","shape":"circle"},"7":{"x":304,"y":328,"label":"sdfv","description":"","shape":"circle"},"8":{"x":371,"y":114,"label":"sdfvsdv","description":"","shape":"circle"},"9":{"x":326,"y":285,"label":"sdfbsdfb","description":"","shape":"circle"},"10":{"x":299,"y":214,"label":"sdfbsdb","description":"","shape":"circle"},"11":{"x":180,"y":320,"label":"sdfbsdfbsdfb","description":"","shape":"circle"},"12":{"x":164,"y":257,"label":"sdfbsdfbsdfb","description":"","shape":"circle"},"13":{"x":326,"y":184,"label":"sdfbsdfbsdfb","description":"","shape":"circle"},"14":{"x":239,"y":241,"label":"sdfbsdfbdsb","description":"","shape":"circle"},"15":{"x":399,"y":230,"label":"sdbdsfbsdb sd fbsdf bdfsbsdfbsdfb sdfb","description":"","shape":"circle"},"16":{"x":262,"y":184,"label":"sdfbsd b sdfbsd","description":"","shape":"circle"},"17":{"x":286,"y":193,"label":"sdb sdfb","description":"","shape":"circle"},"18":{"x":381,"y":172,"label":"sdf bsdfb","description":"","shape":"circle"},"19":{"x":103,"y":347,"label":"sdf bsdfbsdfbsdf ","description":"","shape":"circle"},"20":{"x":354,"y":240,"label":"s bsdfbsd fbsdf","description":"","shape":"circle"},"21":{"x":193,"y":180,"label":"sd bsdfbsdfb sdfb","description":"","shape":"circle"},"22":{"x":250,"y":324,"label":" sdfbsdfb sdfbsdb","description":"","shape":"circle"},"23":{"x":426,"y":139,"label":"sdfb sdfb","description":"","shape":"circle"},"24":{"x":417,"y":75,"label":"s dfbsdfb","description":"","shape":"circle"},"25":{"x":272,"y":104,"label":"s dfbsdfbsdfb","description":"","shape":"circle"},"26":{"x":314,"y":112,"label":" sdfbsdfbsdfb","description":"","shape":"circle"}},"quadrants":[{"label":"Languages & Frameworks","blipsColor":"#4AA02C"},{"label":"Platforms","blipsColor":"#E56717"},{"label":"TechniquesDDD","blipsColor":"#0041C2"},{"label":"Tools","blipsColor":"#FF69B4"}]}';

var width = 900;
var height = 800; //window.innerHeight;
var blipColorDefault = 'grey';

var labelMinLength = 1;
var labelMaxLength = 50;
var descriptionMinLength = 0;
var descriptionMaxLength = 500;

var blipShadowEnabled = false;
var blipShadowOffsetX = 2;
var blipShadowOffsetY = 2;
var blipDragScale = 1.2;
var blipDragShadowOffsetX = 5;
var blipDragShadowOffsetY = 5;
var stage = undefined;
var blipsLayer = undefined;
var blipsDragLayer = undefined;
var arcsLayer = undefined;
var tooltipLayer = undefined;
var tooltip = undefined;
// List of all arcs forming all the quadrants, i.e.
// one for "platforms hold", one for "platforms assess", ...
var arcs = [];

var canEdit = false;

var ringNamePrefix = "ring";
var rings = [
  {width: 130, color: '#999999', label: 'Adopt'},
  {width: 100, color: '#AAAAAA', label: 'Trial'},
  {width: 90, color: '#BBBBBB', label: 'Assess'},
  {width: 70, color: '#CCCCCC', label: 'Hold'}
];

var startAngle = 90;
var quadrantNamePrefix = "quadrant";
var quadrants = [
  {blipsColor: '#0041C2', label: 'Quadrant 1'},
  {blipsColor: '#4AA02C', label: 'Quadrant 2'},
  {blipsColor: '#E56717', label: 'Quadrant 3'},
  {blipsColor: '#FF69B4', label: 'Quadrant 4'}
];

var detailsDivSuffix = "Details";
var detailsInternalDivSuffix = "DetailsInternal";

$( document ).ready(function() {
  stage = new Konva.Stage({
    container: 'stageContainer',
    width: width,
    height: height
  });

  addQuadrants();

  blipsLayer = new Konva.Layer();
  blipsDragLayer = new Konva.Layer();
  tooltipLayer = new Konva.Layer();
  tooltip = new Konva.Group({
    id: "tooltip_blips",
    visible: false
  });
  var text = new Konva.Text({
      text: "",
      fontFamily: "Lato",
      fontSize: 16,
      padding: 5,
      textFill: "white",
      fill: "black",
      alpha: 0
  });
  var textClientRect = text.getClientRect();
  text.setAttrs({
    x: - textClientRect.width / 2,
    y: - textClientRect.height / 2
  });
  var rect = new Konva.Rect({
    x: - textClientRect.width / 2,
    y: - textClientRect.height / 2,
    width: textClientRect.width,
    height: textClientRect.height,
    fill: 'rgba(255,255,255,0.8)',
    stroke: 'rgba(0,0,0,0.2)',
    strokeWidth: 1
  });
  tooltip.add(rect);
  tooltip.add(text);
  tooltipLayer.add(tooltip);

  stage.add(blipsLayer, blipsDragLayer, tooltipLayer);

  stage.on('dragstart', function(evt) {
    var shape = evt.target;
    var arc = getArc(shape);
    if (arc) {
      var startDetailsDiv = "details_" + arc.getAttr('quadrantName') + "_" + arc.getAttr('ringName');
      shape.setAttr("startDetailsDiv", startDetailsDiv);
      //console.log("Start details div: " + startDetailsDiv);
    }
    else {
      shape.setAttr("startDetailsDiv", undefined);
      //console.log("Start details div is undefined");
    }

    // moving to another layer will improve dragging performance
    shape.moveTo(blipsDragLayer);
    stage.draw();

    var circle = shape.find(".theShape")[0];

    circle.setAttrs({
      shadowOffset: {
        x: blipDragShadowOffsetX,
        y: blipDragShadowOffsetY
      },
      scale: {
        x: circle.getAttr('startScale') * blipDragScale,
        y: circle.getAttr('startScale') * blipDragScale
      }
    });
  });

  stage.on('dragend', function(evt) {
    var shape = evt.target;
    colorBlipAndSetupDetailsDiv(shape, true);
  });

  document.getElementById('importRadarFileInputId').addEventListener('change', loadRadar, false);

  initNewBlipDialog();
  initViewBlipDialog();
  initEditBlipDialog();

  $("#toggleCanEditButtonId").button({
    icon: "ui-icon-pencil"
  });
  $(".normalButton").button();

  // defaultRadarUrl will not work with local file when not running a local
  // http server ("Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, https.")
  if (defaultRadarJson) {
    loadRadarFromJson(JSON.parse(defaultRadarJson));
  }
  else if (defaultRadarUrl) {
    $.getJSON(defaultRadarUrl, function(json) {
      loadRadarFromJson(json);
    });
  }
});

function addEmptyDetails(ringDiv) {
  var detailsBlipEmptyDiv = jQuery('<div/>', {
    class: 'detailsBlipEmpty'
  });
  detailsBlipEmptyDiv.html("<i>empty</i>");
  $(ringDiv).append(detailsBlipEmptyDiv);
}

function removeEmptyDetails(ringDiv) {
  $(ringDiv).find(".detailsBlipEmpty").remove();
}

function addOrRemoveEmptyDetails(ringDiv) {
  var details = $(ringDiv).find(".detailsBlip");
  if (details.length > 0) {
    removeEmptyDetails(ringDiv);
  }
  else {
    if ($(ringDiv).find(".detailsBlipEmpty").length == 0) {
      addEmptyDetails(ringDiv);
    }
  }
}



function fileUpload() {
  $( "#importRadarFileInputId" ).click();
}

function makeBlipsDraggable(theVal) {
  var makeDraggable = undefined;
  if (theVal === undefined) {
    makeDraggable = true;
  }
  else {
    makeDraggable = theVal;
  }
  var blipGroups = blipsLayer.find('Group');
  for (var i = 0; i < blipGroups.length; i++) {
    blipGroups[i].setAttr("draggable", makeDraggable);
  }
}

// Update the quadrants global variable with whatever is visible on the screen.
function updateQuadrantsObject() {
  $(".detailsTitle").each(function( index ) {
    if (!canEdit) {
      var visibleLabel = $(this).text();
    }
    else {
      var visibleLabel = $( this ).next().val();
    }
    var quadrantIndex = parseInt($(this).attr('quadrantIndex'));
    quadrants[quadrantIndex].label =  visibleLabel;
  });
}

function makeDetailsTitleEditable(theVal) {
  var makeEditable = undefined;
  if (theVal === undefined) {
    makeEditable = true;
  }
  else {
    makeEditable = theVal;
  }
  $(".detailsTitle").each(function( index ) {
    if (makeEditable) {
      if ($( this ).next("input.detailsTitleInput").length == 0) {
        $( this ).hide();
        $( this ).after($('<input/>').attr({ type: 'text', class: 'detailsTitleInput', value: $(this).text()}));

        var quadrantIndex = $(this).attr('quadrantIndex');

        var colorInput = $('<input/>');
        colorInput.attr({
                          type: 'text',
                          class: 'pickBlipsColorInput',
                          value: '',
                          readonly: true,
                          onchange: "blipColorOnChange(" + quadrantIndex + ", this.value)"
                        });
        $( this ).next("input.detailsTitleInput").after(colorInput);
        var hiddenInputId = 'pickBlipsColorHiddenId' + quadrantIndex;
        $( this ).next("input.detailsTitleInput").next("input.pickBlipsColorInput").after($('<input/>').attr({
                          id: hiddenInputId,
                          class: 'pickBlipsColorInputHidden',
                          type: 'hidden',
                          value: '',
                          readonly: true,
                          onchange: "blipColorOnChange(" + quadrantIndex + ", this.value)"
                        }));
        var picker = new jscolor(colorInput[0], {closable: true, closeText: "Close", value: quadrants[quadrantIndex].blipsColor, valueElement: hiddenInputId});

        // Do not allow to delete the last quadrant (i.e. there must be at least one).
        if (quadrants.length > 1) {
          $( this ).next("input.detailsTitleInput").next("input.pickBlipsColorInput").next("input.pickBlipsColorInputHidden").after($('<button/>').attr({ id: "deleteQuadrantButtonId" + quadrantIndex, class: "deleteQuadrantButton", onclick: 'deleteQuadrant(' + quadrantIndex + ');'}));
          $("#deleteQuadrantButtonId" + quadrantIndex).button({
            icon: "ui-icon-trash"
          });
        }
      }
    }
    else {
      if ($( this ).next("input.detailsTitleInput").length > 0) {
        $( this ).text($( this ).next().val());
        $( this ).next("input.detailsTitleInput").next("input.pickBlipsColorInput").next("input.pickBlipsColorInputHidden").next("button.deleteQuadrantButton").remove();
        $( this ).next("input.detailsTitleInput").next("input.pickBlipsColorInput").next("input.pickBlipsColorInputHidden").remove();
        $( this ).next("input.detailsTitleInput").next("input.pickBlipsColorInput").remove();
        $( this ).next("input.detailsTitleInput").remove();
        $( this ).show();
      }
    }
  });
}

function blipColorOnChange(quadrantIndex, theColor) {
  //console.log("blipColorOnChange: " + quadrantIndex + " --> " + theColor);
  quadrants[quadrantIndex].blipsColor = "#" + theColor;
  addQuadrants();
  // Avoids issue where first blip is not colored.
  arcsLayer.draw();
  $.each(stage.find(".blipGroup"), function( key, theGroup ) {
    colorBlipAndSetupDetailsDiv(theGroup);
  });
  makeDetailsTitleEditable();
}

function deleteQuadrant(quadrantIndex) {
  quadrants.splice(quadrantIndex, 1);
  addQuadrants();
  // Avoids issue where first blip is not colored.
  arcsLayer.draw();
  $.each(stage.find(".blipGroup"), function( key, theGroup ) {
    colorBlipAndSetupDetailsDiv(theGroup);
  });
  makeDetailsTitleEditable();
}

function makeMainTitleEditable(theVal) {
  var makeEditable = undefined;
  if (theVal === undefined) {
    makeEditable = true;
  }
  else {
    makeEditable = theVal;
  }
  $("#mainTitleInternalDiv").each(function( index ) {
    if (makeEditable) {
      if ($( this ).next("input.mainTitleInput").length == 0) {
        $( this ).hide();
        $( this ).after($('<input/>').attr({ type: 'text', class: 'mainTitleInput', value: $(this).text()}));
      }
    }
    else {
      if ($( this ).next("input.mainTitleInput").length > 0) {
        $( this ).text($( this ).next("input.mainTitleInput").val());
        document.title = $(this).text();
        $( this ).next("input.mainTitleInput").remove();
        $( this ).show();
      }
    }
  });
}

function makeEditable() {
  $("#addBlipButtonId").show();
  $("#reorderBlipsButtonId").show();
  $("#addQuadrantButtonId").show();
  $("#exportRadarButtonId").show();
  $("#importRadarFileInputId").show();
  $("#fileProxy").show();
  makeBlipsDraggable();
  makeDetailsTitleEditable();
  makeMainTitleEditable();
}

function makeNotEditable() {
  $("#addBlipButtonId").hide();
  $("#reorderBlipsButtonId").hide();
  $("#addQuadrantButtonId").hide();
  $("#exportRadarButtonId").hide();
  $("#importRadarFileInputId").hide();
  $("#fileProxy").hide();
  makeBlipsDraggable(false);
  makeDetailsTitleEditable(false);
  makeMainTitleEditable(false);
}

function toggleCanEdit() {
  updateQuadrantsObject();
  if (!canEdit) {
    makeEditable();
  }
  else {
    makeNotEditable();
  }
  canEdit = !canEdit;
}

function getQuadrantBlipsNumberingOrder(quadrantName) {
  for (var i = 0; i < quadrants.length; i++) {
    if ((quadrantNamePrefix + (i + 1)) == quadrantName) {
      return i + 1;
    }
  }
  return undefined;
}

function getRingBlipsNumberingOrder(ringName) {
  for (var i = 0; i < rings.length; i++) {
    if ((ringNamePrefix + (i + 1)) == ringName) {
      return i + 1;
    }
  }
  return undefined;
}

function getQuadrantAndRingNames(theBlip) {
  var arc = getArc(theBlip);
  if (arc) {
    return {quadrantName: arc.getAttr('quadrantName'), ringName: arc.getAttr('ringName')}
  }
  else {
    undefined;
  }
}

function getBlipById(blipId) {
 if (stage) {
   return stage.findOne("#blip_" + blipId);
 }
 else {
   return undefined;
 }
}

function getDetailsDivBlipId(theDiv, suffix) {
  var elemId = $(theDiv).attr("id");
  if (!suffix) {
    var trimLength = 0;
  }
  else {
    var trimLength = suffix.length;
  }
  return parseInt(elemId.substring("blipDetails_".length, elemId.length - trimLength));
}

function getDetailsDivFromBlip(theBlip) {
  if (!theBlip) {
    return undefined;
  }
  var blipId = getBlipId(theBlip);
  if (!blipId) {
    return undefined;
  }
  return $("#blipDetails_" + blipId);
}

var detailsDivInAnim = undefined;
function detailsDivIn() {
  // Highlight details div.
  highlightDetails($(this));

  // Effect on blip.
  var blipId = getDetailsDivBlipId(this);

  if (blipId && !detailsDivInAnim) {
    //console.log("Starting details div animation");
    var theBlip = getBlipById(blipId);
    var amplitude = 150;
    var period = 1500;
    detailsDivInAnim = new Konva.Animation(function(frame) {
        var scale = Math.sin(frame.time * 2 * Math.PI / period) + 1.5;
        theBlip.find(".theShape")[0].scale({ x : scale, y : scale });
    }, blipsLayer);
    detailsDivInAnim.start();
  }
}

function detailsDivOut() {
  // Stop highlight details div.
  unhighlightDetails($(this));

  if (detailsDivInAnim) {
    //console.log("Stopping details div animation");
    detailsDivInAnim.stop();
    detailsDivInAnim = undefined;
    var blipId = getDetailsDivBlipId(this);
    //console.log("blipId: " + blipId);
    //console.log("blip: " + getBlipById(blipId));
    var theShape = getBlipById(blipId).find(".theShape")[0];
    theShape.to({
      duration: 0.5,
      easing: Konva.Easings.ElasticEaseOut,
      scaleX: theShape.getAttr('startScale'),
      scaleY: theShape.getAttr('startScale'),
      shadowOffsetX: 5,
      shadowOffsetY: 5
    });
  }
}

function getBlipId(theBlip) {
  if (theBlip) {
    var blipId = theBlip.find("Text")[0].getAttr("text");
    return parseInt(blipId);
  }
  else {
    return undefined;
  }
}

function colorBlipAndSetupDetailsDiv(theBlip, withEffect, doNoUpdateDetailsDiv) {
  // Color blip.
  var theShape = theBlip.find(".theShape")[0];
  //var pos = stage.getPointerPosition();
  var arc = getArc(theBlip);
  if (arc) {
    theShape.fill(arc.getAttr('blipsColor'));
    var endDetailsDiv = "details_" + arc.getAttr('quadrantName') + "_" + arc.getAttr('ringName');
    //console.log("End details div: " + endDetailsDiv);
  }
  else {
    theShape.fill(blipColorDefault);
    var endDetailsDiv = undefined;
    //console.log("End details div: " + endDetailsDiv);
  }

  theBlip.moveTo(blipsLayer);
  stage.draw();
  if (withEffect) {
    theShape.to({
      duration: 0.5,
      easing: Konva.Easings.ElasticEaseOut,
      scaleX: theShape.getAttr('startScale'),
      scaleY: theShape.getAttr('startScale'),
      shadowOffsetX: blipShadowOffsetX,
      shadowOffsetY: blipShadowOffsetY
    });
  }

  if (!doNoUpdateDetailsDiv) {
    // Setup details div.
    var startDetailsDiv = theBlip.getAttr("startDetailsDiv");

    //console.log("Adding details for " + getBlipId(theBlip));

    // We need to update the details.
    if (endDetailsDiv != startDetailsDiv) {
      var blipId = theBlip.find("Text")[0].getAttr("text");
      var blipIdInt = parseInt(blipId);
      var blipLabel = theBlip.find("Text")[0].getAttr("label");
      //console.log("Blip ID: " + blipId);
      // Remove from start.
      if (startDetailsDiv) {
        //console.log("Removing: " + "#blipDetails_" + blipId);
        $("#" + startDetailsDiv).find("#blipDetails_" + blipId).remove();
        addOrRemoveEmptyDetails($("#" + startDetailsDiv));
      }
      // Add to target.
      if (endDetailsDiv) {
        var newBlipDetailsDiv = jQuery('<div/>', {
          class: 'detailsBlip',
          id: "blipDetails_" + blipId
        });
        newBlipDetailsDiv.hover(detailsDivIn, detailsDivOut);
        newBlipDetailsDiv.click(function() {
          if (!canEdit) {
            openViewBlipDialog(blipId);
          }
          else {
            openEditBlipDialog(blipId);
          }
        });
        // Keep blips in ascending order (ID based).
        var followingBlipId = undefined;
        $("#" + endDetailsDiv).find(".detailsBlip").each(function() {
          var elemId = $( this ).attr('id');
          //console.log("ElemID: " + elemId);
          var currentBlipId = parseInt(getDetailsDivBlipId(this));
          //console.log("Current ID: " + currentBlipId);
          if (currentBlipId > blipIdInt && (!followingBlipId || currentBlipId < followingBlipId))   {
            followingBlipId = currentBlipId;
          }
        });
        if (followingBlipId) {
          //console.log("Found following: " + followingBlipId);
          $("#blipDetails_" + followingBlipId).before(newBlipDetailsDiv);
        }
        else {
          //console.log("No following found");
          $("#" + endDetailsDiv).append(newBlipDetailsDiv);
        }
        addOrRemoveEmptyDetails($("#" + endDetailsDiv));
        // Need to update the label *after* the div has been added to the DOM since we
        // search it by ID in 'updateBlipLabel'.
        updateBlipLabel(blipId, blipLabel);
      }
    }
  }
}

function getArc(shape) {
  return arcsLayer.getIntersection({x: shape.getAttr('x'), y: shape.getAttr('y')});
}

function addQuadrantDetailsDiv(j, onTheLeft) {
  var detailsContainerHeight = Math.max(140, Math.ceil(height / Math.ceil(quadrants.length / 2)));
  var newDiv = jQuery('<div/>', {
    id: (quadrantNamePrefix + (j + 1) + detailsDivSuffix),
    class: 'detailsContainer',
    style: 'height: ' + detailsContainerHeight + 'px;'
  });
  var titleDiv = jQuery('<div/>', {
    class: 'detailsTitle',
    quadrantIndex: j
  });
  var detailsInternalHeight = detailsContainerHeight - 40;
  var detailsInternalDiv = jQuery('<div/>', {
    id: (quadrantNamePrefix + (j + 1) + detailsInternalDivSuffix),
    class: 'detailsInternal',
    style: 'height: ' + detailsInternalHeight + 'px;'
  });
  titleDiv.text(quadrants[j].label);
  $(newDiv).append(titleDiv);
  $(newDiv).append(detailsInternalDiv);
  $(titleDiv).css('background-color', quadrants[j].blipsColor);

  var currentColor = $(titleDiv).css('background-color');
  if (currentColor.startsWith('rgb(')) {
    var newColor = "rgba(" + currentColor.substring(4, currentColor.indexOf(")")) + ", 0.3)"
    $(titleDiv).css('background-color', newColor);
  }

  for (var k = 0; k < rings.length; k++) {
    var ringDiv = jQuery('<div/>', {
      class: 'detailsRing',
      id: "details_" + quadrantNamePrefix + (j + 1) + "_" + ringNamePrefix + (k + 1)
    });
    var ringTitleDiv = jQuery('<div/>', {
      class: 'detailsRingTitle'
    });
    ringTitleDiv.text(rings[k].label);
    $(ringDiv).append(ringTitleDiv);
    $(detailsInternalDiv).append(ringDiv);

    addOrRemoveEmptyDetails(ringDiv);
  }

  if (onTheLeft) {
    $("#detailsLeft").append(newDiv);
  }
  else {
    $("#detailsRight").append(newDiv);
  }
}

function removeQuadrants() {
  if (arcsLayer) {
    $.each(arcsLayer.find("Arc"), function( key, theArc ) {
      theArc.remove();
    });
  }
  $(".detailsContainer").remove();
}

function compareAngles(a, b) {
  var startAngleRadiansA = a.startAngle * (Math.PI / 180.0);
  var startAngleRadiansB = b.startAngle * (Math.PI / 180.0);
  //console.log("Angle a: " + a.startAngle + " --> " + startAngleRadiansA);
  //console.log("Angle b: " + b.startAngle + " --> " + startAngleRadiansB);
  if (Math.sin(startAngleRadiansA) < Math.sin(startAngleRadiansB)) {
    return -1;
  }
  else if (Math.sin(startAngleRadiansA) > Math.sin(startAngleRadiansB)) {
    return 1;
  }
  else {
    return 0;
  }
}

function addQuadrants() {
  // Reset existing quadrants first.
  removeQuadrants();
  if (!arcsLayer) {
    var newArcsLayer = true;
    arcsLayer = new Konva.Layer();
  }
  var startAnglesLeft = [];
  var startAnglesRight = [];
  for (var i = 0; i < rings.length; i++) {
    for (var j = 0; j < quadrants.length; j++) {
      var innerRadius = 0;
      for (var k = i - 1; k >= 0; k--) {
        innerRadius += rings[k].width;
      }
      addQuadrant(arcsLayer, innerRadius, innerRadius + rings[i].width, startAngle, 360 / quadrants.length, j * (360 / quadrants.length), rings[i].color, ringNamePrefix + (i + 1), quadrantNamePrefix + (j + 1), quadrants[j].blipsColor);
      if (j == quadrants.length - 1) {
        addRingLabel(rings[i].label, 0, -innerRadius - rings[i].width, arcsLayer);
      }
      if (i == 0) {
        var quadrantStartAngle = startAngle + (j * (360 / quadrants.length));
        var startAngleObject = {"startAngle": quadrantStartAngle, "quadrantIndex": j };
        // Because 0 is at 3 o'clock  (and not at 12 o'clock)
        if (quadrantStartAngle >= 90 && quadrantStartAngle < 270) {
          startAnglesLeft.push(startAngleObject);
        }
        else {
          startAnglesRight.push(startAngleObject);
        }
      }
    }
  }


  // Add details div after the arcs so that we can poperly decide where to place them.
  startAnglesLeft.sort(compareAngles);
  startAnglesRight.sort(compareAngles);
  for (var i = 0; i < startAnglesLeft.length; i++) {
      addQuadrantDetailsDiv(startAnglesLeft[i].quadrantIndex, true);
  }
  for (var i = 0; i < startAnglesRight.length; i++) {
      addQuadrantDetailsDiv(startAnglesRight[i].quadrantIndex, false);
  }

  if (newArcsLayer) {
    stage.add(arcsLayer);
  }

  /*
  var quadrantsLabelsLayer = new Konva.Layer();
  var radarRadius = getRadarRadius();

  for (var j = 0; j < quadrants.length; j++) {
    addQuadrantLabel(quadrants[j].label, radarRadius, j, 20, quadrantsLabelsLayer);
  }
  stage.add(quadrantsLabelsLayer);
  */
}

function getRadarRadius() {
  var r = 0;
  for (var i = 0; i < rings.length; i++) {
    r += rings[i].width;
  }
  return r;
}

function addRingLabel(label, offsetX, offsetY, layer) {
  var x = (stage.getWidth() / 2) + offsetX;
  var y = (stage.getHeight() / 2) + offsetY;
  var text = new Konva.Text({
    x: x,
    y: y,
    text: label,
    fontSize: 12,
    fontFamily: 'Lato',
    fill: 'black'
  });

  var rect = text.getClientRect();
  text.setAttrs({
    //x: x - (rect.width / 2),
    x: x  + 5,
    y: y + 10
  });
  layer.add(text);
  text.setZIndex(9999);
}

// @Deprecated
function addQuadrantLabel(label, outerRingRadius, quadrantIndex, offset, layer) {
  var twoPi = Math.PI * 2;
  var oneQuadrantAngle = (twoPi / quadrants.length);
  var quadrantStartAngle = quadrantIndex * oneQuadrantAngle;
  //console.log("quadrantStartAngle: " + quadrantStartAngle);
  var labelAngle = quadrantStartAngle + ((twoPi / quadrants.length) / 2);
  //console.log("Label angel: " + labelAngle);
  var theSin = Math.sin(labelAngle);
  var theCos = Math.cos(labelAngle);
  //console.log("Sin: " + theSin);
  //console.log("Cos: " + theCos);
  var offsetX = outerRingRadius * theSin;
  var offsetY = outerRingRadius * theCos;
  //if (theCos < 0) {
  //  offsetX = -offsetX;
  //}
  //if (theSin < 0) {
  //  offsetY = -offsetY;
  //}

  var x = (stage.getWidth() / 2) + offsetX;
  var y = (stage.getHeight() / 2) + offsetY;
  var text = new Konva.Text({
    x: x,
    y: y,
    text: label,
    fontSize: 30,
    fontFamily: 'Lato',
    fill: 'black'
  });

  var rect = text.getClientRect();
  var offsetX = 0;
  var offsetY = 0;
  if (theSin > 0) {
    offsetX = -offset;
  }
  else {
    offsetX = rect.width + offset;
  }
  if (theCos > 0) {
    offsetY = -offset;
  }
  else {
    offsetY = rect.height + offset;
  }
  // Have label far enough so that blip details can be displayed below it.
  if (offsetX > 0) {
    offsetX = offsetX + 250;
  }
  else {
    offsetX = offsetX - 250;
  }

  text.setAttrs({
    x: x - offsetX,
    y: y - offsetY
  });

  //arcs[quadrantIndex].setAttr("labelPos", {"x": text.getAttr('x'), "y": text.getAttr('y')});

  // Add the attribute for each ring.
  for (var i = 0; i < rings.length; i++) {
    arcs[(quadrantIndex + (i * rings.length))].setAttr('labelPos', {"x": text.getAttr('x'), "y": text.getAttr('y')});
  }

  layer.add(text);
}

var newBlipId = 0;
function getNewBlipId() {
  return ++newBlipId;
}

function showTooltip(theBlip) {
  //var mousePos = stage.getPointerPosition();
  tooltip.position({
      //x : mousePos.x + 20,
      //y : mousePos.y - 20
      x: theBlip.getAttr('x') + 15,
      y: theBlip.getAttr('y') - 15
  });
  var label = theBlip.find("Text")[0].getAttr("label");

  var text = tooltip.find("Text")[0];
  text.text(label);
  var textClientRect = text.getClientRect();

  var rect = tooltip.find("Rect")[0];
  rect.setAttrs({
    width: textClientRect.width,
    height: textClientRect.height,
  });
  tooltip.show();
  tooltipLayer.batchDraw();
}

function hideTooltip(theBlip) {
  tooltip.hide();
  tooltipLayer.draw();
}

function highlightDetailsFromBlip(theBlip) {
  highlightDetails(getDetailsDivFromBlip(theBlip));
}

function highlightDetails(theDiv) {
  if (theDiv) {
    // Use the same color and alpha as the one that were set on tht title.
    var detailsTitleDiv = theDiv.parent().parent().parent().find(".detailsTitle");
    theDiv.css('background-color', detailsTitleDiv.css('background-color'));
  }
}

function unhighlightDetailsFromBlip(theBlip) {
  unhighlightDetails(getDetailsDivFromBlip(theBlip));
}

function unhighlightDetails(theDiv) {
  if (theDiv) {
    theDiv.css('background-color', 'rgba(0, 0, 0, 0)');
  }
}

function updateTips( t, tipsClass ) {
  var tips = $( "." + tipsClass );
  tips
    .text( t )
    .addClass( "ui-state-highlight" );
  setTimeout(function() {
    tips.removeClass( "ui-state-highlight", 1500 );
  }, 500 );
}

function checkLength( o, n, min, max, tipsClass ) {
  if ( o.val().length > max || o.val().length < min ) {
    o.addClass( "ui-state-error" );
    updateTips( "Length of " + n + " must be between " + min + " and " + max + ".", tipsClass );
    return false;
  } else {
    return true;
  }
}

var newBlipDialog = undefined;
var newBlipForm = undefined;
function initNewBlipDialog() {
  var newBlipLabel = $( "#newBlipLabel" );
  var newBlipDescription = $( "#newBlipDescription" );
  var allFields = $( [] ).add( newBlipLabel ).add( newBlipDescription );
  var tips = $( ".newBlipValidateTips" );

  newBlipDialog = $( "#newBlipDialog" ).dialog({
        autoOpen: false,
        height: 600,
        width: 500,
        modal: true,
        buttons: {
          "Save": addNewBlip,
          Cancel: function() {
            newBlipDialog.dialog( "close" );
          }
        },
        close: function() {
          newBlipForm[ 0 ].reset();
          allFields.removeClass( "ui-state-error" );
          tips.text("");
        }
      });

  newBlipForm = newBlipDialog.find( "form" );
  newBlipForm.on( "submit", function( event ) {
    event.preventDefault();
    addNewBlip();
  });
}

function openAddNewBlipDialog() {
  newBlipDialog.dialog( "open" );
}

var editBlipDialog = undefined;
var editBlipForm = undefined;
function initEditBlipDialog() {
  var editBlipLabel = $( "#editBlipLabel" );
  var editBlipDescription = $( "#editBlipDescription" );
  var allFields = $( [] ).add( editBlipLabel ).add( editBlipDescription );
  var tips = $( ".editBlipValidateTips" );

  editBlipDialog = $( "#editBlipDialog" ).dialog({
        autoOpen: false,
        height: 600,
        width: 500,
        modal: true,
        buttons: {
          "Save": editBlip,
          Cancel: function() {
            editBlipDialog.dialog( "close" );
          }
        },
        close: function() {
          editBlipForm[ 0 ].reset();
          allFields.removeClass( "ui-state-error" );
          tips.text("");
        }
      });

  editBlipForm = editBlipDialog.find( "form" );
  editBlipForm.on( "submit", function( event ) {
    event.preventDefault();
    editBlip();
  });
}

function openEditBlipDialog(theBlipId) {
  $("#editBlipIdHidden").val(theBlipId);
  var theBlip = getBlipById(theBlipId);
  var c = theBlip.find('.theShape')[0];
  var t = theBlip.find('Text')[0];
  //var blipId = t.getAttr('text');
  var blipLabel = t.getAttr('label');
  if (blipLabel) {
    $("#editBlipLabel").val(blipLabel);
  }
  else {
    $("#editBlipLabel").val("");
  }
  var blipDescription = t.getAttr('description');
  if (blipDescription) {
    $("#editBlipDescription").val(blipDescription);
  }
  else {
    $("#editBlipDescription").val("");
  }
  var theShape = c.getAttr('shapeType');
  $('input[type=radio][name=editBlipShape][value=' + theShape + ']').attr('checked', true);
  editBlipDialog.dialog( "open" );
}

var viewBlipDialog = undefined;

function initViewBlipDialog() {
  viewBlipDialog = $( "#viewBlipDialog" ).dialog({
        autoOpen: false,
        height: 600,
        width: 500,
        modal: true,
        buttons: {
          "Close": function() {
            viewBlipDialog.dialog( "close" );
          }
        }
      });
}

function openViewBlipDialog(theBlipId) {
  var theBlip = getBlipById(theBlipId);
  var t = theBlip.find('Text')[0];
  //var blipId = t.getAttr('text');
  var blipLabel = t.getAttr('label');
  var blipDescription = t.getAttr('description');
  var viewBlipLabel = $( "#viewBlipLabel" );
  var viewBlipDescription = $( "#viewBlipDescription" );
  $( "#viewBlipDialog" ).dialog( "option", "title", blipLabel );
  if (blipDescription) {
    viewBlipDescription.text(blipDescription);
    viewBlipDescription.linkify({
        target: "_blank"
    });
  }
  else {
    viewBlipDescription.html("<i>No description available</i>");
  }

  viewBlipDialog.dialog( "open" );
}

function addNewBlip() {
  var newBlipLabel = $( "#newBlipLabel" );
  var newBlipDescription = $( "#newBlipDescription" );
  var newBlipShapeValue = $('input[type=radio][name=newBlipShape]:checked').val();
  var allFields = $( [] ).add( newBlipLabel ).add( newBlipDescription );

  var valid = true;
  allFields.removeClass( "ui-state-error" );

  valid = valid && checkLength(newBlipLabel, "'label'", labelMinLength, labelMaxLength, "newBlipValidateTips");
  valid = valid && checkLength(newBlipDescription, "'description'", descriptionMinLength, descriptionMaxLength, "newBlipValidateTips");

  if ( valid ) {
    var result = {};
    result.label = newBlipLabel.val();
    result.description = newBlipDescription.val();
    result.shape = newBlipShapeValue;
    newBlipDialog.dialog( "close" );
    addBlip(50, 50, getNewBlipId().toString(), result.label, result.description, result.shape);
  }
  return valid;
}

function editBlip() {
  var editBlipLabel = $( "#editBlipLabel" );
  var editBlipDescription = $( "#editBlipDescription" );
  var editBlipShapeValue = $('input[type=radio][name=editBlipShape]:checked').val();
  var allFields = $( [] ).add( editBlipLabel ).add( editBlipDescription );

  var valid = true;
  allFields.removeClass( "ui-state-error" );

  valid = valid && checkLength(editBlipLabel, "'label'", labelMinLength, labelMaxLength, "editBlipValidateTips");
  valid = valid && checkLength(editBlipDescription, "'description'", descriptionMinLength, descriptionMaxLength, "editBlipValidateTips");

  if ( valid ) {
    var result = {};
    result.label = editBlipLabel.val();
    result.description = editBlipDescription.val();
    editBlipDialog.dialog( "close" );
    updateBlipLabel( $( "#editBlipIdHidden" ).val(), result.label);
    updateBlipDescription( $( "#editBlipIdHidden" ).val(), result.description);
    updateBlipShape($( "#editBlipIdHidden" ).val(), editBlipShapeValue);
  }
  return valid;
}

function updateBlipLabel(theBlipId, theLabel) {
  $("#blipDetails_" + theBlipId).text(theBlipId + ". " + theLabel);
  getBlipById(theBlipId).find("Text")[0].setAttr("label", theLabel);
}

function updateBlipDescription(theBlipId, theDescription) {
  getBlipById(theBlipId).find("Text")[0].setAttr("description", theDescription);
}

function updateBlipShape(theBlipId, theNewShapeType) {
  var theBlip = getBlipById(theBlipId);
  var theShape = theBlip.find(".theShape")[0];
  if (theShape.getAttr("shapeType") != theNewShapeType) {
    var newShape = getNewShape(theNewShapeType);
    theShape.destroy();
    theBlip.add(newShape);
    // Make sure text is still above the shape itself.
    newShape.setZIndex(1);
    theBlip.find("Text")[0].setZIndex(10);
    colorBlipAndSetupDetailsDiv(theBlip, false, true);
    //stage.draw();
  }
}
function getNewShape(theShapeType) {
  var scale = 1;
  if (theShapeType == 'circle') {
    var newShape = new Konva.Circle({
      radius: 12,
      fill: blipColorDefault,
      stroke: 'black',
      strokeWidth: 1,
      // the group is draggable
      //draggable: true,
      shadowEnabled: blipShadowEnabled,
      shadowColor: 'black',
      shadowBlur: 2,
      shadowOffset: {
        x : blipShadowOffsetX,
        y : blipShadowOffsetY
      },
      shadowOpacity: 0.2,
      scale: scale,
      // custom attribute
      startScale: scale,
      name: "theShape",
      shapeType: theShapeType
    });
  }
  else if (theShapeType == 'triangle') {
    var newShape = new Konva.Shape({
      sceneFunc: function(context) {
        context.beginPath();
        context.moveTo(13, 0);
        context.lineTo(26, 26);
        context.lineTo(0, 26);
        context.closePath();
        // Konva specific method
        context.fillStrokeShape(this);
      },
      offsetX: 13,
      offsetY: 18,
      fill: blipColorDefault,
      stroke: 'black',
      strokeWidth: 1,
      // the group is draggable
      //draggable: true,
      shadowEnabled: blipShadowEnabled,
      shadowColor: 'black',
      shadowBlur: 2,
      shadowOffset: {
        x : blipShadowOffsetX,
        y : blipShadowOffsetY
      },
      shadowOpacity: 0.2,
      scale: scale,
      // custom attribute
      startScale: scale,
      name: "theShape",
      shapeType: theShapeType
    });
  }

  return newShape;
}
function addBlip(thePosX, thePosY, theBlipId, theLabel, theDescription, theShape) {
  //console.log("Adding blip ID " + blipId + " (" + x + ", " + y + ")");
  var group = new Konva.Group({
    id: "blip_" + theBlipId,
    name: "blipGroup",
    // starting pos
    x: thePosX,
    y: thePosY,
    draggable: canEdit
  });


  var innerShape = getNewShape(theShape);

  group.on('mouseenter', function () {
      if (canEdit) {
        stage.container().style.cursor = 'move'; // 'default', 'pointer', 'move', 'crosshair'
      }
      else {
        stage.container().style.cursor = 'pointer'; // 'default', 'pointer', 'move', 'crosshair'
      }
      highlightDetailsFromBlip(this);
      showTooltip(this);
  });

  group.on('mouseleave', function () {
      stage.container().style.cursor = 'default';
      unhighlightDetailsFromBlip(this);
      hideTooltip(this);
  });

  group.on('click', function() {
    if (!canEdit) {
      openViewBlipDialog(getBlipId(this));
    }
    else {
      openEditBlipDialog(getBlipId(this));
    }
  });

  //group.on('dblclick', function() {
  //  if (canEdit) {
  //    openViewBlipDialog(getBlipId(this));
  //  }
  //});

  var text = new Konva.Text({
    text: theBlipId,
    fontSize: 12,
    fontFamily: 'Lato',
    fill: 'white',
    label: theLabel,
    description: theDescription
  });

  var textClientRect = text.getClientRect();
  text.setAttrs({
    x: - textClientRect.width / 2,
    y: - textClientRect.height / 2
  });

  group.add(innerShape);
  group.add(text);
  blipsLayer.add(group);

  colorBlipAndSetupDetailsDiv(group);

  // This is done in colorBlip()
  //stage.draw();


}

function clearBlips() {
  if (blipsLayer) {
    var result = {};
    var blipGroups = blipsLayer.find('Group');
    for (var i = 0; i < blipGroups.length; i++) {
      blipGroups[i].destroy();
    }
    $(".detailsBlip").remove();
    $(".detailsRing").each(function( index ) {
      addOrRemoveEmptyDetails($(this));
    });
  }
}

function addQuadrant(layer, innerRadius, outerRadius, startAngle, angle, rotation, fill, ringName, quadrantName, blipsColor) {
  var arc = new Konva.Arc({
    x: stage.getWidth() / 2,
    y: stage.getHeight() / 2,
    innerRadius: innerRadius + 0,
    outerRadius: outerRadius,
    angle: angle,
    rotation: startAngle + rotation,
    fill: fill,
    stroke: 'black',
    strokeWidth: 0,
    ringName: ringName,
    quadrantName: quadrantName,
    blipsColor: blipsColor,
    strokeEnabled: quadrants.length > 1
  });

  arcs.push(arc);

  layer.add(arc);
}

function exportRadar() {
  if (blipsLayer) {
    var result = {};
    var blips = {};
    var blipGroups = blipsLayer.find('Group');
    for (var i = 0; i < blipGroups.length; i++) {
      var g = blipGroups[i];
      var x = g.getAttr('x');
      var y = g.getAttr('y');
      var c = g.find('.theShape')[0];
      var t = g.find('Text')[0];
      var blipId = t.getAttr('text');
      blips[blipId] = {'x': x, 'y': y, 'label': t.getAttr('label'), 'description': t.getAttr('description'), 'shape': c.getAttr('shapeType')};
    }
    result['blips'] = blips;
    // This guarantees that whatever is exported is what the user sees on the screen.
    updateQuadrantsObject();
    result['quadrants'] = quadrants;
    result['mainTitle'] = $("#mainTitleInternalDiv").text();
    var stringifyResult = JSON.stringify(result);
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(stringifyResult);
    var exportRadarAnchorElem = document.getElementById('exportRadarAnchorElem');
    exportRadarAnchorElem.setAttribute("href", dataStr);
    exportRadarAnchorElem.setAttribute("download", "lsTechRadar.json");
    exportRadarAnchorElem.click();
  }
}

function loadRadarFromJson(json) {
  //console.log("Loading radar from json!")
  var maxBlipId = 0;
  clearBlips();

  quadrants = json['quadrants'];
  addQuadrants();
  // Avoids issue where first blip is not colored.
  arcsLayer.draw();

  var blips = json['blips'];
  //console.log("JSON: " + JSON.stringify(json));
  for (var key in blips) {
    var blipId = parseInt(key);
    if (blipId > maxBlipId) {
      maxBlipId = blipId;
    }
    addBlip(blips[key]['x'], blips[key]['y'], blipId, blips[key]['label'], blips[key]['description'], blips[key]['shape']);
  }


  if (!canEdit) {
    $("#mainTitleInternalDiv").text(json['mainTitle']);
    document.title = json['mainTitle'];
    makeNotEditable();
  }
  else {
    $("#mainTitleInternalDiv").next("input").val(json['mainTitle']);
    document.title = json['mainTitle'];
    makeEditable();
  }

  newBlipId = maxBlipId;
}

function loadRadar(evt) {
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var files = evt.target.files; // FileList object
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];

    if (f) {
      var r = new FileReader();
      r.onload = function(e) {
        var content = e.target.result;
        //console.log("Got the file name " + f.name + ", size: " + f.size + " bytes")
        //console.log(contents);
        var json = JSON.parse(content);
        loadRadarFromJson(json);
      }
      r.readAsText(f);
    }
    //else {
    //  alert("Failed to load file");
    //}
  }
  else {
    alert('The File APIs are not fully supported in this browser.');
  }
}

// if makeTemp is set to true, then the the IDs will be followed by "_tmp"
// and fixTmpBlipIds() needs to be called after.
function updateBlipId(theBlip, newId, makeTemp) {
  if (makeTemp) {
    var suffix = "_tmp";
  }
  else {
    suffix = "";
  }
  var oldId = getBlipId(theBlip);
  //console.log("Changing blip ID: " + oldId + " --> " + newId + suffix);
  theBlip.setAttr("id", "blip_" + newId + suffix);
  var text = theBlip.find("Text")[0];
  text.setAttr("text", "" + newId);
  // Center ID in case it changed for a 1 digit number to a 2 letters digit.
  var textClientRect = text.getClientRect();
  text.setAttrs({
    x: - textClientRect.width / 2,
    y: - textClientRect.height / 2
  });

  if (!makeTemp) {
    $("#blipDetails_" + oldId).remove();
    colorBlipAndSetupDetailsDiv(theBlip);
  }
  else {
    $("#blipDetails_" + oldId).attr("id","blipDetails_" + newId + suffix);
  }
}

function fixTmpBlipIds() {
  $.each(stage.find(".blipGroup"), function( key, theGroup ) {
    var currentId = theGroup.getAttr("id");
    if (currentId.endsWith("_tmp")) {
      var newID = currentId.substring(0, currentId.length - "_tmp".length);
      //console.log("Fixing blip ID: " + currentId + " --> " + newID);
      theGroup.setAttr("id", newID);
    }
  });
  // We first remove and then re-create labels in order to avoid race condition issue
  // that leads to details disappearing.
  var toSetupBlips = [];
  $.each($(".detailsBlip"), function( key, theDetailsDiv ) {
    var currentId = $(theDetailsDiv).attr("id");
    //console.log("Processing " + currentId);
    if (currentId.endsWith("_tmp")) {
      var blipId = getDetailsDivBlipId(theDetailsDiv, "_tmp");
      var theBlip = getBlipById(blipId);
      $(theDetailsDiv).remove();
      toSetupBlips.push(theBlip);
    }
  });
  $.each(toSetupBlips, function( key, theBlip ) {
    colorBlipAndSetupDetailsDiv(theBlip);
  });
}

function addQuadrantButton() {
  quadrants.push({blipsColor: '#FFFFFF', label: 'New quadrant'});
  addQuadrants();
  // Avoids issue where first blip is not colored.
  arcsLayer.draw();
  $.each(stage.find(".blipGroup"), function( key, theGroup ) {
    colorBlipAndSetupDetailsDiv(theGroup);
  });
  makeDetailsTitleEditable();
}

function reorderBlips() {
  if (stage) {
    // Setup an array of array where the blips will be stored by quadrant and ring.
    var blipsArray = [];
    for (var i = 0; i < quadrants.length; i++) {
      blipsArray.push([]);
      for (var j = 0; j < rings.length; j++) {
        blipsArray[blipsArray.length - 1].push([]);
      }
    }
    // For blips that are not on any quadrant.
    blipsArray.push([]);
    var blips = stage.find(".blipGroup");
    //console.log("Nb blips: " + blips.length);
    for (var i = 0; i < blips.length; i++) {
      var qr = getQuadrantAndRingNames(blips[i]);
      if (qr) {
        blipsArray[getQuadrantBlipsNumberingOrder(qr.quadrantName) - 1][getRingBlipsNumberingOrder(qr.ringName) - 1].push(blips[i]);
      }
      // Not on any quadrant.
      else {
        blipsArray[blipsArray.length - 1].push(blips[i]);
      }
    }

    var newBlipId = 0;
    // Now that is has been categorized, lets reorder.
    // 'blipsArray.length - 1' to skip those outside of any quadrant.
    for (var i = 0; i < blipsArray.length - 1; i++) {
      for (var j = 0; j < blipsArray[i].length; j++) {
        var labelsAndBlips = [];
        for (var k = 0; k < blipsArray[i][j].length; k++) {
          var theBlip =  blipsArray[i][j][k];
          //console.log("Blip: " + theBlip);
          var blipLabel = theBlip.find("Text")[0].getAttr("label");
          labelsAndBlips.push({label: blipLabel, blip: theBlip});
        }
        // Sort case insensitive.
        labelsAndBlips.sort(function(a, b) {
          var labelA = a.label.toUpperCase();
          var labelB = b.label.toUpperCase();
          if (labelA < labelB) {
            return -1;
          }
          else if (labelA > labelB) {
            return 1;
          }
          else {
            return 0;
          }
        });
        for (var k = 0; k < labelsAndBlips.length; k++) {
          //console.log("In " + i + "." + j + ": " + blipLabel);
          updateBlipId(labelsAndBlips[k].blip, ++newBlipId, true);
        }
      }
    }

    // Those outside of the quadrants.
    for (var j = 0; j < blipsArray[blipsArray.length - 1].length; j++) {
      var theBlip =   blipsArray[blipsArray.length - 1][j];
      var blipLabel = theBlip.find("Text")[0].getAttr("label");
      updateBlipId(theBlip, ++newBlipId, true);
      //console.log("Out: " + blipLabel);
    }

    fixTmpBlipIds();
  }
}
