/*exported Harmonic*/
var Harmonic = (function() {
  'use strict';

  var config = {
    // Cell count on a side.
    cellCount: Math.pow( 2, 6 )
  };

  var CellType = {
    UNTYPED: 0,
    BOUNDARY: 1,
    INTERIOR: 2,
    EXTERIOR: 3
  };


  /**
   * Marks all cells which lie on the Bresenham line rasterization as
   * BOUNDARY cells.
   *
   * Vertices are expected to be normalized to grid units. That is, a grid
   * cell will have world dimensions equal to column width and row height, but
   * local dimensions of 1 by 1.
   */
  function bresenham( grid, x0, y0, x1, y1 ) {
    var dx = Math.abs( x1 - x0 ),
        dy = Math.abs( y1 - y0 );

    // Steps.
    var sx = x0 < x1 ? 1 : -1,
        sy = y0 < y1 ? 1 : -1;

    var error = dx - dy;

    var error2;
    while ( true ) {
      grid[ y0 ][ x0 ] = CellType.BOUNDARY;
      if ( x0 >= x1 && y0 >= y1 ) {
        return;
      }

      error2 = 2 * error;
      if ( error2 > -dy ) {
        error -= dy;
        x0 += sx;
      }

      if ( error2 < dx ) {
        error += dx;
        y0 += sy;
      }
    }
  }

  function dimensions( vertices ) {
    var xmin = Number.POSITIVE_INFINITY,
        ymin = Number.POSITIVE_INFINITY,
        xmax = Number.NEGATIVE_INFINITY,
        ymax = Number.NEGATIVE_INFINITY;

    var x, y;
    for ( var i = 0, il = 0.5 * vertices.length; i < il; i++ ) {
      x = vertices[ 2 * i ];
      y = vertices[ 2 * i + 1 ];

      if ( x < xmin ) { xmin = x; }
      if ( x > xmax ) { xmax = x; }
      if ( y < ymin ) { ymin = y; }
      if ( y > ymax ) { ymax = y; }
    }

    return {
      x: xmin,
      y: ymin,
      width: xmax - xmin,
      height: ymax - ymin
    };
  }

  function convert2d( x, y, vertices ) {
    var vertexCount = 0.5 * vertices;
    var aabb = dimensions( vertices );

    var cellCount = config.cellCount;

    var scaleX = cellCount / aabb.width,
        scaleY = cellCount / aabb.height;

    var cells = new Array( cellCount * cellCount );

    var i, j;
    for ( i = 0; i < cellCount; i++ ) {
      for ( j = 0; j < cellCount; j++ ) {
        cells.push({
          type: CellType.UNTYPED
        });
      }
    }

    // Determine boundaries.
    var xmin = aabb.x,
        ymin = aabb.y;

    var x0, y0, x1, y1;
    var il;
    for ( i = 0, il = 0.5 * vertices.length; i < il; i++ ) {
      x0 = vertices[ 2 * i ];
      y0 = vertices[ 2 * i + 1 ];
      x1 = vertices[ 2 * ( ( i + 1 ) % vertexCount ) ];
      y1 = vertices[ 2 * ( ( i + 1 ) % vertexCount ) + 1 ];

      // Normalize line to grid.
      x0 = ( x0 - xmin ) * scaleX;
      y0 = ( y0 - ymin ) * scaleY;
      x1 = ( x1 - xmin ) * scaleX;
      y1 = ( y1 - ymin ) * scaleY;

      bresenham( cells, x0, y0, x1, y1 );
    }
  }

  return {
    convert2d: convert2d
  };
}) ();
