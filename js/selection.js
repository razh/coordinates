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
  }

  function onMouseMove( event ) {
    mousePosition( event );
  }

  function onMouseUp() {
    mouse.down = false;
  }

  return selection;
}) ();
