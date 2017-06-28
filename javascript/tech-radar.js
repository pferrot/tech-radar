var width = 900;
var height = 800; //window.innerHeight;
var blipColorDefault = 'grey';

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
// List of all arcs forming all the quadrants, i.e.
// one for "platforms hold", one for "platforms assess", ...
var arcs = [];

var canEdit = false;

var rings = [
  {width: 110, color: '#999999', name: 'adopt', label: 'Adopt', blipsNumberingOrder: 1},
  {width: 110, color: '#AAAAAA', name: 'trial', label: 'Trial', blipsNumberingOrder: 2},
  {width: 90, color: '#BBBBBB', name: 'assess', label: 'Assess', blipsNumberingOrder: 3},
  {width: 70, color: '#CCCCCC', name: 'hold', label: 'Hold', blipsNumberingOrder: 4}
];

var quadrants = [
  {name: 'languages_frameworks', blipsColor: 'pink', label: 'Languages &\nFrameworks', blipsNumberingOrder: 4},
  {name: 'platforms', blipsColor: 'orange', label: 'Platforms', blipsNumberingOrder: 3},
  {name: 'techniques', blipsColor: 'blue', label: 'Techniques', blipsNumberingOrder: 1},
  {name: 'tools', blipsColor: 'green', label: 'Tools', blipsNumberingOrder: 2}
];

var detailsDivSuffix = "Details";

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

function toggleCanEdit() {
  if (!canEdit) {
    $("#addBlipButtonId").show();
    $("#reorderBlipsButtonId").show();
    $("#exportGraphButtonId").show();
    $("#importGraphFileInputId").show();
    makeBlipsDraggable();
  }
  else {
    $("#addBlipButtonId").hide();
    $("#reorderBlipsButtonId").hide();
    $("#exportGraphButtonId").hide();
    $("#importGraphFileInputId").hide();
    makeBlipsDraggable(false);
  }
  canEdit = !canEdit;
}

function getQuadrantBlipsNumberingOrder(quadrantName) {
  for (var i = 0; i < quadrants.length; i++) {
    if (quadrants[i].name == quadrantName) {
      return quadrants[i].blipsNumberingOrder;
    }
  }
  return undefined;
}

