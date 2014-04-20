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

  function scanLineFill( grid, count, y ) {
    var exterior = grid[ y * count ].type === CellType.UNTYPED;
    var i = 0;
    var start = 0;
    var end;
    var switched = 0;

    while ( start < count ) {
      while ( grid[ y * count + start ].type === CellType.BOUNDARY ) {
        start++;
        // Flip by number of Bresenham edge crossings.
        exterior ^= grid[ y * count + start ].value;
      }

      if ( start >= count ) {
        continue;
      }

      end = start + 1;
      // Find next boundary cell or the row end.
      while ( end < count && grid[ y * count + end ].type !== CellType.BOUNDARY ) {
        end++;
      }

      // If no more boundary cells, then we're exterior.
      if ( end >= count ) {
        exterior = true;
      }

      for ( i = start; i < end; i++ ) {
        grid[ y * count + i ].type = exterior ? CellType.EXTERIOR : CellType.INTERIOR;
      }

      exterior = !exterior;
      start = end;
      switched++;
    }

    console.log( switched );
  }

  /**
   * From:
   * http://lodev.org/cgtutor/floodfill.html
   */
  function _scanlineFill( grid, width, height, x, y ) {
    var stack = [
      [ x, y ]
    ];

    grid[ y * width + x ].type = CellType.EXTERIOR;

    var point;
    var yi;
    var left, right;
    var leftIndex, rightIndex;
    while ( stack.length ) {
      point = stack.pop();
      x = point.x;
      y = point.y;
      yi = y;

      // Find left extent.
      while ( yi >= 0 && grid[ yi * width + x ].type === CellType.UNTYPED ) {
        yi--;
      }

      yi++;

      left = false;
      right = false;
      while ( yi < height && grid[ yi * width + x ].type === CellType.UNTYPED ) {
        grid[ yi * width + x ].type = CellType.EXTERIOR;

        // Left.
        leftIndex = yi * width + ( x - 1 );
        if ( !left && x > 0 && grid[ leftIndex ].type === CellType.UNTYPED ) {
          stack.push( [ x - 1, yi ] );

        } else if ( left && x > 0 && grid[ leftIndex ].type !== CellType.UNTYPED ) {
          left = false;
        }

        // Right.
        rightIndex = yi * width + ( x + 1 );
        if ( !right && x < width - 1 && grid[ rightIndex ].type === CellType.UNTYPED ) {
          stack.push( [ x + 1, yi ] );
          right = true;
        } else if ( right && x < width - 1 && grid[ rightIndex ].type !== CellType.UNTYPED ) {
          right = false;
        }

        yi++;
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

    // for ( i = 0; i < cellCount; i++ ) {
    //   scanLineFill( cells, cellCount, i );
    // }

    /*
    // Flood fill to determine exterior cells.
    floodFill( cells, cellCount, 0, 0, 1, 1 );
    floodFill( cells, cellCount, 0, cellCount - 1, 1, -1 );
    floodFill( cells, cellCount, cellCount - 1, 0, -1, 1 );
    floodFill( cells, cellCount, cellCount - 1, cellCount - 1, -1, -1 );

    */
    //  HACK: Flood fill from edges.
    /**
     * Starting from each corner, we move clockwise amd flood-fill from
     * UNTYPED cells.
     *
     * We end at cellCount - 1 to avoid re-flood-filling starting corners.
     */
    var j;
    var lastIndex = cellCount - 1;
    for ( i = 0; i < lastIndex; i++ ) {
      // Top left to top right.
      if ( cells[i].type === CellType.UNTYPED ) {
        _scanlineFill( cells, cellCount, cellCount, i, 0 );
      }

      // Top right to bottom right.
      if ( cells[ i * cellCount + lastIndex ].type === CellType.UNTYPED ) {
        _scanlineFill( cells, cellCount, cellCount, lastIndex, i );
      }

      j = cellCount - i - 1;
      // Bottom right to bottom left.
      if ( cells[ lastIndex * cellCount + j ].type === CellType.UNTYPED ) {
        _scanlineFill( cells, cellCount, cellCount, j, lastIndex );
      }

      // Bottom left to top left.
      if ( cells[ j * cellCount ].type === CellType.UNTYPED ) {
        _scanlineFill( cells, cellCount, cellCount, 0, j );
      }
    }

    // Mark all interior cells.
    // for ( i = 0, il = cellCount * cellCount; i < il; i++ ) {
    //   if ( cells[i].type === CellType.UNTYPED ) {
    //     cells[i].type = CellType.INTERIOR;
    //   }
    // }

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
