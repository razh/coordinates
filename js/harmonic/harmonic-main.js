/*globals Geometry, Selection, Grid, Harmonic*/
(function( window, document, undefined ) {
  'use strict';

  var PI2 = 2 * Math.PI;

  function round( value, precision ) {
    return parseFloat( value.toFixed( precision ) );
  }

  var config = {
    values: false
  };

  var inputs = {
    values: document.getElementById( 'draw-values' ),
    resolution: document.getElementById( 'resolution' ),
    threshold: document.getElementById( 'threshold' )
  };

  inputs.values.addEventListener( 'change', function() {
    config.values = inputs.values.checked;
    draw( context );
  });

  inputs.resolution.addEventListener( 'input', function() {
    Harmonic.config.resolution = inputs.resolution.value;
    draw( context );
  });

  inputs.threshold.addEventListener( 'input', function() {
    Harmonic.config.threshold = Math.pow( 10, inputs.threshold.value );
    draw( context );
  });

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

  Harmonic.config.resolution = 32;
  // Lower threshold to allow for realtime rendering.
  Harmonic.config.threshold = 1e-3;

  function draw( ctx ) {
    ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );

    var resolution = Harmonic.config.resolution;
    var aabb = Harmonic.dimensions( polygon );

    // Update grid.
    var grid = new Grid({
      width: aabb.width,
      height: aabb.height,
      cols: resolution,
      rows: resolution
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

        x = i % resolution;
        y = Math.floor( i / resolution );

        ctx.rect(
          grid.x + x * colWidth,
          grid.y + y * rowHeight,
          colWidth,
          rowHeight
        );
      }
    }

    /**
     * Draws the numeric weights associated with the vertex at index.
     */
    function drawWeightValues( index, precision ) {
      precision = precision || 0;

      var x, y;
      var weight;
      for ( var i = 0, il = harmonicData.cells.length; i < il; i++ ) {
        weight = harmonicData.cells[i].weights[ index ];
        if ( weight === void 0 ) {
          continue;
        }

        x = i % resolution;
        y = Math.floor( i / resolution );
        weight = round( weight, precision );

        ctx.fillText( weight, grid.x + x * colWidth, grid.y + y * rowHeight );
      }
    }

    /**
     * Draws cell weights in color for the vertex at index. Uses the cell's
     * weight value as the global alpha.
     */
    function drawWeights( index, color ) {
      ctx.fillStyle = color;

      var x, y;
      var weight;
      for ( var i = 0, il = harmonicData.cells.length; i < il; i++ ) {
        weight = harmonicData.cells[i].weights[ index ];
        if ( !weight ) {
          continue;
        }

        x = i % resolution;
        y = Math.floor( i / resolution );
        ctx.globalAlpha = weight;

        ctx.fillRect(
          grid.x + x * colWidth,
          grid.y + y * rowHeight,
          colWidth,
          rowHeight
        );

        ctx.globalAlpha = 1;
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
    ctx.fillStyle = 'rgba(0, 0, 64, 0.5)';
    ctx.fill();

    // Draw weights as color.
    drawWeights( 0, 'rgba(0, 255, 0, 0.8)' );

    // Draw weight values.
    if ( config.values ) {
      ctx.font = '8pt monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;

      drawWeightValues( 0, 2 );

      ctx.shadowBlur = 0;
    }

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
