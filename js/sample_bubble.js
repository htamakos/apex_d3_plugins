(function( util, server, $, d3 ) {
  var sampleData = [];
  var width = 1122, height = 700, padding = 100,
  LEGEND_COLUMN_WIDTH = 300;

  com_oracle_apex_d3_bubblechart = function(pRegionId, pAjaxId, pOptions){
    var gIsKeyDownTriggered,
        gTooltipColor,
        gYValueFormatter,
        gTooltipGenerator,
        gTooltip$,
        gChart$,
        bubleChart,
        svg,
        gLegend$,
        xTooltipName,
        yTooltipName,
        rTooltipName;

    function d3_rgbNumber(value) {
      return new d3.rgb(value >> 16, value >> 8 & 0xff, value & 0xff);
    }

    function d3_rgbString(value) {
      return d3_rgbNumber(value) + "";
    }

    var d3_categoryCustom20 = [
      0xff0000, 0xff4000,
      0xff8000, 0xffbf00,
      0xffff00, 0xbfff00,
      0x80ff00, 0x40ff00,
      0x00ff00, 0x00ff40,
      0x00ff80, 0x00ffbf,
      0x00ffff, 0x00bfff,
      0x0080ff, 0x0040ff,
      0x0000ff, 0x4000ff,
      0x8000ff, 0xbf00ff
    ].map(d3_rgbString);

    d3.scale.d3_categoryCustom20 = function() {
      return d3.scale.ordinal().range(d3_categoryCustom20);
    };

    var color = d3.scale.d3_categoryCustom20();
    var isDevelopmentMode = pOptions.isDevelopmentMode ? true : false

    // グラフの描画
    function _draw(jsonData){
      var dataset = [];

      if(isDevelopmentMode){
        dataset = jsonData.data.filter(function(d){
          return d.x > 300000 && d.x < 5000000;
        });
      } else {
  		  dataset = jsonData.data.sort(function(a,b){ return b.r - a.r; });
      }
      dataset = jsonData.data.sort(function(a,b){ return b.r - a.r; });
  		// x軸のスケール設定
  		var xScale = d3.scale.linear()
  						       .domain(d3.extent(dataset,  function(d){ return d.x; }))
  						       .range([padding, width - padding])
  		// y軸のスケール設定
  		var yScale = d3.scale.linear()
  						       .domain(d3.extent(dataset, function(d){ return d.y; }))
  						       .range([height - padding, padding])
  		// 円のスケール設定
  		var rScale = d3.scale.sqrt()
  						       .domain(d3.extent(dataset, function(d){ return d.r; }))
  						       .range([10, 100])

			var xAxis = d3.svg.axis()
							      .scale(xScale)
							      .orient("bottom")
							      .ticks(5);

			var yAxis = d3.svg.axis()
							      .scale(yScale)
							      .orient("left")
							      .ticks(5);
      bubleChart = {
        color: color,
        xScale: xScale,
        yScale: yScale,
        rScale: rScale,
        xAxis: xAxis,
        yAxis: yAxis
      }

      //　円が領域をはみ出ないようにclipPathですべての円をマスキングする
			svg.append("clipPath")
				.attr("id", "chart-area-clipPath")
				.append("rect")
				.attr("x", padding)
				.attr("y", padding)
				.attr("width", width - padding * 2)
				.attr("height", height - padding * 2);

  		// 円の描画
  		svg.append("g")
         .attr("id", "chart-area-circles")
         .attr("clip-path", "url(#chart-area-clipPath)")
         .selectAll("circle")
  			 .data(dataset)
  			 .enter()
  			 .append("circle")
  			 .attr(
           {
  			 	   cx: function(d){ return bubleChart.xScale(d.x); },
  				   cy: function(d){ return bubleChart.yScale(d.y); },
  				   fill: function(d,i){return bubleChart.color(i);},
  				   r: 0,
             label: function(d){ return d.label; },
             class: "a-D3BubbleChart-circle"
           }
         )
         .style('opacity', 0.5)
         .on("mouseover", function(d){
            _handleMouseOverEvent(this, d, bubleChart);
          })
          .on("mouseout", function(d){
            _handleMouseOutEvent(this, d, bubleChart);
          })
          .on("click", function(d){
            if(d.link){
              var win = apex.navigation.redirect(d.link);
              win.focus();
            }
          })
  			 .transition()
  			 .duration(1000)
  			 .ease("bounce")
  			 .attr({
  				 r: function(d){ return bubleChart.rScale(d.r); },
  			 })

      //軸の描画
      svg.append("g")
				.attr("class", "a-D3BubbleChart-axis")
				.attr("transform", "translate(0," + (height - padding) + ")")
				.call(bubleChart.xAxis);

			svg.append("g")
				.attr("class", "a-D3BubbleChart-axis")
				.attr("transform", "translate(" + padding + ", 0)")
				.call(bubleChart.yAxis);

      _showLegend(dataset, bubleChart)

      svg.append("g")
         .attr("class", "a-D3BubbleChart-axis a-D3BubbleChart-axis-title")
         .append("text")
         .text(pOptions.yAxisTitle)
         .attr(
           {
             x: 5,
             y: height/2,
             transform: "rotate(-90,10," + height/2 + ")"
           }
         )

      svg.append("g")
         .attr("class", "a-D3BubbleChart-axis a-D3BubbleChart-axis-title")
         .append("text")
         .attr(
          {
            x: width / 2,
            y: height - padding / 2,
          }
         )
         .text(pOptions.xAxisTitle);
    }

    // dataの取得
    function _refresh() {
      if(isDevelopmentMode) {
        _draw(document.sampleJSON);
      } else {
        apex.server.plugin(pAjaxId, { pageItems: null },
                                    { success: _draw, dataType: "json" });
      }
    }

    function _showTooltip(object, d, accessors){
      gTooltipColor = object.getAttribute("fill");
      var tooltipSelection = d3.select(gTooltip$.get(0));

      tooltipSelection.append("div")
                      .attr("class", "a-D3ChartTooptip-marker")
                      .style({
                        'background-color': gTooltipColor
                      });
      tooltipSelection.append("p")
                      .attr("class", "a-D3ChartTooptip-marker")
                      .text(d.label);

      tooltipSelection.append("p")
                      .attr("class", "a-D3ChartTooptip-content")
                      .text(xTooltipName + ": " +  Math.floor(d.x));

      tooltipSelection.append("p")
                      .attr("class", "a-D3ChartTooptip-content")
                      .text(yTooltipName + ": " +  Math.floor(d.y));

      tooltipSelection.append("p")
                      .attr("class", "a-D3ChartTooptip-content")
                      .text(rTooltipName + ": " +  Math.floor(d.r));

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

    function _init(pRegionId, pOptions){
      gRegion$ = $('#' + util.escapeCSS(pRegionId) + '_region', apex.gPageContext$);
      gChart$ = $('#' + util.escapeCSS(pOptions.chartRegionId) + '_chart', apex.gPageContext$);
      xTooltipName = pOptions.xTooltipName ? pOptions.xTooltipName : "x";
      yTooltipName = pOptions.yTooltipName ? pOptions.yTooltipName : "y";
      rTooltipName = pOptions.rTooltipName ? pOptions.rTooltipName : "S";

      svg = d3.select(gChart$.get(0))
              .append("svg")
              .attr("width", width)
              .attr("height", height)
              .attr("class", "a-D3BubbleChart-svg")

      _initializeLegend();
      _initializeTooltip();

      gRegion$.on("apexrefresh", _refresh)
              .trigger("apexrefresh");
    }

    function _initializeTooltip(){
      gTooltip$ = $('<div>').addClass('a-D3BubbleChart-tooltip a-D3Tooltip')
                            .appendTo(gChart$)
                            .hide();
    }

    function _initializeLegend(){
      var svgOffset = gChart$.select(".a-D3BubbleChart-svg").offset();
      gLegend = d3.select(gChart$.get(0))
                  .append('ul')
                  .attr("class", "a-D3ChartLegend-component")
                  .style({
                    "-moz-column-count": "1",
                    "-moz-column-width": "8em",
                    "-webkit-columns": "1 8em",
                    "margin-top": padding + "px",
                    "margin-left": "-5%",
                    height: (height - padding * 2) + "px"
                  });
    }

    function _showLegend(data, accessors){
      if(data.length >= 20) {
        var targetDataset = data.slice(0,19);
      } else {
        var targetDataset = data.slice(0,data.length-1);
      }
      gLegend.selectAll("li")
             .data(targetDataset)
             .enter()
             .append("li")
             .on("mouseout", function(d){
                $("circle[label=\"" + d.label + "\"]").css("opacity", 0.5);
             })
             .on("mouseover", function(d){
               $("circle[label='" + d.label + "']").css("opacity", 1);
             })
             .on("click", function(d){
               if(d.link){
                 var win = apex.navigation.redirect(d.link);
                 win.focus();
               }
             })
             .each(function(d,i){
                d3.select(this).append("div")
                  .attr("class", "a-D3ChartLegend-marker")
                  .style({
                    'background-color': accessors.color(i)
                  });
                d3.select(this).append("div")
                   .attr("class", "a-D3ChartLegend-marker")
                   .text(d.label);
             })
    }

    function _handlePointEnterEvent(object){
      gTooltip$.stop.fadeIn(0);
      gHoveredPoint = object;
    }

    function _handleMouseOverEvent(object, d, accessors){
      d3.select(object).style("opacity", 1);
      _showTooltip(object, d, accessors);
    }

    function _handleMouseOutEvent(object, d, accessors){
      d3.select(object).style("opacity", 0.5);
      _hideTooltip(object, d, accessors);
    }

    _init(pRegionId, pOptions);
  };
})(apex.util, apex.server, apex.jQuery, d3);
