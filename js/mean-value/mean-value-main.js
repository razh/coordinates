/*globals Geometry, Selection, Polygon, Grid, MeanValue*/
(function( window, document, undefined ) {
  'use strict';

  var PI2 = 2 * Math.PI;

  var canvas  = document.getElementById( 'mean-value-canvas' ),
      context = canvas.getContext( '2d' );

  canvas.width = 512;
  canvas.height = 512;

  var mouse = {
    x: 0,
    y: 0
  };

  // Transformed point.
  var transform = {
    x: 0,
    y: 0
  };

  function onMouseMove( event ) {
    mouse.x = event.pageX - canvas.offsetLeft;
    mouse.y = event.pageY - canvas.offsetTop;

    update();
    draw( context );
  }

  // Polygons.
  // A octagon pretending to be a square.
  var octSquare = [
    100, 50, 100, 100,
    100, 150, 150, 150,
    200, 150, 200, 100,
    200, 50, 150, 50
  ];

  // A regular octagon.
  var octagon = new Polygon();
  octagon.vertices = Geometry.createRegularPolygon(8);
  // Transform octagon.
  octagon.x = 150;
  octagon.y = 300;
  octagon.scaleX = octagon.scaleY = 65;
  octagon = octagon.getWorldVertices();

  var grid = new Grid({
    width: 150,
    height: 150,
    cols: 15,
    rows: 15
  });

  grid.x = 80;
  grid.y = 30;

  function update() {
    var weights = MeanValue.convert2d( mouse.x, mouse.y, octSquare );
    transform = MeanValue.interpolate2d( weights, octagon );
  }

  function draw( ctx ) {
    ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#fff';

    ctx.beginPath();
    Geometry.drawPolygon( ctx, octSquare );
    Geometry.drawPolygon( ctx, octagon );
    ctx.stroke();

    ctx.beginPath();
    Geometry.drawVertices( ctx, octSquare, 4 );
    Geometry.drawVertices( ctx, octagon, 4 );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    ctx.font = 'italic 16pt Georgia';
    ctx.fillStyle = '#fff';
    Geometry.drawVertexLabels( ctx, octSquare, 8 );
    Geometry.drawVertexLabels( ctx, octagon, 8 );

    ctx.beginPath();
    ctx.arc( mouse.x, mouse.y, 4, 0, PI2 );
    ctx.fillStyle = '#3f4';
    ctx.fill();

    ctx.beginPath();
    ctx.arc( transform.x, transform.y, 4, 0, PI2 );
    ctx.fillStyle = '#f43';
    ctx.fill();

    // Draw grid.
    ctx.beginPath();
    var worldVertices = grid.getWorldVertices();
    Geometry.drawVertices( ctx, worldVertices, 2 );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();

    ctx.beginPath();
    var x, y;
    var weights;
    var p;
    for ( var i = 0, il = 0.5 * worldVertices.length; i < il; i++ ) {
      x = worldVertices[ 2 * i ];
      y = worldVertices[ 2 * i + 1 ];
      weights = MeanValue.convert2d( x, y, octSquare );
      p = MeanValue.interpolate2d( weights, octagon );
      if ( !p || !isFinite( p.x ) || !isFinite( p.y ) ) {
        console.log( 'Undefined vertex at index ' + i + '.' );
        console.log( weights );
      }

      ctx.moveTo( p.x, p.y );
      ctx.arc( p.x, p.y, 2, 0, PI2 );
    }

    ctx.fill();
  }

  draw( context );
  canvas.addEventListener( 'mousemove', onMouseMove );

  // Initialize selection interaction.
  Selection.setElement( canvas );
  Selection.addHandlers( octSquare );
  Selection.addHandlers( octagon );

}) ( window, document );
