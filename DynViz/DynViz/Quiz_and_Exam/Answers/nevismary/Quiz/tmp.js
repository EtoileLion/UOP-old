//'use strict';
// Be sure to mention eslint --global d3,_ clean_viz.js

var parm = {
  neighborhood: {
    tag: "#neighborhood", name: "CA Name", text: "Chicago Neighborhoods"
  },
  income: {
    tag: "#income", name: "Area Per Capita Income", text: "Per Capita Income"
  },
  unemployed: {
    tag: "#unemployed", name: "Area Prop Age>16 Unemployed",
    text: "Prop. Unemployed"
  },
  poverty: {
    tag: "#poverty", name: "Area Prop Households Below Poverty",
    text: "Prop. in Poverty"
  },
  hardship: {
    tag: "#hardship", name: "Hardship Index", text: "Hardship Indx"
  },
  arrests: {
    tag: "#arrests", name: "Arrests", text: "# Arrests (out of 10)"
  }
}
var dim = {
  margin: { top: 40, right: 0, bottom: 40, left: 60 },
  padding: { top: 40 },
  tooltip: {width: 100, height: 150, horiz_ratio: 0.4, vert_ratio: 0.6},
  legend: {width: 300, height: 80},
  size_range: [10, 20, 50], // midpoint is used to decide whether to push to back.
  line_height: 40,
  transition: 600,
  delay: 20,
  hover: { stroke_width: 3, stroke: 'red', opacity: 1 },
  normal: { stroke_width: 1, stroke: 'black', opacity: 0.5 },
  clicked: { stroke_width: 6, stroke: 'purple', opacity: 0.9 }
};
dim.width = 700 - dim.margin.left - dim.margin.right;
dim.height = 500 - dim.margin.top - dim.margin.bottom;
dim.tooltip.horiz_bump = 0.25 * dim.width;
dim.tooltip.vert_bump = 0.3 * (dim.height - dim.tooltip.height);

// Make sure all bubbles are visible.
dim.padding.left = dim.size_range[2]
dim.padding.right = dim.size_range[2]
dim.padding.top = dim.padding.top + dim.size_range[2]
dim.padding.bottom = dim.size_range[2]

// This method below is nice & simple, but does not guarantee a match
// with the initial state set by the HTML page, so I commented it out.
/*
var clicked = {
  x: parm.income,
  y: parm.poverty,
  size: parm.hardship,
  color: parm.income,
};
*/

// This method is overly obtuse, but does guarantee a match with the
// HTML page's initial state.
var clicked = {
  x: parm[d3.select("div#x_controls")
            .selectAll("button.clicked").attr("id")],
  y: parm[d3.select("div#y_controls")
            .selectAll("button.clicked").attr("id")],
  size: parm[d3.select("div#size_controls")
               .selectAll("button.clicked").attr("id")],
  color: parm[d3.select("div#color_controls")
                .selectAll("button.clicked").attr("id")]
};

var xScale = d3.scaleLinear()
               .range([dim.padding.left, dim.width - dim.padding.right]);
var yScale = d3.scaleLinear()
               .range([dim.height - dim.padding.bottom - dim.legend.height, dim.padding.top]);
var sizeScale = d3.scaleLinear()
                  .range([dim.size_range[0], dim.size_range[2]]);
// Below 9 levels are chosen b/c the smallest discrete differences we have are
// for the arrests, which range from 0 - 8.
var colorScale = d3.scaleQuantize()
                   .range(colorbrewer['RdYlBu']['9']);

var xAxis = d3.axisBottom(xScale);
var yAxis = d3.axisLeft(yScale);

var legend = d3.svgLegend().unitLabel("");

var svg = d3.select("div#viz").append("svg")
            .attr("width", dim.width + dim.margin.left + dim.margin.right)
            .attr("height", dim.height + dim.margin.top + dim.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + dim.margin.left + ","
              + dim.margin.top + ")");

svg.append("text")
   .classed("title", true)
   .attr("id", "title1")
   .attr("x", dim.width / 2)
   .attr("y", 0);
svg.append("text")
   .classed("title", true)
   .attr("id", "title2")
   .attr("x", dim.width / 2)
   .attr("y", dim.line_height);


/**
 * Generate a pop-up text window with further neighborhood information.
 * @function performBarplot
 * @param {Object[]} locale_data The Chicago neighborhood data.
 * @param {Object[]} nested_crime Chicago crime data, nested by neighborhood.
 */
