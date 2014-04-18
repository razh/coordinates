/*jshint bitwise: false*/
/*exported Harmonic*/
var Harmonic = (function() {
  'use strict';

  var config = {
    // Cell count on a side.
    cellCount: Math.pow( 2, 6 )
  };

  var CellType = {
    UNTYPED: 1,
    BOUNDARY: 2,
    INTERIOR: 4,
    EXTERIOR: 8
  };

  function clamp( value, min, max ) {
    return Math.min( Math.max( value, min ), max );
  }

  /**
   * Marks all cells which lie on the Bresenham line rasterization as
   * BOUNDARY cells.
   *
   * Vertices are expected to be normalized to grid units. That is, a grid
   * cell will have world dimensions equal to column width and row height, but
   * local dimensions of 1 by 1.
   *
   * Assumes a square grid.
   */
  function bresenham( grid, count, x0, y0, x1, y1 ) {
    var dx = Math.abs( x1 - x0 ),
        dy = Math.abs( y1 - y0 );

    // Steps.
    var sx = x0 < x1 ? 1 : -1,
        sy = y0 < y1 ? 1 : -1;

    var error = dx - dy;

    var error2;
    var cell;
    while ( true ) {
      cell = grid[ y0 * count + x0 ];
      cell.type = CellType.BOUNDARY;
      cell.value++;

      if ( x0 === x1 && y0 === y1 ) {
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

  /**
   * Flood fill to mark all EXTERIOR cells.
   *
   * Assumes a square grid.
   */
  function floodFill( grid, count, x, y, dx, dy ) {
    var xi = x,
        yi = y;

    var horizontal;
    while ( true ) {
      var index = yi * count + xi;
      if ( grid[ index ].type === CellType.BOUNDARY ) {
        return;
      }

      grid[ index ].type = CellType.EXTERIOR;

      // Flood fill horizontally.
      horizontal = true;
      while ( horizontal ) {
        xi += dx;
        index = yi * count + xi;

        if ( grid[ index ].type === CellType.BOUNDARY ) {
          horizontal = false;
          xi = x;
        } else {
          grid[ index ].type = CellType.EXTERIOR;
        }

        if ( !dx || xi === 0 || xi === count - 1 ) {
          horizontal = false;
          xi = x;
        }
      }

      yi += dy;

      if ( !dy || yi === 0 || yi === count - 1 ) {
        return;
      }
    }
  }

  function scanLineFill( grid, count, y, reverse ) {
    var previous = grid[ !reverse ? (y * count) : (y * count + count - 1)].type;
    var exterior = 1;
    var index;
    var type;
    var cell;
    var value;
    var i;
    for ( i = 0; i < count; i++ ) {
      index = y * count + i;
      if ( reverse ) {
        index = y * count + ( count - i - 1);
      }
      cell = grid[ index ];
      type = cell.type;
      value = cell.value;

      exterior ^= value % 2;
      // if ( exterior &&
      //      previous !== CellType.BOUNDARY &&
      //      type === CellType.BOUNDARY ) {
      //   exterior = false;
      // } else if ( !exterior &&
      //             previous !== CellType.BOUNDARY &&
      //             type === CellType.BOUNDARY ) {
      // } else if ( exterior &&
      //             previous === CellType.BOUNDARY &&
      //             type !== CellType.BOUNDARY ) {
      //   exterior ^= value % 2;
      // }

      previous = type;
      if ( exterior && type !== CellType.BOUNDARY ) {
        grid[ index ].type = CellType.EXTERIOR;
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
    var vertexCount = 0.5 * vertices.length;
    var aabb = dimensions( vertices );

    var cellCount = config.cellCount;

    var scaleX = cellCount / aabb.width,
        scaleY = cellCount / aabb.height;

    var cells = [];

    var i, il;
    for ( i = 0, il = cellCount * cellCount; i < il; i++ ) {
      cells.push({
        value: 0,
        type: CellType.UNTYPED
      });
    }

    // Determine boundaries.
    var xmin = aabb.x,
        ymin = aabb.y;

    var x0, y0, x1, y1;
    for ( i = 0; i < vertexCount; i++ ) {
      x0 = vertices[ 2 * i ];
      y0 = vertices[ 2 * i + 1 ];
      x1 = vertices[ 2 * ( ( i + 1 ) % vertexCount ) ];
      y1 = vertices[ 2 * ( ( i + 1 ) % vertexCount ) + 1 ];

      // Normalize line to grid.
      x0 = Math.floor( clamp( ( x0 - xmin ) * scaleX, 0, cellCount - 1 ) );
      y0 = Math.floor( clamp( ( y0 - ymin ) * scaleY, 0, cellCount - 1 ) );
      x1 = Math.floor( clamp( ( x1 - xmin ) * scaleX, 0, cellCount - 1 ) );
      y1 = Math.floor( clamp( ( y1 - ymin ) * scaleY, 0, cellCount - 1 ) );

      bresenham( cells, cellCount, x0, y0, x1, y1 );
    }

    for ( i = 0; i < cellCount; i++ ) {
      scanLineFill( cells, cellCount, i );
      scanLineFill( cells, cellCount, i, true );
    }

    /*
    // Flood fill to determine exterior cells.
    floodFill( cells, cellCount, 0, 0, 1, 1 );
    floodFill( cells, cellCount, 0, cellCount - 1, 1, -1 );
    floodFill( cells, cellCount, cellCount - 1, 0, -1, 1 );
    floodFill( cells, cellCount, cellCount - 1, cellCount - 1, -1, -1 );

    //  HACK: Flood fill from edges.
    for ( i = 0; i < cellCount; i++ ) {
      floodFill( cells, cellCount, i, 0, 0, 1 );
      floodFill( cells, cellCount, i, cellCount - 1, 0, -1 );
      floodFill( cells, cellCount, 0, i, 1, 0 );
      floodFill( cells, cellCount, cellCount - 1, i, -1, 0 );
    }
    */

    // Mark all interior cells.
    for ( i = 0, il = cellCount * cellCount; i < il; i++ ) {
      if ( cells[i].type === CellType.UNTYPED ) {
        cells[i].type = CellType.INTERIOR;
      }
    }

    return {
      cells: cells,
      width: 1 / scaleX,
      height: 1 / scaleY
    };
  }

  return {
    CellType: CellType,

    config: config,
    convert2d: convert2d
  };
}) ();
