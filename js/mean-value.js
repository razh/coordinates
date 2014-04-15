/*exported MeanValue*/
var MeanValue = (function() {
  'use strict';

  /**
   * modulo with Euclidean division.
   * Always the same sign as the divisor (d).
   * Useful for accessing arrays using negative indices.
   *
   * Example:
   *   modulo( -1, 3 ) => 2
   */
  function modulo( n, d ) {
    return ( ( n % d ) + d  ) % d;
  }

  /**
   * Converts (x, y) to a set of mean-value coordinate weights.
   *
   * Note that vertices should be arranged counter-clockwise or weights will be
   * negative.
   */
  function convert2d( x, y, vertices ) {
    var vertexCount = 0.5 * vertices.length;

    var weights = [];
    var sum = 0;

    // Note that (x1, y1) and a1 represent the current vertex and angle.
    var x0, y0, x1, y1, x2, y2;
    var dx0, dy0, dx1, dy1, dx2, dy2;
    var a0, a1;
    var distance;
    var weight;
    var i;
    for ( i = 0; i < vertexCount; i++ ) {
      // Previous vertex.
      x0 = vertices[ 2 * modulo( i - 1, vertexCount ) ];
      y0 = vertices[ 2 * modulo( i - 1, vertexCount ) + 1 ];
      // Current vertex.
      x1 = vertices[ 2 * i ];
      y1 = vertices[ 2 * i + 1 ];
      // Next vertex.
      x2 = vertices[ 2 * ( ( i + 1 ) % vertexCount ) ];
      y2 = vertices[ 2 * ( ( i + 1 ) % vertexCount ) + 1 ];

      // Calculate angles.
      dx0 = x0 - x;
      dy0 = y0 - y;

      dx1 = x1 - x;
      dy1 = y1 - y;

      dx2 = x2 - x;
      dy2 = y2 - y;

      a0 = Math.atan2( dy1, dx1 ) - Math.atan2( dy0, dx0 );
      a1 = Math.atan2( dy2, dx2 ) - Math.atan2( dy1, dx1 );

      distance = Math.sqrt( dx1 * dx1 + dy1 * dy1 );

      /**
       * Calculate weight:
       *
       *           tan( a0 / 2 ) + tan( a1 / 2 )
       * weight = --------------------------------
       *                   || ai - a1 ||
       */
      weight = ( Math.tan( 0.5 * a0 ) + Math.tan( 0.5 * a1 ) ) / distance;
      weights.push( weight );
      sum += weight;
    }

    // If the sum of weights is infinite, then the point lies on either
    // a vertex or an edge.
    var il;
    var i0, i1;
    var indices;
    var dx, dy;
    var distanceSquared;
    if ( !isFinite( sum ) ) {
      sum = 0;
      indices = [];
      // Convert all infinite weight values to one.
      // All other values are zeroed.
      for ( i = 0, il = weights.length; i < il; i++ ) {
        if ( isFinite( weights[i] ) ) {
          weights[i] = 0;
        } else {
          weights[i] = 1;
          indices.push(i);
          sum++;
        }
      }

      // The point is on a vertex.
      // No need to normalize weights.
      if ( sum === 1 ) {
        return weights;
      }

      // The points lies on an edge.
      if ( sum === 2 ) {
        i0 = indices[0];
        i1 = indices[1];

        x0 = vertices[ 2 * modulo( i0, vertexCount ) ];
        y0 = vertices[ 2 * modulo( i0, vertexCount ) + 1 ];
        x1 = vertices[ 2 * modulo( i1, vertexCount ) ];
        y1 = vertices[ 2 * modulo( i1, vertexCount ) + 1 ];

        dx1 = x1 - x;
        dy1 = y1 - y;

        dx = x1 - x0;
        dy = y1 - y0;

        distanceSquared = dx * dx + dy * dy;

        // Handle degenerate distances (two vertices have the same position).
        if ( !distanceSquared ) {
          weights[ i0 ] = 1;
          weights[ i1 ] = 0;
          return weights;
        }

        // Determine the lerp parameter with the dot product.
        weights[ i0 ] = ( dx1 * dx + dy1 * dy ) / distanceSquared;
        weights[ i1 ] = 1 - weights[ i0 ];

        // As the combined weights must sum up to one, it is not necessary to
        // normalize weights.
        return weights;
      }
    }

    // Normalize weights.
    var sumInverse = 1 / sum;
    for ( i = 0, il = weights.length; i < il; i++ ) {
      weights[i] *= sumInverse;
    }

    return weights;
  }

  /**
   * Interpolates mean-value coordinate weights along vertices.
   */
  function interpolate2d( weights, vertices ) {
    var vertexCount = 0.5 * vertices.length;
    if ( vertexCount > weights.length ) {
      return;
    }

    var x = 0,
        y = 0;

    for ( var i = 0; i < vertexCount; i++ ) {
      x += weights[i] * vertices[ 2 * i ];
      y += weights[i] * vertices[ 2 * i + 1 ];
    }

    return {
      x: x,
      y: y
    };
  }

  return {
    convert2d: convert2d,
    interpolate2d: interpolate2d
  };
}) ();
