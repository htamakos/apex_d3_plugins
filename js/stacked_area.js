(function( util, server, $, d3 ) {
  var width = 1122, height = 700, padding = 100
      LEGEND_COLUMN_WIDTH = 300;

  com_oracle_apex_d3_stacked_area = function(pRegionId, pAjaxId, pOptions){
    var gYValueFormatter;

    function _init(){
      gRegion$ = $('#' + util.escapeCSS(pRegionId) + '_region', apex.gPageContext$);
      gChart$ = $('#' + util.escapeCSS(pOptions.chartRegionId) + '_chart', apex.gPageContext$);

      svg = d3.select(gChart$.get(0))
              .append("svg")
              .attr("width", width)
              .attr("height", height)
              .attr("class", "a-D3StackedArea-svg");

      gRegion$.on("apexrefresh", _refresh)
              .trigger("apexrefresh");
      _initializeTooltip();
    }

    function _draw(jsonData, options){
      var dataset = [];

      if(pOptions.isDevelopmentMode){
        var sampleLabels = [
          'mario', 'tama', 'dbcpu', 'enq: tx row contention'
        ]
        sampleLabels.forEach(function(val, index){
          for(var i=0;i < 20;i++){
            var obj = {
              x: new Date(2015,1,i),
              y: Math.floor(Math.random() * 100),
              label: sampleLabels[index]
            }
            dataset.push(obj);
          }
        });
      }else{
        dataset = jsonData.data;
      }

      var groupingDataset = d3.nest().key(function(d){ return d.label; })
                              .entries(dataset);
      var testDataset = groupingDataset[1].values;

      var xScale = d3.time.scale()
                     .domain(d3.extent(dataset, function(d){
                       return d.x;
                     }))
                     .range([padding, width - padding]);

      var yScale = d3.scale.linear()
                     .range([height - padding, padding]);
      var colorScale = d3.scale.category10();

      var xAxis = d3.svg.axis()
                    .scale(xScale)
                    .orient("buttom");
      var yAxis = d3.svg.axis()
                    .scale(yScale)
                    .orient("left")
                    .ticks(5);

      var area = d3.svg.area()
                   .x(function(d){ return xScale(d.x); })
                   .y0(function(d){ return yScale(d.y0); })
                   .y1(function(d){ return yScale(d.y0 + d.y); })
      var stack = d3.layout.stack()
                    .values(function(d){ return d.values });

      var layer = svg.selectAll(".layer")
                     .data(stack(groupingDataset))
                     .enter()
                     .append("g")
                     .attr("class", ".layer");

      yScale.domain([0, d3.max(groupingDataset[groupingDataset.length - 1].values, function(d){
        return d.y0 + d.y;
      })]);

      var area = d3.svg.area()
                   .x(function(d) { return xScale(d.x); })
                   .y0(function(d) { return yScale(d.y0) })
                   .y1(function(d) { return yScale(d.y0 + d.y); });

      layer.append("path")
           .attr("class", "area")
           .attr("fill", function(d,i){
             return colorScale(i);
           })
           .style("opacity", 0.5)
           .attr("d", function(d){
             return area(d.values);
           })
           .on("mouseover", function(d){
              _handleMouseOverEvent(this, d)
            })
           .on("mouseout", function(d){
             _hideTooltip(this, d);
           })

      svg.append("g")
         .attr("class", "a-D3StackedArea-axis")
         .attr("transform", "translate(0, " + (height - padding) + ")")
         .call(xAxis);

      svg.append("g")
         .attr("class", "a-D3StackedArea-axis")
         .attr("transform", "translate(" + padding + ", 0)")
         .call(yAxis);

      svg.append("g")
         .attr("class", "a-D3StackedArea-axis")
         .append("text")
         .attr(
           {
             x: 10,
             y: height / 2,
           }
         )
         .text(pOptions.yAxisTitle)

      svg.append("g")
         .attr("class", "a-D3StackedArea-axis")
         .append("text")
         .attr(
          {
            x: width / 2,
            y: height - padding / 2,
          }
         )
         .text(pOptions.xAxisTitle);
    }
    function _initializeTooltip(){
      function getTooltipLabel(d) {
        return d.key;
      }

      function getTooltipValue(d){
        return d.key;
      }

      function getTooltipColor(d){
        return gTooltipColor;
      }

      function getTooltipContent(d){
        return d.tooltip;
      }

      var accessorOptions = {
        label: getTooltipLabel,
        value: getTooltipValue,
        color: getTooltipColor,
        content: getTooltipContent
      }

      gTooltipGenerator = d3.oracle.tooltip()
                            .accessors(accessorOptions)
                            .formatters({ value : gYValueFormatter })
                            .transitions({ enable : false })
                            .symbol('circle');
      gTooltip$ = $('<div>').addClass('a-D3StackedAreaChart-tooltip a-D3Tooltip')
                            .appendTo(gChart$)
                            .hide();

      var tooltipSelection = d3.select(gTooltip$.get(0));
    }


    function _refresh() {
      if(pOptions.isDevelopmentMode) {
        _draw(document.sampleJSON);
      } else {
        apex.server.plugin(pAjaxId, { pageItems: null },
                                    { success: _draw, dataType: "json" });
      }
    }

    function _showTooltip(object, d){
      gTooltipColor = object.getAttribute("fill");
      d3.select(gTooltip$.get(0))
        .datum(d)
        .call(gTooltipGenerator);

      if ( !gTooltip$.is(':visible') ) {
        gTooltip$.fadeIn();
      }

      gTooltip$.position({
        my: 'center top',
        of: d3.event,
        at: 'center center',
        within: gRegion$,
        collision: 'fit flip'
      });
    }

    function _hideTooltip(){
      gTooltip$.stop().fadeOut(0);
    }


    function _handlePointEnterEvent(object){
      gTooltip$.stop.fadeIn(0);
      gHoveredPoint = object;
    }

    function _handleMouseOverEvent(object, d){
      _showTooltip(object, d);
    }

    _init(pRegionId, pAjaxId);
  }
})(apex.util, apex.server, apex.jQuery, d3);