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


$( document ).ready(function() {
  stage = new Konva.Stage({
    container: 'container',
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
    var circle = shape.find("Circle")[0];
    //var pos = stage.getPointerPosition();
    var arc = getArc(shape);
    if (arc) {
      circle.fill(arc.getAttr('blipsColor'));
    }
    else {
      circle.fill(blipColorDefault);
    }
    shape.moveTo(blipsLayer);
    stage.draw();
    circle.to({
      duration: 0.5,
      easing: Konva.Easings.ElasticEaseOut,
      scaleX: circle.getAttr('startScale'),
      scaleY: circle.getAttr('startScale'),
      shadowOffsetX: blipShadowOffsetX,
      shadowOffsetY: blipShadowOffsetY
    });
  });


  //addStars();


});

function getArc(shape) {
  console.log("Circle pos: " + shape.getAttr('x') + ", " + shape.getAttr('y'));
  console.log("Circle offset: " + shape.getAttr('offsetX') + ", " + shape.getAttr('offsetY'));
  return arcsLayer.getIntersection({x: shape.getAttr('x'), y: shape.getAttr('y')});
}

function getRing(shape) {

}

function addQuadrants() {
  arcsLayer = new Konva.Layer();
  var ring1Width = 110;
  var ring2Width = 110;
  var ring3Width = 90;
  var ring4Width = 70;
  var ring1 = {innerRadius: 0, outerRadius: ring1Width, color: '#999999', name: 'adopt'};
  var ring2 = {innerRadius: ring1.outerRadius, outerRadius: ring1.outerRadius + ring2Width, color: '#AAAAAA', name: 'trial'};
  var ring3 = {innerRadius: ring2.outerRadius, outerRadius: ring2.outerRadius + ring3Width, color: '#BBBBBB', name: 'assess'};
  var ring4 = {innerRadius: ring3.outerRadius, outerRadius: ring3.outerRadius + ring4Width, color: '#CCCCCC', name: 'hold'};
  var rings = [ring1, ring2, ring3, ring4];
  for (var i = 0; i < rings.length; i++) {
     addQuadrant(arcsLayer, rings[i].innerRadius, rings[i].outerRadius, 90, 0, rings[i].color, rings[i].name, 'languages_frameworks', 'pink');
     addQuadrant(arcsLayer, rings[i].innerRadius, rings[i].outerRadius, 90, 90, rings[i].color, rings[i].name, 'platforms', 'orange');
     addQuadrant(arcsLayer, rings[i].innerRadius, rings[i].outerRadius, 90, 180, rings[i].color, rings[i].name, 'techniques', 'blue');
     addQuadrant(arcsLayer, rings[i].innerRadius, rings[i].outerRadius, 90, 270, rings[i].color, rings[i].name, 'tools', 'green');
  }

  stage.add(arcsLayer);
  var quadrantsLabelsLayer = new Konva.Layer();
  addQuadrantLabel('Languages &\nFrameworks', ring3.outerRadius + ring4Width, 1, 20, quadrantsLabelsLayer);
  addQuadrantLabel('Platforms', ring3.outerRadius + ring4Width, 2, 20, quadrantsLabelsLayer);
  addQuadrantLabel('Techniques', ring3.outerRadius + ring4Width, 3, 20, quadrantsLabelsLayer);
  addQuadrantLabel('Tools', ring3.outerRadius + ring4Width, 4, 20, quadrantsLabelsLayer);
  stage.add(quadrantsLabelsLayer);
}

function addQuadrantLabel(label, outerRingRadius, quadrantIndex, offset, layer) {
  var offsetX = outerRingRadius * (Math.sin(Math.PI / 4));
  var offsetY = outerRingRadius * (Math.cos(Math.PI / 4));
  if (quadrantIndex == 2) {
    offsetX = -offsetX;
  }
  else if (quadrantIndex == 3) {
    offsetX = -offsetX;
    offsetY = -offsetY;
  }
  else if (quadrantIndex == 4) {
    offsetY = -offsetY;
  }
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
  if (quadrantIndex == 1) {
    offsetX = -offset;
    offsetY = -offset;
  }
  else if (quadrantIndex == 2) {
    offsetX = rect.width + offset;
    offsetY = -offset;
  }
  else if (quadrantIndex == 3) {
    offsetX = rect.width + offset;
    offsetY = rect.height + offset;
  }
  else if (quadrantIndex == 4) {
    offsetX = -offset;
    offsetY = rect.height + offset;
  }
  text.setAttrs({
    x: x - offsetX,
    y: y - offsetY
  });
  layer.add(text);
}

// TODO: get from DB (e.g. sequence)
var newBlipId = 0;
function getNewBlipId() {
  return ++newBlipId;
}

function addBlip() {
  var group = new Konva.Group({
    // starting pos
    x: 50,
    y: 50,
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

  var text = new Konva.Text({
    text: getNewBlipId().toString(),
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

  //blipsLayer.add(circle);
  stage.draw();
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
