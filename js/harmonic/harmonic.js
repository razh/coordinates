/*jshint bitwise: false*/
/*exported Harmonic*/
var Harmonic = (function() {
  'use strict';

  var config = {
    // Cell count on a side.
    resolution: Math.pow( 2, 6 ),
    // Laplacian smoothing termination criterion threshold.
    threshold: 1e-5
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
   * Find the parameter of the point (x, y) as projected on the line segment
   * form by (x0, y0) - (x1, y1).
   */
  function closestPointOnLineParameter( x, y, x0, y0, x1, y1 ) {
    var dx = x1 - x0,
        dy = y1 - y0;

    // Check for line degeneracy.
    if ( !dx && !dy ) {
      return 0;
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
  function bresenham( grid, width, x0, y0, x1, y1, i0, i1, vertexCount ) {
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
    var i;
    while ( true ) {
      cell = grid[ y * width + x ];
      if ( !cell ) {
        break;
      }

      cell.type = CellType.BOUNDARY;
      // Populate boundary cell weights if empty.
      if ( !cell.weights.length ) {
        for ( i = 0; i < vertexCount; i++ ) {
          cell.weights.push(0);
        }
      }

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

  /**
   * Laplacian smooth.
   */
  function smooth( cells, width, vertexCount ) {
    // Empty temporary array to prevent reading undefined arrays.
    var empty = [];

    // Determine the total number of interior cells.
    var interiorCount = 0;
    var count = cells.length;
    var i;
    for ( i = 0; i < count; i++ ) {
      if ( cells[i].type === CellType.INTERIOR ) {
        interiorCount++;
      }
    }

    if ( !interiorCount ) {
      return;
    }

    var sum, sumDifference;
    var meanDifference = Number.POSITIVE_INFINITY;
    var threshold = config.threshold;
    var left, right, top, bottom;
    var cell;
    var x, y;
    var j;
    // Smooth until the mean difference is less than threshold.
    while ( meanDifference > threshold ) {
      sumDifference = 0;

      // For interior cells, determine 4-connected neighbors and smooth.
      for ( i = 0; i < count; i++ ) {
        cell = cells[i];
        cell.previousWeights = cell.weights.slice();

        if ( cell.type !== CellType.INTERIOR ) {
          continue;
        }

        x = i % width;
        y = Math.floor( i / width );

        // Left.
        left = cells[ y * width + ( x - 1 ) ];
        left = left ? left.previousWeights : empty;
        // Right.
        right = cells[ y * width + ( x + 1 ) ];
        right = right ? right.previousWeights : empty;
        // Top.
        top = cells[ ( y - 1 ) * width + x ];
        top = top ? top.previousWeights : empty;
        // Bottom.
        bottom = cells[ ( y + 1 ) * width + x ];
        bottom = bottom ? bottom.previousWeights : empty;

        // Smooth all weights.
        for ( j = 0; j < vertexCount; j++ ) {
          sum =  left[j]   || 0;
          sum += bottom[j] || 0;
          sum += top[j]    || 0;
          sum += right[j]  || 0;
          // Normalize.
          sum *= 0.25;

          cell.weights[j] = sum;

          sumDifference += Math.abs( sum - cell.previousWeights[j] );
        }
      }

      meanDifference = sumDifference / ( interiorCount * vertexCount );
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

    var resolution = config.resolution;

    var scaleX = resolution / aabb.width,
        scaleY = resolution / aabb.height;

    var cells = [];

    var i, il;
    for ( i = 0, il = resolution * resolution; i < il; i++ ) {
      cells.push({
        type: CellType.UNTYPED,
        previousWeights: [],
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
      x0 = Math.floor( clamp( ( x0 - xmin ) * scaleX, 0, resolution - 1 ) );
      y0 = Math.floor( clamp( ( y0 - ymin ) * scaleY, 0, resolution - 1 ) );
      x1 = Math.floor( clamp( ( x1 - xmin ) * scaleX, 0, resolution - 1 ) );
      y1 = Math.floor( clamp( ( y1 - ymin ) * scaleY, 0, resolution - 1 ) );

      // Draw boundary line and initialize weights array of boundary cells.
      bresenham(
        cells, resolution,
        x0, y0, x1, y1,
        i, ( i + 1 ) % vertexCount,
        vertexCount
      );
    }

    /**
     * Flood fill from edges.
     *
     * Starting from each corner, we move clockwise amd flood-fill from
     * UNTYPED cells.
     *
     * We end at resolution - 1 to avoid re-flood-filling starting corners.
     */
    var j;
    var lastIndex = resolution - 1;
    for ( i = 0; i < lastIndex; i++ ) {
      // Top left to top right.
      if ( cells[i].type === CellType.UNTYPED ) {
        scanLineFill( cells, resolution, resolution, i, 0 );
      }

      // Top right to bottom right.
      if ( cells[ i * resolution + lastIndex ].type === CellType.UNTYPED ) {
        scanLineFill( cells, resolution, resolution, lastIndex, i );
      }

      j = resolution - i - 1;
      // Bottom right to bottom left.
      if ( cells[ lastIndex * resolution + j ].type === CellType.UNTYPED ) {
        scanLineFill( cells, resolution, resolution, j, lastIndex );
      }

      // Bottom left to top left.
      if ( cells[ j * resolution ].type === CellType.UNTYPED ) {
        scanLineFill( cells, resolution, resolution, 0, j );
      }
    }

    // Mark all interior cells.
    var weights = [];
    for ( i = 0; i < vertexCount; i++ ) {
      weights.push(0);
    }

    var cell;
    for ( i = 0, il = cells.length; i < il; i++ ) {
      cell = cells[i];
      if ( cell.type === CellType.UNTYPED ) {
        cell.type = CellType.INTERIOR;
        cell.previousWeights = weights.slice();
        cell.weights = weights.slice();
      }
    }

    smooth( cells, resolution, vertexCount );

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
