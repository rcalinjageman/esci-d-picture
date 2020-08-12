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

  let svgTopAxis;                                                             //svg reference to the top axis
  let svgBottomAxis;                                                          //svg reference to the bottom axis
  let svgP;                                                                   //the svg reference to pdfdisplay

  let mu                      = 100;
  let sigma                   = 15;                                          //the population mean, standard deviation and degrees of freedom
  let zmu                     = 0;                                           //parameters of normal distribution
  let zsd                     = 1;                                           


  let showxaxis               = false;

  let units                   = 'IQ Points';
 
  let normalpdf               = [];                                           //the array holding the normal distribution
 
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
    
    setupSliders();

    setTooltips();

    //get initial values for height/width
    rwidth  = $('#pdfdisplay').outerWidth(true);
    rheight = $('#pdfdisplay').outerHeight(true);

    //these are fixed so do I need to be responsive?
    heighttopaxis    = $('#topaxis').outerHeight(true);
    heightbottomaxis = $('#bottomaxis').outerHeight(true);

    //do this once?
    //set a reference to the displaypdf area
    d3.selectAll('svg > *').remove();  //remove all elements under svgP
    $('svg').remove();                 //remove the all svg elements from the DOM

    //axes
    svgTopAxis = d3.select('#topaxis').append('svg').attr('width', '100%').attr('height', '100%');
    svgBottomAxis = d3.select('#bottomaxis').append('svg').attr('width', '100%').attr('height', '100%');

    //pdf display
    svgP = d3.select('#pdfdisplay').append('svg').attr('width', '100%').attr('height', '100%');

    resize();

  }

  function setupSliders() {
  }



  function resize() {
    //have to watch out as the width and height do not always seem precise to pixels
    //browsers apparently do not expose true element width, height.
    //also have to think about box model. outerwidth(true) gets full width, not sure resizeObserver does.
    resizeObserver.observe(pdfdisplay);  //note doesn't get true outer width, height

    width   = rwidth - margin.left - margin.right;  
    heightP = rheight - margin.top - margin.bottom;

  }


  //set everything to a default state.
  function clear() {
    
    removeNormalPDF();  //not sure I need to do this as draNormal does it as well?

    setupAxes();  //removes and resets axes

    createNormal();
    createT();

    drawNormalPDF();

    
    //#region TESTING -------------------------------------------------------------------

    //#endregion


  }

  /*-------------------------------------------Set up axes---------------------------------------------*/


  function setupAxes() {
    //the height is 0 - 100 in real world coords   I'm not sure resize is working for rheight
    heightP = $('#pdfdisplay').outerHeight(true) - margin.top - margin.bottom;
    y = d3.scaleLinear().domain([0, realHeight]).range([heightP, 0]);

    setTopAxis();
    setBottomAxis();
  }
  
  function setTopAxis() {
    //clear axes
    d3.selectAll('.topaxis').remove();
    d3.selectAll('.topaxisminorticks').remove();
    d3.selectAll('.topaxistext').remove();
    d3.selectAll('.topaxisunits').remove();

    if (showxaxis) {
      width   = rwidth - margin.left - margin.right;  
      
      let left  = mu-5*sigma
      let right = mu+5*sigma

      xt = d3.scaleLinear().domain([left, right]).range([margin.left-2, width+4]);

      //top horizontal axis
      let xAxisA = d3.axisTop(xt).tickSizeOuter(0);  //tickSizeOuter gets rid of the start and end ticks
      svgTopAxis.append('g').attr('class', 'topaxis').style("font", "1.8rem sans-serif").attr( 'transform', 'translate(0, 42)' ).call(xAxisA);

      //add some text labels
      svgTopAxis.append('text').text('X').style('font-style', 'italic').attr('class', 'topaxistext').attr('x', width/2 - 20).attr('y', 16).attr('text-anchor', 'start').attr('fill', 'black');
      svgTopAxis.append('text').text(units).attr('class', 'topaxisunits').attr('x', width/2 - 70).attr('y', 70).attr('text-anchor', 'start').attr('fill', 'black');

      //add additional ticks
      //the minor ticks
      let interval = d3.ticks(left-sigma, right+sigma, 10);  //gets an array of where it is putting tick marks

      let minortick;
      let minortickmark;
      for (let i=0; i < interval.length; i += 1) {
        minortick = (interval[i] - interval[i-1]) / 10;
        for (let ticks = 1; ticks <= 10; ticks += 1) {
          minortickmark = interval[i-1] + (minortick * ticks);
          if (minortickmark > left && minortickmark < right) svgTopAxis.append('line').attr('class', 'topaxisminorticks').attr('x1', xt(minortickmark)).attr('y1', 40).attr('x2', xt(minortickmark) ).attr('y2', 35).attr('stroke', 'black').attr('stroke-width', 1);
        }
      }

      //make larger middle tick
      let middle;
      for (let i = 0; i < interval.length; i += 1) {
        middle = (interval[i] + interval[i-1]) / 2;
        svgTopAxis.append('line').attr('class', 'topaxisminorticks').attr('x1', xt(middle)).attr('y1', 40).attr('x2', xt(middle) ).attr('y2', 30).attr('stroke', 'black').attr('stroke-width', 1);
      }
    }
  }

  function setBottomAxis() {
    
    //the width is either -5 to +5 or 25 to 175 etc in real world coords
    //clear axes
    d3.selectAll('.bottomaxis').remove();
    d3.selectAll('.bottomaxisminorticks').remove();
    d3.selectAll('.bottomaxistext').remove();

    xb = d3.scaleLinear().domain([-5.000, 5.000]).range([margin.left-2, width+4]);

    //bottom horizontal axis
    let xAxisB = d3.axisBottom(xb); //.ticks(20); //.tickValues([]);
    svgBottomAxis.append('g').attr('class', 'bottomaxis').style("font", "1.8rem sans-serif").attr( 'transform', 'translate(0, 0)' ).call(xAxisB);

    //add some text labels
    if (tab === 'Normal')   svgBottomAxis.append('text').text('z').attr('class', 'bottomaxistext').attr('x', width/2 + 100).attr('y', 40).attr('text-anchor', 'start').attr('fill', 'black');
    if (tab === 'Studentt') svgBottomAxis.append('text').text('z or t').attr('class', 'bottomaxistext').attr('x', width/2 + 100).attr('y', 40).attr('text-anchor', 'start').attr('fill', 'black');

  //add additional ticks
    //the minor ticks
    let interval = d3.ticks(-5, 5, 10);  //gets an array of where it is putting tick marks

    let minortick;
    let minortickmark;
    for (let i=0; i < interval.length; i += 1) {
      minortick = (interval[i] - interval[i-1]) / 10;
      for (let ticks = 1; ticks <= 10; ticks += 1) {
        minortickmark = interval[i-1] + (minortick * ticks);
        if (minortickmark > -5 && minortickmark < 5) svgBottomAxis.append('line').attr('class', 'bottomaxisminorticks').attr('x1', xb(minortickmark)).attr('y1', 0).attr('x2', xb(minortickmark) ).attr('y2', 5).attr('stroke', 'black').attr('stroke-width', 1);
      }
    }

    //make larger middle tick
    let middle;
    for (let i = 0; i < interval.length; i += 1) {
      middle = (interval[i] + interval[i-1]) / 2;
      svgBottomAxis.append('line').attr('class', 'bottomaxisminorticks').attr('x1', xb(middle)).attr('y1', 0).attr('x2', xb(middle) ).attr('y2', 10).attr('stroke', 'black').attr('stroke-width', 1);
    }

  }

  /*------------------------------------do distributions------------------------------------*/

  function createNormal() {
    normalpdf = [];

    for (let x = -5.000; x <= 5.000; x += 0.005) {
      normalpdf.push({ x: x, y: jStat.normal.pdf(x, zmu, zsd) })
    }

    //scale it to fit in with drawing area
    normalpdf.forEach(function(v) {
      v.y = scaleypdf(v.y);
    })
  }

  function scaleypdf(y) {
    return y * 250;
  }

  function drawNormalPDF() {
    removeNormalPDF();
    //create a generator
    line = d3.line()
      .x(function(d, i) { return xb(d.x); })
      .y(function(d, i) { return y(d.y); });

    //display the curve
    svgP.append('path').attr('class', 'normalpdf').attr('d', line(normalpdf)).attr('stroke', 'blue').attr('stroke-width', 3).attr('fill', 'none');

  }

  function removeNormalPDF() {
    d3.selectAll('.normalpdf').remove();
  }


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

