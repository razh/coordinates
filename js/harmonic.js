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
    var aabb = dimensions( vertices );

    var cellCount = config.cellCount;

    var rowWidth  = aabb.width  / cellCount,
        colHeight = aabb.height / cellCount;

    var cells = new Array( cellCount * cellCount );

    var i, j;
    for ( i = 0; i < cellCount; i++ ) {
      for ( j = 0; j < cellCount; j++ ) {
        cells.push({
          type: CellType.UNTYPED
        });
      }
    }
  }

  return {
    convert2d: convert2d
  };
}) ();
