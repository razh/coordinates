/*globals Barycentric*/
(function( window, document, undefined ) {
  'use strict';

  var PI2 = 2 * Math.PI;

  var canvas  = document.getElementById( 'barycentric-canvas' ),
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

  var tri0 = [ 50, 50, 300, 200, 250, 50 ];

  // Approximate equilateral triangle.
  var tri1 = [ 100, 500, 308, 500, 204, 320 ];

  // Point on tri1.
  var p1 = { x: 0, y: 0 };

  var updateDOM = (function() {
    var vertexEls = [].slice.call( document.querySelectorAll( '.vertex .coordinate ') );
    var barycentricEls = [].slice.call( document.querySelectorAll( '.barycentric .coordinate ') );
    var transformEls = [].slice.call( document.querySelectorAll( '.transform .coordinate ') );

    return function( vertex, barycentric, transform ) {
      vertexEls[0].textContent = vertex.x.toFixed(2);
      vertexEls[1].textContent = vertex.y.toFixed(2);

      barycentricEls[0].textContent = barycentric.u.toFixed(2);
      barycentricEls[1].textContent = barycentric.v.toFixed(2);
      barycentricEls[2].textContent = barycentric.w.toFixed(2);

      transformEls[0].textContent = transform.x.toFixed(2);
      transformEls[1].textContent = transform.y.toFixed(2);
    };
  }) ();

  function update() {
    var point = Barycentric.convert2d.apply( null, [ mouse.x, mouse.y ].concat( tri0 ) );
    p1 = Barycentric.interpolate2d.apply( null, [ point.u, point.v, point.w ].concat( tri1 ) );
    updateDOM( mouse, point, p1 );
  }

  function drawVertices( ctx, vertices ) {
    if ( vertices.length < 2 ) {
      return;
    }

    ctx.beginPath();

    ctx.moveTo( vertices[0], vertices[1] );
    for ( var i = 0, il = 0.5 * vertices.length; i < il; i++ ) {
      ctx.lineTo( vertices[ 2 * i ], vertices[ 2 * i + 1 ] );
    }

    ctx.closePath();
  }

  function draw( ctx ) {
    ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#fff';

    drawVertices( ctx, tri0 );
    ctx.stroke();

    drawVertices( ctx, tri1 );
    ctx.stroke();

    ctx.beginPath();
    ctx.arc( mouse.x, mouse.y, 4, 0, PI2 );
    ctx.fillStyle = '#3f4';
    ctx.fill();

    ctx.beginPath();
    ctx.arc( p1.x, p1.y, 4, 0, PI2 );
    ctx.fillStyle = '#f43';
    ctx.fill();
  }

  draw( context );
  canvas.addEventListener( 'mousemove', onMouseMove );

}) ( window, document );
