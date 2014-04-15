/*globals Geometry, Handler*/
/*exported Selection*/
var Selection = (function() {
  'use strict';

  var selection = {
    // Element to attach event listeners.
    el: null,
    // Array of objects to hit test.
    objects: [],
    // Array of selected objects.
    array: [],
    // Offsets of selected objects.
    offsets: [],
    // Radius for valid hits.
    radius: 8,
  };

  selection.setElement = function( el ) {
    if ( !el ) {
      return;
    }

    // Remove event listeners from previous element.
    if ( selection.el ) {
      selection.el.removeEventListener( 'mousedown', onMouseDown );
      selection.el.removeEventListener( 'mousemove', onMouseMove );
      selection.el.removeEventListener( 'mouseup', onMouseUp );
    }

    selection.el = el;
    el.addEventListener( 'mousedown', onMouseDown );
    el.addEventListener( 'mousemove', onMouseMove );
    el.addEventListener( 'mouseup', onMouseUp );
  };

  selection.addHandlers = function( vertices ) {
    for ( var i = 0, il = 0.5 * vertices.length; i < il; i++ ) {
      selection.objects.push( new Handler( vertices, i ) );
    }
  };

  var mouse = {
    x: 0,
    y: 0,

    down: false
  };

  function mousePosition( event ) {
    if ( !selection.el ) {
      return;
    }

    mouse.x = event.pageX - selection.el.offsetLeft;
    mouse.y = event.pageY - selection.el.offsetTop;
  }

  function onMouseDown( event ) {
    mousePosition( event );
    mouse.down = true;

    var radius = selection.radius;
    var radiusSquared = radius * radius;
    var object;
    var distanceSquared;
    for ( var i = 0, il = selection.objects.length; i < il; i++ ) {
      object = selection.objects[i];

      distanceSquared = Geometry.distanceSquared(
        mouse.x, mouse.y,
        object.x, object.y
      );

      if ( distanceSquared < radiusSquared ) {
        selection.array.push( object );
        selection.offsets.push({
          x: object.x - mouse.x,
          y: object.y - mouse.y
        });

        return;
      }
    }
  }

  function onMouseMove( event ) {
    mousePosition( event );

    selection.objects.forEach(function( object, index ) {
      object.x = mouse.x + selection.offsets[ index ].x;
      object.y = mouse.y + selection.offsets[ index ].y;
    });
  }

  function onMouseUp() {
    mouse.down = false;

    selection.array = [];
    selection.offsets = [];
  }

  return selection;
}) ();
