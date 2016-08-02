(function( util, server, $, d3 ) {
  var width = 1122, height = 700, padding = 100
      LEGEND_COLUMN_WIDTH = 300;

  templcate_function = function(pRegionId, pAjaxId, pOptions){
    function _init(){
      gRegion$ = $('#' + util.escapeCSS(pRegionId) + '_region', apex.gPageContext$);
      gChart$ = $('#' + util.escapeCSS(pOptions.chartRegionId) + '_chart', apex.gPageContext$);

      svg = d3.select(gChart$.get(0))
              .append("svg")
              .attr("width", width)
              .attr("height", height);

      gRegion$.on("apexrefresh", _refresh)
              .trigger("apexrefresh");
    }

    function _draw(jsonData){
    }

    function _refresh() {
      if(isDevelopmentMode) {
        _draw(document.sampleJSON);
      } else {
        apex.server.plugin(pAjaxId, { pageItems: null },
                                    { success: _draw, dataType: "json" });
      }
    }
  }
})(apex.util, apex.server, apex.jQuery, d3);
