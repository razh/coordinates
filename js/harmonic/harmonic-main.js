/*globals Geometry, Selection, Grid, Harmonic*/
(function( window, document, undefined ) {
  'use strict';

  var PI2 = 2 * Math.PI;

  var canvas  = document.getElementById( 'harmonic-canvas' ),
      context = canvas.getContext( '2d' );

  canvas.width = 512;
  canvas.height = 512;

  function onMouseMove() {
    draw( context );
  }

  var polygon = [
    250, 50,
    50, 250,
    200, 450,
    150, 200,
    250, 200,
    450, 400
  ];

  var cellCount = 32;
  Harmonic.config.cellCount = cellCount;

  var aabb, grid;
  function draw( ctx ) {
    ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );
    aabb = Harmonic.dimensions( polygon );

    // Update grid.
    grid = new Grid({
      width: aabb.width,
      height: aabb.height,
      cols: cellCount,
      rows: cellCount
    });

    grid.x = aabb.x;
    grid.y = aabb.y;

    // Draw grid.
    ctx.beginPath();
    grid.draw( ctx );
    ctx.lineWidth = 0.25;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Calculate Harmonic grid data.
    var harmonicData = Harmonic.convert2d( 0, 0, polygon );
    var colWidth = harmonicData.width,
        rowHeight = harmonicData.height;

    ctx.beginPath();

    function drawCellsOfType( n ) {
      var x, y;
      for ( var i = 0, il = harmonicData.cells.length; i < il; i++ ) {
        if ( harmonicData.cells[i].type !== n ) {
          continue;
        }

        x = i % cellCount;
        y = Math.floor( i / cellCount );

        ctx.rect(
          grid.x + x * colWidth,
          grid.y + y * rowHeight,
          colWidth,
          rowHeight
        );
      }
    }

    // Draw boundary cells.
    ctx.beginPath();
    drawCellsOfType( Harmonic.CellType.BOUNDARY );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    // Draw exterior cells.
    ctx.beginPath();
    drawCellsOfType( Harmonic.CellType.EXTERIOR );
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();

    // Draw interior cells.
    ctx.beginPath();
    drawCellsOfType( Harmonic.CellType.INTERIOR );
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fill();

    // Draw polygon.
    ctx.beginPath();
    Geometry.drawPolygon( ctx, polygon );
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw vertices.
    ctx.beginPath();
    Geometry.drawVertices( ctx, polygon, 6 );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    // Draw vertex labels.
    ctx.font = 'italic 16pt Georgia';
    ctx.fillStyle = '#fff';
    Geometry.drawVertexLabels( ctx, polygon, 8 );
  }

  draw( context );
  canvas.addEventListener( 'mousemove', onMouseMove );

  // Initialize selection interaction.
  Selection.setElement( canvas );
  Selection.addHandlers( polygon );

}) ( window, document );
