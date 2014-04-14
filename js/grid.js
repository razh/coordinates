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

    var i, j;
    for ( j = 0; j < this.rows; j++ ) {
      for ( i = 0; i < this.cols; i++ ) {
        this.vertices.push( colWidth  * i );
        this.vertices.push( rowHeight * j );
      }
    }
  };

  return Grid;

}) ();
