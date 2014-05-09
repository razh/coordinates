/*globals Geometry, Selection, Grid, Harmonic*/
(function( window, document, undefined ) {
  'use strict';

  var PI2 = 2 * Math.PI;

  function round( value, precision ) {
    return parseFloat( value.toFixed( precision ) );
  }

  var config = {
    values: false,
    vertexIndex: 0
  };

  var inputs = {
    values: document.getElementById( 'draw-values' ),
    vertexIndex: document.getElementById( 'vertex-index' ),
    resolution: document.getElementById( 'resolution' ),
    threshold: document.getElementById( 'threshold' )
  };

  inputs.values.addEventListener( 'change', function() {
    config.values = inputs.values.checked;
    draw( context );
  });

  inputs.vertexIndex.addEventListener( 'input', function() {
    config.vertexIndex = inputs.vertexIndex.value;
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

  var mouse = {
    x: 0,
    y: 0
  };

  // Transformed point.
  var transform = {
    x: 0,
    y: 0
  };

  function onMouseMove( event ) {
    mouse.x = event.pageX - canvas.offsetLeft;
    mouse.y = event.pageY - canvas.offsetTop;

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

  inputs.vertexIndex.max = Math.floor( 0.5 * polygon.length ) - 1;

  Harmonic.config.resolution = 32;
  // Lower threshold to allow for realtime rendering.
  Harmonic.config.threshold = 1e-3;

  function draw( ctx ) {
    ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );

    var resolution = Harmonic.config.resolution;

    // Calculate Harmonic grid data.
    var harmonicData = Harmonic.convert2d( polygon );

    var aabb = harmonicData.aabb,
        cellWidth = harmonicData.width,
        cellHeight = harmonicData.height;

    // Update harmonicGrid.
    var harmonicGrid = new Grid({
      width: aabb.width,
      height: aabb.height,
      cols: resolution,
      rows: resolution
    });

    harmonicGrid.x = aabb.x;
    harmonicGrid.y = aabb.y;

    // Draw harmonicGrid.
    ctx.beginPath();
    harmonicGrid.draw( ctx );
    ctx.lineWidth = 0.25;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    function drawCellsOfType( n ) {
      var x, y;
      for ( var i = 0, il = harmonicData.cells.length; i < il; i++ ) {
        if ( harmonicData.cells[i].type !== n ) {
          continue;
        }

        x = i % resolution;
        y = Math.floor( i / resolution );

        ctx.rect(
          harmonicGrid.x + x * cellWidth,
          harmonicGrid.y + y * cellHeight,
          cellWidth,
          cellHeight
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

        ctx.fillText(
          weight,
          harmonicGrid.x + x * cellWidth,
          harmonicGrid.y + y * cellHeight
        );
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
          harmonicGrid.x + x * cellWidth,
          harmonicGrid.y + y * cellHeight,
          cellWidth,
          cellHeight
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
    drawWeights( config.vertexIndex, 'rgba(0, 255, 0, 0.8)' );

    // Draw weight values.
    if ( config.values ) {
      ctx.font = '8pt monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;

      drawWeightValues( config.vertexIndex, 2 );

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

    transform = Harmonic.interpolate2d( mouse.x - aabb.x, mouse.y - aabb.y, polygon, harmonicData.cells, resolution, cellWidth, cellHeight );

    // Draw mouse point.
    ctx.beginPath();
    ctx.arc( mouse.x, mouse.y, 4, 0, PI2 );
    ctx.fillStyle = '#3f4';
    ctx.fill();

    // Draw transformed point.
    ctx.beginPath();
    ctx.arc( transform.x, transform.y, 4, 0, PI2 );
    ctx.fillStyle = '#f43';
    ctx.fill();
  }

  draw( context );
  canvas.addEventListener( 'mousemove', onMouseMove );

  // Initialize selection interaction.
  Selection.setElement( canvas );
  Selection.addHandlers( polygon );

}) ( window, document );
