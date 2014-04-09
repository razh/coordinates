/*exported Barycentric*/
var Barycentric = (function() {
  'use strict';

  function convert2d( x, y, x0, y0, x1, y1, x2, y2 ) {
    var denom = ( y1 - y2 ) * ( x0 - x2 ) + ( x2 - x1 ) * ( y0 - y2 );

    var u = ( ( y1 - y2 ) * ( x - x2 ) + ( x2 - x1 ) * ( y - y2 ) ) / denom,
        v = ( ( y2 - y0 ) * ( x - x2 ) + ( x0 - x2 ) * ( y - y2 ) ) / denom;

    return {
      u: u,
      v: v,
      w: 1 - u - v
    };
  }

  /**
   * Converts a point to barycentric coordinates.
   *
   * Converted from Christer Ericson's Real-Time Collision Detection:
   *
   *   // Compute barycentric coordinates (u, v, w) for
   *   // point p with respect to triangle (a, b, c)
   *   void Barycentric(Point a, Point b, Point c, Point p, float &u, float &v, float &w)
   *   {
   *     Vector v0 = b - a, v1 = c - a, v2 = p - a;
   *     float d00 = Dot(v0, v0);
   *     float d01 = Dot(v0, v1);
   *     float d11 = Dot(v1, v1);
   *     float d20 = Dot(v2, v0);
   *     float d21 = Dot(v2, v1);
   *     float denom = d00 * d11 - d01 * d01;
   *     v = (d11 * d20 - d01 * d21) / denom;
   *     w = (d00 * d21 - d01 * d20) / denom;
   *     u = 1.0f - v - w;
   *   }
   */
  function convert3d( x, y, z, x0, y0, z0, x1, y1, z1, x2, y2, z2 ) {
    var v0x = x1 - x0,
        v0y = y1 - y0,
        v0z = z1 - z0;

    var v1x = x2 - x0,
        v1y = y2 - y0,
        v1z = z2 - z0;

    var v2x = x - x0,
        v2y = y - y0,
        v2z = z - z0;

    var d00 = ( v0x * v0x ) + ( v0y * v0y ) + ( v0z * v0z ),
        d01 = ( v0x * v1x ) + ( v0y * v1y ) + ( v0z * v1z ),
        d11 = ( v1x * v1x ) + ( v1y * v1y ) + ( v1z * v1z ),
        d20 = ( v2x * v0x ) + ( v2y * v0y ) + ( v2z * v0z ),
        d21 = ( v2x * v1x ) + ( v2y * v1y ) + ( v2z * v1z );

    var denom = d00 * d11 - d01 * d01;

    var v = ( d11 * d20 - d01 * d21 ) / denom,
        w = ( d00 * d21 - d01 * d20 ) / denom,
        u = 1 - v - w;

    return {
      u: u,
      v: v,
      w: w
    };
  }

  /**
   * Interpolate barycentric coordinates along a triangle.
   */
  function interpolate2d( u, v, w, x0, y0, x1, y1, x2, y2 ) {
    return {
      x: u * x0 + v * x1 + w * x2,
      y: u * y0 + v * y1 + w * y2
    };
  }

  function interpolate3d( u, v, w, x0, y0, z0, x1, y1, z1, x2, y2, z2 ) {
    return {
      x: u * x0 + v * x1 + w * x2,
      y: u * y0 + v * y1 + w * y2,
      z: u * z0 + v * z1 + w * z2
    };
  }

  return {
    convert2d: convert2d,
    convert3d: convert3d,
    interpolate2d: interpolate2d,
    interpolate3d: interpolate3d
  };
}) ();
