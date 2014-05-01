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

  function clamp( value, min, max ) {
    return Math.min( Math.max( value, min ), max );
  }

  /**
   * Find the parameter of the point (x, y) as projected on the line segment
   * form by (x0, y0) - (x1, y1).
   */
  function closestPointOnLineParameter( x, y, x0, y0, x1, y1 ) {
    var dx = x1 - x0,
        dy = y1 - y0;

    // Check for line degeneracy.
    if ( !dx && !dy ) {
      return null;
    }

    var lengthSquared = dx * dx + dy * dy;

    return ( ( x - x0 ) * ( x1 - x0 ) + ( y - y0 ) * ( y1 - y0 ) ) / lengthSquared;
  }

  /**
   * Marks all cells which lie on the Bresenham line rasterization as
   * BOUNDARY cells.
   *
   * Scan-converts the univariate linear B-spline basis function
   * ("hat function" basis) for cell vertex weights.
   *   - The basis function is linearly interpolated from 1 at the primary
   *     vertex to 0 at the previous/next vertices:
   *
   *                                o              1
   *                              /   \
   *                            /       \
   *                     -----o           o-----   0
   *     vertex index:   (i - 1)    i    (i + 1)
   *
   * Vertices are expected to be normalized to grid units. That is, a grid
   * cell will have world dimensions equal to column width and row height, but
   * local dimensions of 1 by 1.
   *
   * i0 and i1 are vertex weight indices.
   *
   * Assumes a square grid.
   */
  function bresenham( grid, count, x0, y0, x1, y1, i0, i1 ) {
    var x = x0,
        y = y0;

    var dx = Math.abs( x1 - x0 ),
        dy = Math.abs( y1 - y0 );

    // Steps.
    var sx = x0 < x1 ? 1 : -1,
        sy = y0 < y1 ? 1 : -1;

    var error = dx - dy;

    var error2;
    var cell, parameter;
    while ( true ) {
      cell = grid[ y * count + x ];
      cell.type = CellType.BOUNDARY;

      // Calculate weight.
      parameter = closestPointOnLineParameter( x, y, x0, y0, x1, y1 );
      cell.weights[ i0 ] = 1 - parameter;
      cell.weights[ i1 ] = parameter;

      if ( x === x1 && y === y1 ) {
        return;
      }

      error2 = 2 * error;
      if ( error2 > -dy ) {
        error -= dy;
        x += sx;
      }

      if ( error2 < dx ) {
        error += dx;
        y += sy;
      }
    }
  }

  /**
   * Flood fill to mark all EXTERIOR cells.
   *
   * Adapted from:
   * http://lodev.org/cgtutor/floodfill.html
   */
  function scanLineFill( grid, width, height, x, y ) {
    var stack = [
      [ x, y ]
    ];

    var point;
    var yi;
    var left, right;
    var leftIndex, rightIndex;
    while ( stack.length ) {
      point = stack.pop();
      x = point[0];
      y = point[1];
      yi = y;

      // Find top extent.
      while ( yi >= 0 && grid[ yi * width + x ].type === CellType.UNTYPED ) {
        yi--;
      }

      yi++;

      left = false;
      right = false;
      // Fill downwards.
      while ( yi < height && grid[ yi * width + x ].type === CellType.UNTYPED ) {
        grid[ yi * width + x ].type = CellType.EXTERIOR;

        // Check left/right neighbors for empty cells.
        // Left.
        if ( x > 0 ) {
          leftIndex = yi * width + ( x - 1 );
          if ( !left && grid[ leftIndex ].type === CellType.UNTYPED ) {
            // Push segemnt start.
            stack.push( [ x - 1, yi ] );
            left = true;
          } else if ( left && grid[ leftIndex ].type !== CellType.UNTYPED ) {
            // End segment.
            left = false;
          }
        }

        // Right.
        if ( x < width - 1 ) {
          rightIndex = yi * width + ( x + 1 );
          if ( !right && grid[ rightIndex ].type === CellType.UNTYPED ) {
            // Push segemnt start.
            stack.push( [ x + 1, yi ] );
            right = true;
          } else if ( right && grid[ rightIndex ].type !== CellType.UNTYPED ) {
            // End segment.
            right = false;
          }
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
        type: CellType.UNTYPED,
        weights: []
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

      bresenham( cells, cellCount, x0, y0, x1, y1, i, ( i + 1 ) % vertexCount );
    }

    /**
     * Flood fill from edges.
     *
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
        scanLineFill( cells, cellCount, cellCount, i, 0 );
      }

      // Top right to bottom right.
      if ( cells[ i * cellCount + lastIndex ].type === CellType.UNTYPED ) {
        scanLineFill( cells, cellCount, cellCount, lastIndex, i );
      }

      j = cellCount - i - 1;
      // Bottom right to bottom left.
      if ( cells[ lastIndex * cellCount + j ].type === CellType.UNTYPED ) {
        scanLineFill( cells, cellCount, cellCount, j, lastIndex );
      }

      // Bottom left to top left.
      if ( cells[ j * cellCount ].type === CellType.UNTYPED ) {
        scanLineFill( cells, cellCount, cellCount, 0, j );
      }
    }

    // Mark all interior cells.
    var weights = [];
    for ( i = 0; i < vertexCount; i++ ) {
      weights.push(0);
    }

    for ( i = 0, il = cellCount * cellCount; i < il; i++ ) {
      if ( cells[i].type === CellType.UNTYPED ) {
        cells[i].type = CellType.INTERIOR;
        cells[i].weights = weights.slice();
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
    dimensions: dimensions,

    config: config,
    convert2d: convert2d
  };
}) ();
