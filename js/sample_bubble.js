(function( util, server, $, d3 ) {
  var sampleData = [];
  var width = 960, height = 500, padding = 50, isDevelopmentMode = false,
      LEGEND_COLUMN_WIDTH = 200;

  com_oracle_apex_d3_bubblechart = function(pRegionId, pAjaxId, pOptions){
    var gIsKeyDownTriggered,
        gTooltipColor,
        gYValueFormatter,
        gTooltipGenerator,
        gTooltip$,
        gLegend$,
        gChart$,
        bubleChart,
        svg;

    var color = d3.scale.category20();

    // グラフの描画
    function _draw(jsonData){
      console.log(jsonData);
      var dataset = [];

      if(isDevelopmentMode){
        for(i=0; i<20; i++){
    			var _x = Math.floor(Math.random() * 100);
    			var _y = Math.floor(Math.random() * 100);
    			var _r = Math.floor(Math.random() * 100);
    			dataset.push({ x:_x, y:_y, r:_r });
    		}
      } else {
  		  dataset = jsonData.data;
      }
      console.log(dataset);

  		// x軸のスケール設定
  		var xScale = d3.scale.linear()
  						.domain(d3.extent(dataset,  function(d){ return d.x; }))
  						.range([padding, width - padding])
  		// y軸のスケール設定
  		var yScale = d3.scale.linear()
  						.domain(d3.extent(dataset, function(d){ return d.y; }))
  						.range([height - padding, padding])
  		// 円のスケール設定
  		var rScale = d3.scale.linear()
  						.domain(d3.extent(dataset, function(d){ return d.r; }))
  						.range([1, 100])

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
  				   fill: function(d,i){return color(i);},
  				   r: 0
           }
         )
         .on("mouseover", function(d){
            _handleMouseOverEvent(this, d)
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
				.attr("transform", "translate(" + padding + ",0)")
				.call(bubleChart.yAxis);

      // 凡例の描画
      //gLegend$ = $(document.createElement('div'));
      //gChart$.after(gLegend$);
      //_initializeLegend(dataset, width);

    }

    // dataの取得
    function _refresh() {
      if(isDevelopmentMode) {
        _draw(sampleData);
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

    function _init(pRegionId, pOptions){
      console.log(util.escapeCSS(pRegionId));
      gRegion$ = $('#' + util.escapeCSS(pRegionId) + '_region', apex.gPageContext$);
      gChart$ = $('#' + util.escapeCSS(pOptions.chartRegionId) + '_chart', apex.gPageContext$);

      svg = d3.select(gChart$.get(0))
              .append("svg")
              .attr("width", width)
              .attr("height", height)
              .attr("class", "a-D3BubbleChart-svg")

      _initializeTooltip();

      gRegion$.on("apexrefresh", _refresh)
              .trigger("apexrefresh");

    }

    function _initializeTooltip(){
      function getTooltipLabel(d) {
        return "x: "
               + d.x
               + ", y: "
               + d.y
               + ", r: "
               + d.r;
      }

      function getTooltipValue(d){
        return d.label;
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
      gTooltip$ = $('<div>').addClass('a-D3BubbleChart-tooltip a-D3Tooltip')
                            .appendTo(gChart$)
                            .hide();

      var tooltipSelection = d3.select(gTooltip$.get(0));
    }

    function _initializeLegend(data, width){
      gAry = d3.oracle.ary()
               .hideTitle(true)
               .showValue(false)
               .leftColor(true)
               .numberOfColumns(Math.max(Math.floor(width / LEGEND_COLUMN_WIDTH), 1 ))
               .accessors({
                 color: function(d, i) { return color(i); },
                 label: function(d) { return d.x; }
               })
               .symbol('circle');
      d3.select(gLegend$.get(0))
        .datum(data)
        .call(gAry)
        .selectAll('a-D3ChartLegend-item')
        .each(function (d, i){
            d3.select( this )
              .selectAll( '.a-D3ChartLegend-item-color' )
              .each(function() {
                  var self = d3.select(this);
                  var colorClass = self.attr('class').match(/u-Color-\d+-BG--bg/g) || [];
                  for (var i = colorClass.length - 1; i >= 0; i--) {
                      self.classed(colorClass[i], false);
                  };
              })
        });
    }

    function _handlePointEnterEvent(object){
      gTooltip$.stop.fadeIn(0);
      gHoveredPoint = object;
    }

    function _handleMouseOverEvent(object, d){
      _showTooltip(object, d);
    }

    _init(pRegionId, pOptions);
  };
})(apex.util, apex.server, apex.jQuery, d3);
