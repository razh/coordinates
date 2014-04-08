/*exported Polygon*/
var Polygon = (function() {
  'use strict';

  function Polygon() {
    this.x = 0;
    this.y = 0;

    this.angle = 0;

    this.scaleX = 1;
    this.scaleY = 1;

    this.vertices = [];
  }

  Polygon.prototype.draw = function( ctx ) {
    ctx.save();

    this.applyTransform( ctx );
    this.drawPath( ctx );

    ctx.restore();
  };

  Polygon.prototype.drawPath = function( ctx ) {
    var vertices = this.vertices;
    if ( vertices.length < 2 ) {
      return;
    }

    ctx.moveTo( vertices[0], vertices[1] );
    for ( var i = 0, il = vertices.length; i < il; i++ ) {
      ctx.lineTo( vertices[ 2 * i ], vertices[2 * i + 1 ] );
    }
  };

  Polygon.prototype.applyTransform = function( ctx ) {
    var x = this.x,
        y = this.y;

    var angle = this.angle;

    var scaleX = this.scaleX,
        scaleY = this.scaleY;

    // Apply non-identity transforms.
    if ( x || y ) {
      ctx.translate( x, y );
    }

    if ( angle ) {
      ctx.rotate( -angle );
    }

    if ( scaleX !== 1 || scaleY !== 1 ) {
      ctx.scale( scaleX, scaleY );
    }
  };

  Polygon.prototype.toLocal = function( x, y ) {
    x -= this.x;
    y -= this.y;

    var angle = this.angle;
    var cos, sin;
    var rx, ry;

    if ( angle ) {
      cos = Math.cos( angle );
      sin = Math.sin( angle );

      rx = cos * x - sin * y;
      ry = sin * x + cos * y;

      x = rx;
      y = ry;
    }

    return {
      x: x / this.scaleX,
      y: y / this.scaleY
    };
  };

  Polygon.prototype.toWorld = function( x, y ) {
    x *= this.scaleX;
    y *= this.scaleY;

    var angle = this.angle;
    var cos, sin;
    var rx, ry;

    if ( angle ) {
      cos = Math.cos( -angle );
      sin = Math.sin( -angle );

      rx = cos * x - sin * y;
      ry = sin * x + cos * y;

      x = rx;
      y = ry;
    }

    return {
      x: x + this.x,
      y: y + this.y
    };
  };

  return Polygon;
}) ();
