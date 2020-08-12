/*
Program       esci-d-picture.js
Author        Gordon Moore
Date          11 August 2020
Description   The JavaScript code for esci-d-picture
Licence       GNU General Public LIcence Version 3, 29 June 2007
*/

// #region Version history
/*
0.0.1   Initial version


*/
//#endregion 

let version = '0.0.1';

'use strict';
$(function() {
  console.log('jQuery here!');  //just to make sure everything is working

  //#region for variable definitions (just allows code folding)
  let tooltipson              = false;                                        //toggle the tooltips on or off

  const pdfdisplay            = document.querySelector('#pdfdisplay');        //display of pdf area

  let realHeight              = 100;                                          //the real world height for the pdf display area
  let margin                  = {top: 0, right: 10, bottom: 0, left: 70};     //margins for pdf display area
  let width;                                                                  //the true width of the pdf display area in pixels
  let heightP;   
  let rwidth;                                                                 //the width returned by resize
  let rheight;                                                                //the height returned by resize
  let xt, xb, y;                                                              //scale functions

  let showtopaxis             = false;
  let showbottomaxis          = false;

  let left;
  let right;
  let distWidth               = 4;                                            //number of sds each side of x bar

  let svgTopAxis;                                                             //svg reference to the top axis
  let svgBottomAxis;                                                          //svg reference to the bottom axis
  let svgP;   
                                                                              //the svg reference to pdfdisplay
  let controlpdf              = [];                                           //the array holding the normal distribution
  let experimentalpdf         = [];

  let xbarcontrol             = 100;
  let xbarexperimental        = 110;
  let sdcontrol               = 15;
  let sdexperimental          = 15;                                           //the population mean, standard deviation and degrees of freedom
  let h;

  const $pdfdisplay = $('#pdfdisplay');

  const $dslider              = $('#dslider');                                //reference to slider
  let cohensd;


  //api for getting width, height of element - only gets element, not entire DOM
  // https://www.digitalocean.com/community/tutorials/js-resize-observer
  const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
      rwidth = entry.contentRect.width;
      //rHeight = entry.contentRect.height;  //doesn't work
      rheight = $('#pdfdisplay').outerHeight(true);
    });
  });

  //#endregion

  //breadcrumbs
  $('#homecrumb').on('click', function() {
    window.location.href = "https://www.esci.thenewstatistics.com/";
  })

  initialise();

  function initialise() {

    setTooltips();

    //get initial values for height/width
    rwidth  = $('#pdfdisplay').outerWidth(true);
    rheight = $('#pdfdisplay').outerHeight(true);

    //these are fixed so do I need to be responsive?
    heighttopaxis    = $('#topaxis').outerHeight(true);
    heightbottomaxis = $('#bottomaxis').outerHeight(true);

    d3.selectAll('svg > *').remove();  //remove all elements under svgP
    $('svg').remove();                 //remove the all svg elements from the DOM

    //axes
    svgTopAxis    = d3.select('#topaxis').append('svg').attr('width', '100%').attr('height', '100%');
    svgBottomAxis = d3.select('#bottomaxis').append('svg').attr('width', '100%').attr('height', '100%');

    //pdf display
    svgP = d3.select('#pdfdisplay').append('svg').attr('width', '100%').attr('height', '100%');

    setupdSlider();

    resize();

    clear();

  }

  function setupdSlider() {
    //jQueryUI slider
    $dslider.slider({
      animate: 'fast',
      min: 0,
      max: 2,
      range: false,
      value: 0,
      step: 0.01,

      slide: function(e, ui) {
        cohensd = ui.value;
      },

      change: function( event, ui ) {
      },

      stop: function( event, ui ) {
      }
    });

    //jQuery-ui-Slider-Pips
    $dslider.slider()
      .slider('pips', {
        first: 'label',
        pips: true,
        last: 'label',
        rest: 'label',
        step: 20.0001,
      })
      .slider('float', {
        // handle: true,
        // pips: false
      })
  }

  function resize() {
    //have to watch out as the width and height do not always seem precise to pixels
    //browsers apparently do not expose true element width, height.
    //also have to think about box model. outerwidth(true) gets full width, not sure resizeObserver does.
    resizeObserver.observe(pdfdisplay);  //note doesn't get true outer width, height

    width   = rwidth - margin.left - margin.right;  
    heightP = rheight - margin.top - margin.bottom;

    clear();
  }

  //set everything to a default state.
  function clear() {
    setupAxes();  //removes and resets axes

    createControl();
    createExperimental();

    //draw labels on displaypdf
    //because this style matches the distributions style more than one after the other.
    svgP.selectAll('.pdflabels').remove();

    svgP.append('line').attr('class', 'pdflabels').attr('x1', xb(40)).attr('y1', y(95)).attr('x2', xb(48)).attr('y2', y(95)).attr('stroke', 'blue').attr('stroke-width', 4).attr('fill', 'none');
    svgP.append('text').text('Control').attr('class', 'pdflabels').attr('x', xb(50)).attr('y', y(94)).attr('text-anchor', 'start').attr('fill', 'blue').style('font-size', '1.7rem');
    svgP.append('line').attr('class', 'pdflabels').attr('x1', xb(40)).attr('y1', y(92)).attr('x2', xb(48)).attr('y2', y(92)).attr('stroke', 'red').attr('stroke-width', 4).attr('fill', 'none');
    svgP.append('text').text('Experimental').attr('class', 'pdflabels').attr('x', xb(50)).attr('y', y(91)).attr('text-anchor', 'start').attr('fill', 'red').style('font-size', '1.7rem');


    drawControlPDF();
    drawExperimentalPDF();

    //#region TESTING -------------------------------------------------------------------

    //#endregion
  }

  /*-------------------------------------------Set up axes---------------------------------------------*/


  function setupAxes() {
    //the height is 0 - 100 in real world coords   I'm not sure resize is working for rheight
    heightP = $('#pdfdisplay').outerHeight(true) - margin.top - margin.bottom;
    y = d3.scaleLinear().domain([0, realHeight]).range([heightP, 0]);
  
    // showtopaxis = false;
    showbottomaxis = true;
    //setTopAxis();
    setBottomAxis();
  }
  
  // function setTopAxis() {
  //   //clear axes
  //   d3.selectAll('.topaxis').remove();
  //   d3.selectAll('.topaxisminorticks').remove();
  //   d3.selectAll('.topaxistext').remove();
  //   d3.selectAll('.topaxisunits').remove();


  //   width   = rwidth - margin.left - margin.right;  
    
  //   left  = xbarcontrol-distWidth*sdcontrol;
  //   right = xbarcontrol+distWidth*sdcontrol;

  //   xt = d3.scaleLinear().domain([left, right]).range([margin.left-2, width+4]);
    
  //   if (showtopaxis) {
  //     //top horizontal axis
  //     let xAxisA = d3.axisTop(xt).tickSizeOuter(0);  //tickSizeOuter gets rid of the start and end ticks
  //     svgTopAxis.append('g').attr('class', 'topaxis').style("font", "1.8rem sans-serif").attr( 'transform', 'translate(0, 42)' ).call(xAxisA);

  //     //add some text labels
  //     svgTopAxis.append('text').text('X').style('font-style', 'italic').attr('class', 'topaxistext').attr('x', width/2 - 20).attr('y', 16).attr('text-anchor', 'start').attr('fill', 'black');
  //     svgTopAxis.append('text').text(units).attr('class', 'topaxisunits').attr('x', width/2 - 70).attr('y', 70).attr('text-anchor', 'start').attr('fill', 'black');

  //     //add additional ticks
  //     //the minor ticks
  //     let interval = d3.ticks(left-sigma, right+sigma, 10);  //gets an array of where it is putting tick marks

  //     let minortick;
  //     let minortickmark;
  //     for (let i=0; i < interval.length; i += 1) {
  //       minortick = (interval[i] - interval[i-1]) / 10;
  //       for (let ticks = 1; ticks <= 10; ticks += 1) {
  //         minortickmark = interval[i-1] + (minortick * ticks);
  //         if (minortickmark > left && minortickmark < right) svgTopAxis.append('line').attr('class', 'topaxisminorticks').attr('x1', xt(minortickmark)).attr('y1', 40).attr('x2', xt(minortickmark) ).attr('y2', 35).attr('stroke', 'black').attr('stroke-width', 1);
  //       }
  //     }

  //     //make larger middle tick
  //     let middle;
  //     for (let i = 0; i < interval.length; i += 1) {
  //       middle = (interval[i] + interval[i-1]) / 2;
  //       svgTopAxis.append('line').attr('class', 'topaxisminorticks').attr('x1', xt(middle)).attr('y1', 40).attr('x2', xt(middle) ).attr('y2', 30).attr('stroke', 'black').attr('stroke-width', 1);
  //     }
  //   }
  // }

  function setBottomAxis() {
    
    //the width is either -5 to +5 or 25 to 175 etc in real world coords
    //clear axes
    d3.selectAll('.bottomaxis').remove();
    d3.selectAll('.bottomaxisminorticks').remove();
    d3.selectAll('.bottomaxistext').remove();

    width   = rwidth - margin.left - margin.right;  
    
    left  = xbarcontrol-distWidth*sdcontrol;
    right = xbarcontrol+distWidth*sdcontrol;

    xb = d3.scaleLinear().domain([left, right]).range([margin.left-2, width+4]);

    if (showbottomaxis) {

      //bottom horizontal axis
      let xAxisB = d3.axisBottom(xb); //.ticks(20); //.tickValues([]);
      svgBottomAxis.append('g').attr('class', 'bottomaxis').style("font", "1.8rem sans-serif").attr( 'transform', 'translate(0, 0)' ).call(xAxisB);

      //add some text labels
      svgBottomAxis.append('text').text('X').attr('class', 'bottomaxistext').attr('x', width/2 + 100).attr('y', 40).attr('text-anchor', 'start').attr('fill', 'black');

    //add additional ticks
      //the minor ticks
      let interval = d3.ticks(left, right, 10);  //gets an array of where it is putting tick marks

      let minortick;
      let minortickmark;
      for (let i=0; i < interval.length; i += 1) {
        minortick = (interval[i] - interval[i-1]) / 10;
        for (let ticks = 1; ticks <= 10; ticks += 1) {
          minortickmark = interval[i-1] + (minortick * ticks);
          if (minortickmark > left && minortickmark < right) svgBottomAxis.append('line').attr('class', 'bottomaxisminorticks').attr('x1', xb(minortickmark)).attr('y1', 0).attr('x2', xb(minortickmark) ).attr('y2', 5).attr('stroke', 'black').attr('stroke-width', 1);
        }
      }

      //make larger middle tick
      let middle;
      for (let i = 0; i < interval.length; i += 1) {
        middle = (interval[i] + interval[i-1]) / 2;
        svgBottomAxis.append('line').attr('class', 'bottomaxisminorticks').attr('x1', xb(middle)).attr('y1', 0).attr('x2', xb(middle) ).attr('y2', 10).attr('stroke', 'black').attr('stroke-width', 1);
      }
    }
  }

  /*------------------------------------do distributions------------------------------------*/

  function createControl() {
    controlpdf = [];

    left  = xbarcontrol-distWidth*sdcontrol;
    right = xbarcontrol+distWidth*sdcontrol;

    for (let x = left; x <= right; x += 0.1) {
      controlpdf.push({ x: x, y: jStat.normal.pdf(x, xbarcontrol, sdcontrol) })
    }

    //scale it to fit in with drawing area
    controlpdf.forEach(function(v) {
      v.y = scaleypdf(v.y);
    })
  }

  function createExperimental() {
    experimentalpdf = [];

    left  = xbarcontrol-distWidth*sdcontrol;
    right = xbarcontrol+distWidth*sdcontrol;

    for (let x = left; x <= right; x += 0.1) {
      experimentalpdf.push({ x: x, y: jStat.normal.pdf(x, xbarexperimental, sdexperimental) })
    }

    //scale it to fit in with drawing area
    experimentalpdf.forEach(function(v) {
      v.y = scaleypdf(v.y);
    })
  }

  function scaleypdf(y) {
    return y * 3000;
  }

  function drawControlPDF() {
    removeControlPDF();

    //create a generator
    line = d3.line()
      .x(function(d, i) { return xb(d.x); })
      .y(function(d, i) { return y(d.y); });

    //display the curve
    svgP.append('path').attr('class', 'controlpdf static').attr('d', line(controlpdf)).attr('stroke', 'blue').attr('stroke-width', 3).attr('fill', 'none');

    //draw xbarline
    h = d3.max(controlpdf, function(d, i) { return d.y; });
    svgP.append('line').attr('class', 'controlpdf static').attr('x1', xb(xbarcontrol)).attr('y1', y(0)).attr('x2', xb(xbarcontrol)).attr('y2', y(h + 5)).attr('stroke', 'blue').attr('stroke-width', 2).attr('fill', 'none');
  }

  function removeControlPDF() {
    d3.selectAll('.controlpdf').remove();
  }

  function drawExperimentalPDF() {
    removeExperimentalPDF();

    //create a generator
    line = d3.line()
      .x(function(d, i) { return xb(d.x); })
      .y(function(d, i) { return y(d.y); });

    //display the curve
    svgP.append('path').attr('class', 'experimentalpdf draggable').attr('d', line(experimentalpdf)).attr('stroke', 'red').attr('stroke-width', 3).attr('fill', 'none');

    //draw xbarline
    h = d3.max(experimentalpdf, function(d, i) { return d.y; });
    svgP.append('line').attr('class', 'experimentalpdf draggable').attr('x1', xb(xbarexperimental)).attr('y1', y(0)).attr('x2', xb(xbarexperimental)).attr('y2', y(h + 5)).attr('stroke', 'red').attr('stroke-width', 2).attr('fill', 'none');
    
  }

  function removeExperimentalPDF() {
    d3.selectAll('.experimentalpdf').remove();
  }

  /*---------------------------------------------Drag experimental curve------------------------------------*/

  let isDragxbar = false;
  $pdfdisplay
    .mousedown(function(e) {
      //only if mouse on experimental cursor line
      let parentOffset = $(this).parent().offset();
      let relX = e.pageX - parentOffset.left;
      //let relY = e.pageY - parentOffset.top;
      let wr = right - left;
      let wp = xb(right) - xb(left);

      let currentX = (relX - xb(left)) * wr/wp + left;
      if (currentX > xbarexperimental - 2 && currentX < xbarexperimental + 2) {
        isDragxbar = true;
      }
    })
    .mousemove(function(e) {
      if (isDragxbar) {
        let parentOffset = $(this).parent().offset();
        let relX = e.pageX - parentOffset.left;
        let wr = right - left;
        let wp = xb(right) - xb(left);

        xbarexperimental = (relX - xb(left)) * wr/wp + left;

        if (xbarexperimental < left) xbarexperimental = left;
        if (xbarexperimental > right) xbarexperimental = right;
        createExperimental();
        drawExperimentalPDF();
      }
      e.preventDefault();
      e.stopPropagation();
    })
    .mouseup(function(e) {
      isDragxbar = false;
      e.preventDefault();
      e.stopPropagation();
    })

    $('#bottomaxis').on('mousemove', function(e) {
      e.preventDefault();
    })

  /*---------------------------------------------Tooltips on or off-------------------------------------- */

  function setTooltips() {
    Tipped.setDefaultSkin('esci');

    //heading section
    Tipped.create('#logo',          'Version: '+version,                              { skin: 'red', size: 'versionsize', behavior: 'mouse', target: 'mouse', maxWidth: 250, hideOthers: true, hideOnClickOutside: true, hideAfter: 0 });
  
    Tipped.create('#tooltipsonoff', 'Tips on/off, default is off!',                   { skin: 'esci', size: 'xlarge', showDelay: 750, behavior: 'mouse', target: 'mouse', maxWidth: 250, hideOthers: true, hideOnClickOutside: true, hideAfter: 0 });

    Tipped.create('.headingtip',    'https://thenewstatistics.com',                   { skin: 'esci', size: 'xlarge', showDelay: 750, behavior: 'mouse', target: 'mouse', maxWidth: 250, hideOthers: true, hideOnClickOutside: true, hideAfter: 0 });

    Tipped.create('.hometip',       'Click to return to esci Home',                   { skin: 'esci', size: 'xlarge', showDelay: 750, behavior: 'mouse', target: 'mouse', maxWidth: 250, hideOthers: true, hideOnClickOutside: true, hideAfter: 0 });

    //spare
    // Tipped.create('. tip', '', { skin: 'esci', size: 'xlarge', showDelay: 750, behavior: 'mouse', target: 'mouse', maxWidth: 250, hideOthers: true, hideOnClickOutside: true, hideAfter: 0 });

    Tipped.disable('[data-tooltip]');
  }

  $('#tooltipsonoff').on('click', function() {
    if (tooltipson) {
      tooltipson = false;
      $('#tooltipsonoff').css('background-color', 'lightgrey');
    }
    else {
      tooltipson = true;
      $('#tooltipsonoff').css('background-color', 'lightgreen');
      Tipped.enable('[data-tooltip]');
    }
  })


  /*----------------------------------------------------------footer----------------------------------------*/
 
  $('#footer').on('click', function() {
    window.location.href = "https://thenewstatistics.com/";
  })

  /*---------------------------------------------------------  resize event -----------------------------------------------*/
  $(window).bind('resize', function(e){
    window.resizeEvt;
    $(window).resize(function(){
        clearTimeout(window.resizeEvt);
        window.resizeEvt = setTimeout(function(){
          resize();
        }, 500);
    });
  });

  //helper function for testing
  function lg(s) {
    console.log(s);
  }  

})

