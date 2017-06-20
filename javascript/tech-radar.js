var width = 1000;
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

var rings = [
  {width: 110, color: '#999999', name: 'adopt'},
  {width: 110, color: '#AAAAAA', name: 'trial'},
  {width: 90, color: '#BBBBBB', name: 'assess'},
  {width: 70, color: '#CCCCCC', name: 'hold'}
];

var quadrants = [
  {name: 'languages_frameworks', blipsColor: 'pink', label: 'Languages &\nFrameworks'},
  {name: 'platforms', blipsColor: 'orange', label: 'Platforms'},
  {name: 'techniques', blipsColor: 'blue', label: 'Techniques'},
  {name: 'tools', blipsColor: 'green', label: 'Tools'}
];


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
    colorBlip(shape, true);
  });

  document.getElementById('fileInputId').addEventListener('change', loadGraph, false);
  //addStars();


});

function colorBlip(theBlip, withEffect) {
  var circle = theBlip.find("Circle")[0];
  //var pos = stage.getPointerPosition();
  var arc = getArc(theBlip);
  if (arc) {
    circle.fill(arc.getAttr('blipsColor'));
  }
  else {
    circle.fill(blipColorDefault);
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
  text.setAttrs({
    x: x - offsetX,
    y: y - offsetY
  });
  layer.add(text);
}

var newBlipId = 0;
function getNewBlipId() {
  return ++newBlipId;
}

function getValueOrDefault(theVal, theDefault) {
  if (theVal !== undefined) {
    return theVal;
  }
  else {
    return theDefault;
  }
}

function addBlip(thePosX, thePosY, theBlipId) {
  var x = getValueOrDefault(thePosX, 50);
  var y = getValueOrDefault(thePosY, 50);
  // TODO: do not execute function if not needed.
  //var blipId = getValueOrDefault(thePosX, getNewBlipId);
  if (theBlipId !== undefined) {
    var blipId = theBlipId;
  }
  else {
    var blipId = getNewBlipId().toString();
  }
  //console.log("Adding blip ID " + blipId + "(" + x + ", " + y + ")");
  var group = new Konva.Group({
    // starting pos
    x: x,
    y: y,
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
      stage.container().style.cursor = 'move'; // 'default', 'pointer', 'move', 'crosshair'
  });

  group.on('mouseleave', function () {
      stage.container().style.cursor = 'default';
  });

  var text = new Konva.Text({
    text: blipId,
    fontSize: 12,
    fontFamily: 'Calibri',
    fill: 'white'
  });

  var textClientRect = text.getClientRect();
  text.setAttrs({
    x: - textClientRect.width / 2,
    y: - textClientRect.height / 2
  });

  group.add(circle);
  group.add(text);
  blipsLayer.add(group);

  colorBlip(group);

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
      result[blipId] = {'x': x, 'y': y};
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
          addBlip(json[key]['x'], json[key]['y'], blipId);
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
