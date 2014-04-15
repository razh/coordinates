/*globals Geometry, Selection, Grid, Barycentric*/
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

  // Barycentric helper functions.
  function baryConvert2d( x, y, triangle ) {
    return Barycentric.convert2d.apply( null, [ x, y ].concat( triangle ) );
  }

  function baryInterp2d( u, v, w, triangle ) {
    return Barycentric.interpolate2d.apply( null, [ u, v, w ].concat( triangle ) );
  }

  var tri0 = [ 50, 50, 300, 200, 250, 50 ];

  // Approximate equilateral triangle.
  var tri1 = [ 100, 480, 308, 480, 204, 300 ];

  // Point on tri1.
  var p1 = { x: 0, y: 0 };

  var grid = new Grid({
    width: 300,
    height: 200,
    cols: 30,
    rows: 20
  });

  grid.x = 30;
  grid.y = 30;

  /**
   * Updates DOM coordinates element with corresponding key/values.
   *
   * For example:
   *   updateDOM({ point: { x: 32, y: 16 }});
   *
   * Will update (Jade template):
   *
   *  .point
   *    .coordinate(data-coordinate='x') -> 32
   *    .coordinate(data-coordinate='y') -> 16
   */
  var updateDOM = (function() {
    // Returns an array of all element matching selector.
    function $$( selector ) {
      return [].slice.call( document.querySelectorAll( selector ) );
    }

    // Converts an array of elements to an object with
    // element cooordinate attributes as keys.
    function byCoordinateAttr( object, el ) {
      object[ el.getAttribute( 'data-coordinate' ) ] = el;
      return object;
    }

    // Object of coordinate elements.
    var els = {
      vertex: null,
      barycentric: null,
      transform: null
    };

    function elOf( key, axis ) {
      if ( els[ key ] ) {
        return els[ key ][ axis ];
      }
    }

    // Get elements by coordinate attribute.
    Object.keys( els ).forEach(function( key ) {
      els[ key ] = $$( '.' + key + ' .coordinate' ).reduce( byCoordinateAttr, {} );
    });

    return function() {
      var arg = arguments[0];
      if ( typeof arg !== 'object' ) {
        return;
      }

      Object.keys( arg ).forEach(function( key ) {
        var coordinates = arg[ key ];

        Object.keys( coordinates ).forEach(function( axis ) {
          var el = elOf( key, axis );
          if ( el ) {
            el.textContent = coordinates[ axis ].toFixed(2);
          }
        });
      });
    };
  }) ();

  function update() {
    var point = baryConvert2d( mouse.x, mouse.y, tri0 );
    p1 = baryInterp2d( point.u, point.v, point.w, tri1 );

    updateDOM({
      vertex: mouse,
      barycentric: point,
      transform: p1
    });
  }

  function draw( ctx ) {
    ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#fff';

    ctx.beginPath();
    Geometry.drawPolygon( ctx, tri0 );
    Geometry.drawPolygon( ctx, tri1 );
    ctx.stroke();

    ctx.beginPath();
    Geometry.drawVertices( ctx, tri0, 4 );
    Geometry.drawVertices( ctx, tri1, 4 );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc( mouse.x, mouse.y, 4, 0, PI2 );
    ctx.fillStyle = '#3f4';
    ctx.fill();

    ctx.beginPath();
    ctx.arc( p1.x, p1.y, 4, 0, PI2 );
    ctx.fillStyle = '#f43';
    ctx.fill();

    ctx.font = 'italic 16pt Georgia';
    ctx.fillStyle = '#fff';
    Geometry.drawVertexLabels( ctx, tri0, 8 );
    Geometry.drawVertexLabels( ctx, tri1, 8 );

    // Draw grid.
    ctx.beginPath();
    var worldVertices = grid.getWorldVertices();
    Geometry.drawVertices( ctx, worldVertices, 2 );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();

    ctx.beginPath();
    var x, y;
    var a, b;
    for ( var i = 0, il = 0.5 * worldVertices.length; i < il; i++ ) {
      x = worldVertices[ 2 * i ];
      y = worldVertices[ 2 * i + 1 ];
      a = baryConvert2d( x, y, tri0 );
      b = baryInterp2d( a.u, a.v, a.w, tri1 );
      if ( !b || !b.x || ! b.y ) {
        console.log( 'Undefined vertex at index ' + i + '.' );
      }

      ctx.moveTo( b.x, b.y );
      ctx.arc( b.x, b.y, 2, 0, PI2 );
    }

    ctx.fill();
  }

  draw( context );
  canvas.addEventListener( 'mousemove', onMouseMove );

  // Initialize selection interaction.
  Selection.setElement( canvas );
  Selection.addHandlers( tri0 );
  Selection.addHandlers( tri1 );

}) ( window, document );