var showDetails = function(that) {
  var xPos = parseFloat(d3.select(that).attr("cx"));
  var yPos = parseFloat(d3.select(that).attr("cy"));
  var datum = that.__data__

  if (xPos > dim.tooltip.horiz_ratio * dim.width) {
    xPos = xPos - dim.tooltip.horiz_bump;
  } else {
    xPos = xPos + dim.tooltip.horiz_bump;
  }
  xPos = xPos - dim.tooltip.width / 2;

  if (yPos > dim.tooltip.vert_ratio * (dim.height - dim.tooltip.height)) {
    yPos = yPos - dim.tooltip.vert_bump;
  } else {
    yPos = yPos + dim.tooltip.vert_bump;
  }
  yPos = yPos + dim.tooltip.height / 2;

  d3.select("#tooltip")
    .style("left", xPos + "px")
    .style("top", yPos + "px");

  d3.select(parm.neighborhood.tag).text(datum[parm.neighborhood.name]);
  d3.select(parm.income.tag)
    .text(av.roundPretty(datum[parm.income.name], 2).toLocaleString());
  d3.select(parm.unemployed.tag)
    .text(+(datum[parm.unemployed.name] * 100).toFixed(1));
  d3.select(parm.poverty.tag)
    .text(+(datum[parm.poverty.name] * 100).toFixed(1));
  d3.select(parm.hardship.tag).text(datum[parm.hardship.name]);
  d3.select(parm.arrests.tag).text(datum[parm.arrests.name]);
};

var updatePoints = function(data, points, clicked) {
  xScale.domain([0, d3.max(data, function(elem) {
          return elem[clicked.x.name];
         })]);
  yScale.domain([0, d3.max(data, function(elem) {
           return elem[clicked.y.name];
         })]);
  sizeScale.domain([0, d3.max(data, function(elem) {
           return elem[clicked.size.name];
         })]);
  colorScale.domain([0, d3.max(data, function(elem) {
           return elem[clicked.color.name];
         })]);

  svg.select("#xAxis")
     .transition("updating")
     .duration(dim.transition)
     .call(xAxis);
  svg.select("#xLabel")
     .transition("updating")
     .duration(dim.transition)
     .text(clicked.x.text);

  svg.select("#yAxis")
     .transition("updating")
     .duration(dim.transition)
     .call(yAxis);
  svg.select("#yLabel")
     .transition("updating")
     .duration(dim.transition)
     .text(clicked.y.text);

  svg.select("#legend").remove();

  svg.append("g")
     .attr("transform", "translate(0, " + (dim.height - dim.padding.bottom) + ")")
     .attr("id", "legend")

  svg.select("#legend")
     .call(legend.scale(colorScale).title(clicked.color.text).formatter(colorScale.tickFormat()))

  points.transition("updating")
        .duration(dim.transition)
        .delay(function(d, idx) { return idx * dim.delay; })
        .attr('cx', function(elem) {
           return xScale(elem[clicked.x.name]);
         })
        .attr('cy', function(elem) {
           return yScale(elem[clicked.y.name]);
         })
        .attr('r', function(elem) {
           return sizeScale(elem[clicked.size.name]);
         })
        .style('fill', function(elem) {
           return colorScale(elem[clicked.color.name]);
         })
        .text(function(elem) {
           return clicked.y.text + ": " + elem[clicked.y.name];
         });

  svg.select("#title1")
     .transition("updating")
     .duration(dim.transition)
     .text(parm.neighborhood.text + "; " + clicked.y.text);
  svg.select("#title2")
     .transition("updating")
     .duration(dim.transition)
     .text("by " + clicked.x.text);

};



/**
 * Generate a Bar Plot on the browser page (no return value).
 * @function performBarplot
 * @param {Object[]} locale_data The Chicago neighborhood data.
 * @param {Object[]} nested_crime Chicago crime data, nested by neighborhood.
 */

