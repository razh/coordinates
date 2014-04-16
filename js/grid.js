/*globals Polygon*/
/*exported Grid*/
var Grid = (function() {
  'use strict';

  function Grid( options ) {
    Polygon.call( this );

    options = options || {};

    this.width  = options.width  || 1;
    this.height = options.height || 1;

    this.cols = options.cols || 1;
    this.rows = options.rows || 1;

    this.generate();
  }

  Grid.prototype = Object.create( Polygon.prototype );
  Grid.prototype.constructor = Grid;

  Grid.prototype.generate = function() {
    var colWidth  = this.width  / this.cols,
        rowHeight = this.height / this.rows;

    var x, y;
    for ( y = 0; y < this.rows; y++ ) {
      for ( x = 0; x < this.cols; x++ ) {
        this.vertices.push( colWidth  * x );
        this.vertices.push( rowHeight * y );
      }
    }
  };

  Grid.prototype.drawPath = function( ctx ) {
    var colWidth  = this.width  / this.cols,
        rowHeight = this.height / this.rows;

    var vertexCount = 0.5 * this.vertices.length;

    var x, y;
    for ( var i = 0; i < vertexCount; i++ ) {
      x = i % vertexCount;
      y = Math.floor( i / vertexCount );

      ctx.rect( x * colWidth, y * rowHeight, colWidth, rowHeight );
    }
  };

  return Grid;

}) ();
