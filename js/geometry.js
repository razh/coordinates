/*exported Geometry*/
var Geometry = (function() {
  'use strict';

  var PI2 = 2 * Math.PI;
  var EPSILON = 1e-5;

  function lerp( a, b, t ) {
    return a + t * ( b - a );
  }

  function inverseLerp( a, b, value ) {
    return ( value - a ) / ( b - a );
  }

  function clamp( value, min, max ) {
    return Math.min( Math.max( value, min ), max );
  }

  function nearZero( value ) {
    return Math.abs( value ) < EPSILON;
  }

  function createRegularPolygon( sides ) {
    var angle = -PI2 / sides;

    var vertices = [];

    for ( var i = 0; i < sides; i++ ) {
      vertices.push( Math.cos( i * angle ) );
      vertices.push( Math.sin( i * angle ) );
    }

    return vertices;
  }

  function computeCentroid( vertices ) {
    var vertexCount = 0.5 * vertices.length;

    // Centroid.
    var x = 0,
        y = 0;

    var area = 0;
    var x0 = 0,
        y0 = 0;

    var third = 1 / 3;

    var triangleArea;
    var x1, y1, x2, y2;
    var dx0, dy0, dx1, dy1;
    for ( var i = 0; i < vertexCount; i++ ) {
      x1 = vertices[ 2 * i ];
      y1 = vertices[ 2 * i + 1 ];
      x2 = vertices[ 2 * ( ( i + 1 ) % vertexCount ) ];
      y2 = vertices[ 2 * ( ( i + 1 ) % vertexCount ) + 1 ];

      dx0 = x1 - x0;
      dy0 = y1 - x0;
      dx1 = x2 - x1;
      dy1 = y2 - y1;

      // Half the 2D 'cross product'.
      triangleArea = 0.5 * ( dx0 * dy1 - dx1 * dy0 );

      area += triangleArea;
      x += triangleArea * third * ( x0 + x1 + x2 );
      y += triangleArea * third * ( y0 + y1 + y2 );
    }

    return {
      x: x / area,
      y: y / area
    };
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

  function drawVertexLabels( ctx, vertices, offset, character ) {
    var centroid = computeCentroid( vertices );

    // Start at 'A' by default.
    character = character || 65;

    var x, y;
    var dx, dy;
    var angle;
    for ( var i = 0, il = 0.5 * vertices.length; i < il; i++ ) {
      x = vertices[ 2 * i ];
      y = vertices[ 2 * i + 1 ];

      dx = x - centroid.x;
      dy = y - centroid.y;

      // Offset test by angle.
      angle = Math.atan2( dy, dx );
      x += Math.cos( angle ) * offset;
      y += Math.sin( angle ) * offset;

      // Set alignment and baseline such that the character is
      // drawn away from the centroid.
      ctx.textAlign = nearZero( dx ) ? 'center' : ( dx > 0 ? 'left' : 'right' );
      ctx.textBaseline = nearZero( dy ) ? 'middle' : ( dy > 0 ? 'top' : 'bottom' );

      ctx.fillText( String.fromCharCode( character + i ), x, y );
    }
  }

  return {
    lerp: lerp,
    inverseLerp: inverseLerp,
    clamp: clamp,

    nearZero: nearZero,

    createRegularPolygon: createRegularPolygon,

    computeCentroid: computeCentroid,

    drawPolygon: drawPolygon,
    drawVertices: drawVertices,
    drawVertexLabels: drawVertexLabels
  };
}) ();
