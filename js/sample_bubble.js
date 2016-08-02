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
        gLegend$;

    var color = d3.scale.category20();
    var isDevelopmentMode = pOptions.isDevelopmentMode ? true : false

    // グラフの描画
    function _draw(jsonData){
      console.log(jsonData);
      var dataset = [];

      if(isDevelopmentMode){
        //for(i=0; i<20; i++){
    		//	var _x = Math.floor(Math.random() * 100);
    		//	var _y = Math.floor(Math.random() * 100);
    		//	var _r = Math.floor(Math.random() * 100);
    		//	dataset.push({ x:_x, y:_y, r:_r });
    		//}
        dataset = jsonData.data;
        dataset = dataset.filter(function(d){
          return d.x > 300000 && d.x < 5000000;
        });
      } else {
  		  dataset = jsonData.data;
      }

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
  				   fill: function(d,i){return color(d.x);},
  				   r: 0,
             label: function(d){ return d.label; }
           }
         )
         .style('opacity', 0.5)
         .on("mouseover", function(d){
            _handleMouseOverEvent(this, d, bubleChart)
          })
          .on("mouseout", function(d){
            _hideTooltip(this, d);
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
         .attr(
           {
             x: padding / 3,
             y: height / 2,
             "text-anchor": "middle"
           }
         )
         .text(pOptions.yAxisTitle)

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
                        'background-color': accessors.color(d.x)
                      });
      tooltipSelection.append("p")
                      .attr("class", "a-D3ChartTooptip-marker")
                      .text(d.label);

      tooltipSelection.append("p")
                      .attr("class", "a-D3ChartTooptip-content")
                      .text("x: " +  Math.floor(d.x));

      tooltipSelection.append("p")
                      .attr("class", "a-D3ChartTooptip-content")
                      .text("y: " +  Math.floor(d.y));

      tooltipSelection.append("p")
                      .attr("class", "a-D3ChartTooptip-content")
                      .text("S: " +  Math.floor(d.x));

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
      console.log(util.escapeCSS(pRegionId));
      gRegion$ = $('#' + util.escapeCSS(pRegionId) + '_region', apex.gPageContext$);
      gChart$ = $('#' + util.escapeCSS(pOptions.chartRegionId) + '_chart', apex.gPageContext$);

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
      var svgOffset = gChart$.select("svg").offset();
      gLegend = d3.select(gChart$.get(0))
                  .append('ul')
                  .attr("class", "a-D3ChartLegend-component")
                  .style({
                    "-moz-column-count": 1,
                    "-webkit-column-count": 1,
                    "-moz-column-width": "8em",
                    "-webkit-column-count": "8em",
                    position: 'absolute',
                    top: svgOffset.top + padding,
                    left: svgOffset.left + width - padding - 30,
                    width: 150,
                    height: height - padding * 2
                  });
    }

    function _showLegend(data, accessors){
      var targetDataset = data.sort(function(a,b){
        var ar = a.r, br = b.r;
        if(ar > br) return -1;
        if(ar < br) return 1;
        return 0
      }).slice(0,19);
      gLegend.selectAll("li")
             .data(targetDataset)
             .sort(function(d){ return d.r })
             .enter()
             .append("li")
             .on("mouseout", function(d){
                $("circle[label=\"" + d.label + "\"]").css("opacity", 0.5);
                $(this).removeClass("a-D3ChartLegend-selected");
             })
             .on("mouseover", function(d){
               $("circle[label='" + d.label + "']").css("opacity", 1);
               $(this).attr("class", "a-D3ChartLegend-selected");
             })
             .each(function(d,i){
                d3.select(this).append("div")
                  .attr("class", "a-D3ChartLegend-marker")
                  .style({
                    'background-color': accessors.color(d.x)
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
      _showTooltip(object, d, accessors);
    }

    _init(pRegionId, pOptions);
  };
})(apex.util, apex.server, apex.jQuery, d3);
