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
    var point = Barycentric.convert2d.apply( null, [ mouse.x, mouse.y ].concat( tri0 ) );
    p1 = Barycentric.interpolate2d.apply( null, [ point.u, point.v, point.w ].concat( tri1 ) );

    updateDOM({
      vertex: mouse,
      barycentric: point,
      transform: p1
    });
  }

  function drawPolygon( ctx, vertices ) {
    if ( vertices.length < 2 ) {
      return;
    }

    ctx.moveTo( vertices[0], vertices[1] );
    for ( var i = 1, il = 0.5 * vertices.length; i < il; i++ ) {
      ctx.lineTo( vertices[ 2 * i ], vertices[ 2 * i + 1 ] );
    }

    ctx.closePath();
  }

  function drawVertices( ctx, vertices, radius ) {
    var x, y;
    for ( var i = 0, il = 0.5 * vertices.length; i < il; i++ ) {
      x = vertices[ 2 * i ];
      y = vertices[ 2 * i + 1 ];

      ctx.moveTo( x, y );
      ctx.arc( x, y, radius, 0, PI2 );
    }
  }

  function draw( ctx ) {
    ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#fff';

    ctx.beginPath();
    drawPolygon( ctx, tri0 );
    drawPolygon( ctx, tri1 );
    ctx.stroke();

    ctx.beginPath();
    drawVertices( ctx, tri0, 4 );
    drawVertices( ctx, tri1, 4 );
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
  }

  draw( context );
  canvas.addEventListener( 'mousemove', onMouseMove );

}) ( window, document );
