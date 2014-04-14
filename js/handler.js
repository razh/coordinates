/*exported Handler*/
var Handler = (function () {
  'use strict';

  /**
   * Set/get position of a vertex located at index in the vertices array.
   */
  function Handler( vertices, index ) {
    this.vertices = vertices;
    this.index = index;
  }

  Object.defineProperty( Handler.prototype, 'x', {
    set: function( x ) {
      this.vertices[ 2 * this.index ] = x;
    },

    get: function() {
      return this.vertices[ 2 * this.index ];
    }
  });

  Object.defineProperty( Handler.prototype, 'y', {
    set: function( y ) {
      this.vertices[ 2 * this.index + 1 ] = y;
    },

    get: function() {
      return this.vertices[ 2 * this.index + 1 ];
    }
  });

  Object.defineProperty( Handler.prototype, 'position', {
    set: function( position ) {
      this.x = position.x;
      this.y = position.y;
    },

    get: function() {
      return {
        x: this.x,
        y: this.y
      };
    }
  });

  return Handler;

}) ();
