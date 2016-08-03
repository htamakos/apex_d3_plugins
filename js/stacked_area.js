(function( util, server, $, d3 ) {
  var width = 1122, height = 700, padding = 100
      LEGEND_COLUMN_WIDTH = 300;

  com_oracle_apex_d3_stacked_area = function(pRegionId, pAjaxId, pOptions){
    var gYValueFormatter,
        gTooltip$,
        gLegend;

    function _init(){
      gRegion$ = $('#' + util.escapeCSS(pRegionId) + '_region', apex.gPageContext$);
      gChart$ = $('#' + util.escapeCSS(pOptions.chartRegionId) + '_chart', apex.gPageContext$);

      svg = d3.select(gChart$.get(0))
              .append("svg")
              .attr("width", width)
              .attr("height", height)
              .attr("class", "a-D3StackedArea-svg");
      _initializeLegend();
      _initializeTooltip();

      gRegion$.on("apexrefresh", _refresh)
              .trigger("apexrefresh");
    }

    function _draw(jsonData, options){
      var data = jsonData.data;
      var dataset = [];
      var dates = data.map(function(d){ return d.x; })
                      .filter(function(x,i,self){ return self.indexOf(x) === i; });
      var labels = data.map(function(d){ return d.label; })
                       .filter(function(x,i,self){ return self.indexOf(x) === i; });
      var timeFormat = d3.time.format('%Y-%m-%d %H:%M');

      labels.forEach(function(label,i){
        var values = [];
        var dateForLabel = data.filter(function(d){ return d.label === label; });

        dates.forEach(function(date,i){
          var d = dateForLabel.find(function(d){ return d.x === date });
          if(d){
            d.x = timeFormat.parse(d.x);
            values.push(d);
          } else {
            values.push({ label: label, x: timeFormat.parse(date), y: 0 });
          }
        })

        var obj = { key: label, values: values};
        dataset.push(obj);
      });

      var xScale = d3.time.scale()
                     .domain(d3.extent(dates, function(d){
                       return timeFormat.parse(d);
                     }))
                     .range([padding, width - padding]);

      var yScale = d3.scale.linear()
                     .range([height - padding, padding]);
      var colorScale = d3.scale.category20();

      var xAxis = d3.svg.axis()
                    .scale(xScale)
                    .orient("buttom")
                    .tickFormat(timeFormat);
      var yAxis = d3.svg.axis()
                    .scale(yScale)
                    .orient("left")
                    .ticks(5);

      var stack = d3.layout.stack()
                    .values(function(d){ return d.values });

      var layer = svg.selectAll(".layer")
                     .data(stack(dataset))
                     .enter()
                     .append("g")
                     .attr("class", ".layer");
      yScale.domain([0, d3.max(dataset[dataset.length - 1].values, function(d){
        return d.y0 + d.y;
      })]);

      var area = d3.svg.area()
                   .x(function(d) { return xScale(d.x); })
                   .y0(function(d) { return yScale(d.y0); })
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
           .attr("key", function(d){
             return d.key
           })
           .on("mouseover", function(d){
              _handleMouseOverEvent(this, d)
            })
           .on("mouseout", function(d){
             d3.selectAll("path[key=\"" + d.key + "\"]")
               .style({
                 "stroke": "",
                 "stroke-width": "",
                 "opacity": 0.5
               })
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
             transform: "rotate(-90,20,"+ height/2 + ")"
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
      _showLegend(dataset, colorScale)
    }
    function _initializeTooltip(){
      gTooltip$ = $('<div>').addClass('a-D3StackedArea-tooltip a-D3Tooltip')
                            .appendTo(gChart$)
                            .hide();
    }

   function _initializeLegend(){
     var svgOffset = gChart$.select(".a-D3StackedArea-svg").offset();
     gLegend = d3.select(gChart$.get(0))
                 .append('ul')
                 .attr("class", "a-D3StackedAreaLegend-component")
                 .style({
                   "margin-top": padding + "px",
                   "margin-left": "-5%",
                   height: (height - padding * 2) + "px",
                   width: "500px"
                 });
   }

   function _showLegend(data, colorScale){
     if(data.length >= 20) {
       var targetDataset = data.slice(0,19);
     } else {
       var targetDataset = data.slice(0,data.length-1);
     }
     gLegend.selectAll("li")
            .data(targetDataset)
            .sort(function(d){ return d.r })
            .enter()
            .append("li")
            .on("mouseout", function(d){
              d3.selectAll("path[key=\"" + d.key + "\"]")
                .style({
                  "stroke": "",
                  "stroke-width": "",
                  "opacity": 0.5
                })
            })
            .on("mouseover", function(d){
              d3.selectAll("path[key=\"" + d.key + "\"]")
                .style({
                  "stroke": "black",
                  "stroke-width": 0.5,
                  "opacity": 1
                })
            })
            .each(function(d,i){
               d3.select(this).append("div")
                 .attr("class", "a-D3StackedAreaLegend-marker")
                 .style({
                   'background-color': colorScale(i)
                 });
               d3.select(this).append("div")
                  .attr("class", "a-D3StackedAreaLegend-label")
                  .text(d.key);
            })
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
      var tooltipSelection = d3.select(gTooltip$.get(0));

      tooltipSelection.append("div")
                      .attr("class", "a-D3StackedAreaTooptip-marker")
                      .style({
                        'background-color': gTooltipColor
                      });
      tooltipSelection.append("div")
                      .attr("class", "a-D3StackedAreaTooptip-label")
                      .text(d.key);

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
      gTooltip$.children().remove();
    }


    function _handlePointEnterEvent(object){
      gTooltip$.stop.fadeIn(0);
      gHoveredPoint = object;
    }

    function _handleMouseOverEvent(object, d){
      d3.selectAll("path[key=\"" + d.key + "\"]")
        .style({
          "stroke": "black",
          "stroke-width": "0.5",
          "opacity": 1
        })
      _showTooltip(object, d);
    }

    _init(pRegionId, pAjaxId);
  }
})(apex.util, apex.server, apex.jQuery, d3);