function getRingBlipsNumberingOrder(ringName) {
  for (var i = 0; i < rings.length; i++) {
    if (rings[i].name == ringName) {
      return rings[i].blipsNumberingOrder;
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

$( document ).ready(function() {
  stage = new Konva.Stage({
    container: 'stageContainer',
    width: width,
    height: height
  });

  addQuadrants();

  blipsLayer = new Konva.Layer();
  blipsDragLayer = new Konva.Layer();

  stage.add(blipsLayer, blipsDragLayer);

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

    var circle = shape.find("Circle")[0];

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

  document.getElementById('importGraphFileInputId').addEventListener('change', loadGraph, false);
  //addStars();

  for (var j = 0; j < quadrants.length ; j++) {
    var newDiv = jQuery('<div/>', {
      id: (quadrants[j].name + detailsDivSuffix),
      class: 'detailsContainer'
    });
    var titleDiv = jQuery('<div/>', {
      class: 'detailsTitle'
    });
    titleDiv.html(quadrants[j].label);
    $(newDiv).append(titleDiv);

    for (var k = 0; k < rings.length; k++) {
      var ringDiv = jQuery('<div/>', {
        class: 'detailsRing',
        id: "details_" + quadrants[j].name + "_" + rings[k].name
      });
      var ringTitleDiv = jQuery('<div/>', {
        class: 'detailsRingTitle'
      });
      ringTitleDiv.html(rings[k].label);
      $(ringDiv).append(ringTitleDiv);
      $(newDiv).append(ringDiv);
    }

    if (j == 0 || j == quadrants.length - 1) {
      $("#detailsRight").prepend(newDiv);
    }
    else {
      $("#detailsLeft").prepend(newDiv);
    }
  }

  initNewBlipDialog();
  initViewBlipDialog();
});

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
  var blipId = getDetailsDivBlipId(this);
  //console.log("Details div in: " + blipId);

  if (blipId && !detailsDivInAnim) {
    //console.log("Starting details div animation");
    var theBlip = getBlipById(blipId);
    var amplitude = 150;
    var period = 1500;
    detailsDivInAnim = new Konva.Animation(function(frame) {
        var scale = Math.sin(frame.time * 2 * Math.PI / period) + 1.5;
        theBlip.find("Circle")[0].scale({ x : scale, y : scale });
    }, blipsLayer);
    detailsDivInAnim.start();
  }
}

function detailsDivOut() {
  //console.log("Details div out: " + getDetailsDivBlipId(this));
  if (detailsDivInAnim) {
    //console.log("Stopping details div animation");
    detailsDivInAnim.stop();
    detailsDivInAnim = undefined;
    var blipId = getDetailsDivBlipId(this);
    //console.log("blipId: " + blipId);
    //console.log("blip: " + getBlipById(blipId));
    var theCircle = getBlipById(blipId).find("Circle")[0];
    theCircle.to({
      duration: 0.5,
      easing: Konva.Easings.ElasticEaseOut,
      scaleX: theCircle.getAttr('startScale'),
      scaleY: theCircle.getAttr('startScale'),
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

function colorBlipAndSetupDetailsDiv(theBlip, withEffect) {
  // Color blip.
  var circle = theBlip.find("Circle")[0];
  //var pos = stage.getPointerPosition();
  var arc = getArc(theBlip);
  if (arc) {
    circle.fill(arc.getAttr('blipsColor'));
    var endDetailsDiv = "details_" + arc.getAttr('quadrantName') + "_" + arc.getAttr('ringName');
    //console.log("End details div: " + endDetailsDiv);
  }
  else {
    circle.fill(blipColorDefault);
    var endDetailsDiv = undefined;
    //console.log("End details div: " + endDetailsDiv);
  }

  theBlip.moveTo(blipsLayer);
  stage.draw();
  if (withEffect) {
    circle.to({
      duration: 0.5,
      easing: Konva.Easings.ElasticEaseOut,
      scaleX: circle.getAttr('startScale'),
      scaleY: circle.getAttr('startScale'),
      shadowOffsetX: blipShadowOffsetX,
      shadowOffsetY: blipShadowOffsetY
    });
  }

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
    }
    // Add to target.
    if (endDetailsDiv) {
      var newBlipDetailsDiv = jQuery('<div/>', {
        class: 'detailsBlip',
        id: "blipDetails_" + blipId
      });
      newBlipDetailsDiv.hover(detailsDivIn, detailsDivOut);
      newBlipDetailsDiv.html(blipId + ". " + blipLabel);
      newBlipDetailsDiv.click(function() {
        openViewBlipDialog(blipId);
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
    }
  }
}

function getArc(shape) {
  //console.log("Circle pos: " + shape.getAttr('x') + ", " + shape.getAttr('y'));
  //console.log("Circle offset: " + shape.getAttr('offsetX') + ", " + shape.getAttr('offsetY'));
  return arcsLayer.getIntersection({x: shape.getAttr('x'), y: shape.getAttr('y')});
}

function addQuadrants() {
  arcsLayer = new Konva.Layer();

  for (var i = 0; i < rings.length; i++) {
    for (var j = 0; j < quadrants.length; j++) {
      var innerRadius = 0;
      for (var k = i - 1; k >= 0; k--) {
        innerRadius += rings[k].width;
      }
      addQuadrant(arcsLayer, innerRadius, innerRadius + rings[i].width, 90, j * (360 / quadrants.length), rings[i].color, rings[i].name, quadrants[j].name, quadrants[j].blipsColor);
    }
  }

  stage.add(arcsLayer);

  var quadrantsLabelsLayer = new Konva.Layer();
  var radarRadius = getRadarRadius();

  for (var j = 0; j < quadrants.length; j++) {
    addQuadrantLabel(quadrants[j].label, radarRadius, j, 20, quadrantsLabelsLayer);
  }
  stage.add(quadrantsLabelsLayer);

}

function getRadarRadius() {
  var r = 0;
  for (var i = 0; i < rings.length; i++) {
    r += rings[i].width;
  }
  return r;
}

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
    fontFamily: 'Calibri',
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

function highlightDetails(theBlip) {
  var theDiv = getDetailsDivFromBlip(theBlip);
  if (theDiv) {
    theDiv.addClass("highlightedDetails");
  }
}

function unhighlightDetails(theBlip) {
  var theDiv = getDetailsDivFromBlip(theBlip);
  if (theDiv) {
    theDiv.removeClass("highlightedDetails");
  }
}

function updateTips( t ) {
  var tips = $( ".newBlipValidateTips" );
  tips
    .text( t )
    .addClass( "ui-state-highlight" );
  setTimeout(function() {
    tips.removeClass( "ui-state-highlight", 1500 );
  }, 500 );
}

function checkLength( o, n, min, max ) {
  if ( o.val().length > max || o.val().length < min ) {
    o.addClass( "ui-state-error" );
    updateTips( "Length of " + n + " must be between " +
      min + " and " + max + "." );
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
          "Create new blip": addNewBlip,
          Cancel: function() {
            newBlipDialog.dialog( "close" );
          }
        },
        close: function() {
          newBlipForm[ 0 ].reset();
          allFields.removeClass( "ui-state-error" );
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

var viewBlipDialog = undefined;

function initViewBlipDialog() {
  viewBlipDialog = $( "#viewBlipDialog" ).dialog({
        autoOpen: false,
        height: 600,
        width: 500,
        modal: true,
        buttons: {
          "Close": function() {
            newBlipDialog.dialog( "close" );
          }
        }
      });
}

function openViewBlipDialog(theBlipId) {

  var newBlipLabel = $( "#newBlipLabel" );
  var newBlipDescription = $( "#newBlipDescription" );
  //viewBlipLabel.html("");
  //viewBlipDescription.html("");

  var theBlip = getBlipById(theBlipId);
  var c = theBlip.find('Circle')[0];
  var t = theBlip.find('Text')[0];
  //var blipId = t.getAttr('text');
  var blipLabel = t.getAttr('label');
  var blipDescription = t.getAttr('description');
  var viewBlipLabel = $( "#viewBlipLabel" );
  var viewBlipDescription = $( "#viewBlipDescription" );
  $( "#viewBlipDialog" ).dialog( "option", "title", blipLabel );
  viewBlipDescription.html(blipDescription);

  viewBlipDialog.dialog( "open" );
}

function addNewBlip() {
  var newBlipLabel = $( "#newBlipLabel" );
  var newBlipDescription = $( "#newBlipDescription" );
  var allFields = $( [] ).add( newBlipLabel ).add( newBlipDescription );

  var valid = true;
  allFields.removeClass( "ui-state-error" );

  valid = valid && checkLength( newBlipLabel, "'label'", 3, 16 );
  valid = valid && checkLength( newBlipDescription, "'description'", 6, 80 );

  if ( valid ) {
    var result = {};
    result.label = newBlipLabel.val();
    result.description = newBlipDescription.val();
    newBlipDialog.dialog( "close" );
    addBlip(50, 50, getNewBlipId().toString(), result.label, result.description);
  }
  return valid;
}

function addBlip(thePosX, thePosY, theBlipId, theLabel) {
  //console.log("Adding blip ID " + blipId + " (" + x + ", " + y + ")");
  var group = new Konva.Group({
    id: "blip_" + theBlipId,
    name: "blipGroup",
    // starting pos
    x: thePosX,
    y: thePosY,
    draggable: true
  });

  var scale = 1;
  // create circle
  var circle = new Konva.Circle({
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
    startScale: scale
  });

  group.on('mouseenter', function () {
      if (canEdit) {
        stage.container().style.cursor = 'move'; // 'default', 'pointer', 'move', 'crosshair'
      }
      highlightDetails(this);
  });

  group.on('mouseleave', function () {
      stage.container().style.cursor = 'default';
      unhighlightDetails(this);
  });

  var text = new Konva.Text({
    text: theBlipId,
    fontSize: 12,
    fontFamily: 'Calibri',
    fill: 'white',
    label: theLabel
  });

  var textClientRect = text.getClientRect();
  text.setAttrs({
    x: - textClientRect.width / 2,
    y: - textClientRect.height / 2
  });

  group.add(circle);
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
  }
}

function addStars() {
  var layer = new Konva.Layer();
  var dragLayer = new Konva.Layer();

  for(var n = 0; n < 30; n++) {
    addStar(layer, stage);
  }

  stage.add(layer, dragLayer);

  stage.on('dragstart', function(evt) {
    var shape = evt.target;
    // moving to another layer will improve dragging performance
    shape.moveTo(dragLayer);
    stage.draw();
    shape.setAttrs({
      shadowOffset: {
        x: 15,
        y: 15
      },
      scale: {
        x: shape.getAttr('startScale') * 1.2,
        y: shape.getAttr('startScale') * 1.2
      }
    });
  });

  stage.on('dragend', function(evt) {
    var shape = evt.target;
    shape.moveTo(layer);
    stage.draw();
    shape.to({
      duration: 0.5,
      easing: Konva.Easings.ElasticEaseOut,
      scaleX: shape.getAttr('startScale'),
      scaleY: shape.getAttr('startScale'),
      shadowOffsetX: 5,
      shadowOffsetY: 5
    });
  });
}

function addQuadrant(layer, innerRadius, outerRadius, angle, rotation, fill, ringName, quadrantName, blipsColor) {
  var arc = new Konva.Arc({
    x: stage.getWidth() / 2,
    y: stage.getHeight() / 2,
    innerRadius: innerRadius,
    outerRadius: outerRadius,
    angle: angle,
    rotation: rotation,
    fill: fill,
    stroke: 'black',
    strokeWidth: 0,
    ringName: ringName,
    quadrantName: quadrantName,
    blipsColor: blipsColor
  });

  arcs.push(arc);

  layer.add(arc);
}

function addStar(layer, stage) {
  var scale = Math.random();

  var star = new Konva.Star({
    x: Math.random() * stage.getWidth(),
    y: Math.random() * stage.getHeight(),
    numPoints: 5,
    innerRadius: 30,
    outerRadius: 50,
    fill: '#89b717',
    opacity: 0.8,
    draggable: true,
    scale: {
      x : scale,
      y : scale
    },
    rotation: Math.random() * 180,
    shadowColor: 'black',
    shadowBlur: 10,
    shadowOffset: {
      x : 5,
      y : 5
    },
    shadowOpacity: 0.6,
    // custom attribute
    startScale: scale
  });

  layer.add(star);
}

function exportGraph() {
  if (blipsLayer) {
    var result = {};
    var blipGroups = blipsLayer.find('Group');
    for (var i = 0; i < blipGroups.length; i++) {
      var g = blipGroups[i];
      var x = g.getAttr('x');
      var y = g.getAttr('y');
      var c = g.find('Circle')[0];
      var t = g.find('Text')[0];
      var blipId = t.getAttr('text');
      result[blipId] = {'x': x, 'y': y, 'label': t.getAttr('label')};
      //console.log("" + label + ": (" + x + ", " + y + ")");
      //console.log("Circle: (" + c.getAttr('x') + ", " + c.getAttr('y') + ")");
      //console.log("Text: (" + t.getAttr('x') + ", " + t.getAttr('y') + ")");
    }
    var stringifyResult = JSON.stringify(result);
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(stringifyResult);
    var exportGraphAnchorElem = document.getElementById('exportGraphAnchorElem');
    exportGraphAnchorElem.setAttribute("href", dataStr);
    exportGraphAnchorElem.setAttribute("download", "lsTechRadar.json");
    exportGraphAnchorElem.click();
  }
}

function loadGraph(evt) {
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var files = evt.target.files; // FileList object
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];

    if (f) {
      var maxBlipId = 0;
      var r = new FileReader();
      r.onload = function(e) {
        clearBlips();
	      var content = e.target.result;
        //console.log("Got the file name " + f.name + ", size: " + f.size + " bytes")
        //console.log(contents);
        var json = JSON.parse(content);
        //console.log("JSON: " + JSON.stringify(json));
        for (var key in json) {
          var blipId = parseInt(key);
          if (blipId > maxBlipId) {
            maxBlipId = blipId;
          }
          addBlip(json[key]['x'], json[key]['y'], blipId, json[key]['label']);
        }
        newBlipId = maxBlipId;
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
  theBlip.find("Text")[0].setAttr("text", "" + newId);
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