/** The equivalent to 'main', the main code launch for our program. */
d3.json("../data/mini_Chicago_crime_records.json",
        function(error, raw_data) {
  if (error) {
    console.log(error);
  } else {
    // Capture Data
    var data = od.organizeData(raw_data);

    svg.append("g").attr("id", "xAxis").classed("axis", true)
       .attr('transform', 'translate(0,' + (dim.height - dim.legend.height)
          + ')')
    svg.append("text").attr("id", "xLabel").classed("axis", true)
       .attr("text-anchor", "middle")
       .attr("x", dim.width / 2)
       .attr("y", (dim.height - dim.legend.height + dim.line_height));

    svg.append("g").attr("id", "yAxis").classed("axis", true);
    svg.append("text").attr("id", "yLabel").classed("axis", true)
       .attr("text-anchor", "middle")
       .attr("transform", "translate(" + (dim.line_height / 2) + ","
          + ((dim.height - dim.padding.bottom - dim.legend.height) / 2)
          + ")rotate(-90)");

    svg.append("text")
       .classed("title", true)
       .classed("title_dim", true)
       .attr("x", dim.width / 2)
       .attr("y", 0);
    var points = svg.selectAll('circle').data(data)
                    .enter().append('circle').classed('point', true)
                    .style('stroke-width', dim.normal.stroke_width)
                    .style('stroke', dim.normal.stroke)
                    .style('fill-opacity', dim.normal.opacity);
    updatePoints(data, points, clicked);

    points.on("mouseover", function(elem) {
             d3.select(this).moveToFront()
               .style('stroke-width', dim.hover.stroke_width)
               .transition("focusing")
               .duration(dim.transition)
               .style('stroke', dim.hover.stroke)
               .style('fill-opacity', dim.hover.opacity);
           })
          .on("mouseout", function(elem) {
             if (d3.select(this).classed("clicked")) {
               d3.select(this)
                 .style('stroke-width', dim.clicked.stroke_width)
                 .transition("unfocusing").duration(dim.transition)
                 .style('stroke', dim.clicked.stroke)
                 .style('fill-opacity', dim.clicked.opacity);
             } else {
               d3.select(this).moveToBack()
                 .style('stroke-width', dim.normal.stroke_width)
                 .transition("unfocusing").duration(dim.transition)
                 .style('stroke', dim.normal.stroke)
                 .style('fill-opacity', dim.normal.opacity);
             }
           })
          .on("click", function() {
             // Since we want to toggle to the opposite, "show_details"
             // is set to the current hidden level.
             var show_details = d3.select("#tooltip").classed("hidden");
             var that = this;
             console.log(that.__data__);
             points.classed("clicked", false)
                   .style('stroke-width', dim.normal.stroke_width)
                   .style('stroke', dim.normal.stroke)
                   .style('fill-opacity', dim.normal.opacity);
             if (show_details) {
               showDetails(that);
               d3.select(that).moveToFront().classed("clicked", true)
                              .style("stroke-width", dim.clicked.stroke_width)
                              .style('stroke', dim.clicked.stroke)
                              .style('fill-opacity', dim.clicked.opacity);
             } else {
               d3.select(this).moveToBack();
             }
             d3.select("#tooltip").classed("hidden", !show_details);
           })
          .append("title")
          .text(function(elem) {
             if (elem[parm.arrests.name] === 0) {
               return elem[parm.neighborhood.name] + ":  No Arrests";
             } else if (elem[parm.arrests.name] === 1) {
               return elem[parm.neighborhood.name] + ":  1 Arrest";
             } else {
               return elem[parm.neighborhood.name] + ":  "
                 + elem[parm.arrests.name] + " Arrests";
             }
           });

    d3.select("div#x_controls").selectAll("button")
      .on("click", function() {
         d3.select("div#x_controls").selectAll("button")
           .classed("clicked", false);
         d3.select(this).classed("clicked", true);
         clicked.x = _.find(parm, {'tag': '#' + this.id});
         updatePoints(data, points, clicked);
       });
    d3.select("div#y_controls").selectAll("button")
      .on("click", function() {
         d3.select("div#y_controls").selectAll("button")
           .classed("clicked", false);
         d3.select(this).classed("clicked", true);
         clicked.y = _.find(parm, {'tag': '#' + this.id});
         updatePoints(data, points, clicked);
       });
    d3.select("div#size_controls").selectAll("button")
      .on("click", function() {
         d3.select("div#size_controls").selectAll("button")
           .classed("clicked", false);
         d3.select(this).classed("clicked", true);
         clicked.size = _.find(parm, {'tag': '#' + this.id});
         updatePoints(data, points, clicked);
       });
    d3.select("div#color_controls").selectAll("button")
      .on("click", function() {
         d3.select("div#color_controls").selectAll("button")
           .classed("clicked", false);
         d3.select(this).classed("clicked", true);
         clicked.color = _.find(parm, {'tag': '#' + this.id});
         updatePoints(data, points, clicked);
       });

  }
});
