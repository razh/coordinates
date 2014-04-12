/*globals Geometry, MeanValue*/
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
  var octagon = Geometry.createRegularPolygon(8);
  // Transform octagon.
  (function() {
    var tx = 150,
        ty = 300,
        scale = 65;

    for ( var i = 0, il = 0.5 * octagon.length; i < il; i++ ) {
      octagon[ 2 * i     ] = tx + scale * octagon [ 2 * i    ];
      octagon[ 2 * i + 1 ] = ty + scale * octagon [ 2 * i + 1 ];
    }
  }) ();

  function update() {}

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
  }

  draw( context );
  canvas.addEventListener( 'mousemove', onMouseMove );

}) ( window, document );
