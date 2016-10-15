'use strict';

// First we'll set up some scales, at least the pixel side of things.
var xScale = d3.scaleBand().range([10, 530]).padding(0.2);
var yScale = d3.scaleLog().range([560, 50]);
// The "tickFormat" method makes the numbers on the axis look more reasonable.
var yAxis = d3.axisLeft(yScale)
              .tickFormat(d3.format(".1r"));

// Provide a pointer to our SVG DOM element (technically the "g" inside it).
var svg = d3.select("#viz").attr("width", 600).attr("height", 600)
            .append("g").attr("transform", "translate(50,20)");

// Provide a plot title.
svg.append("text").classed("title", true)
   .attr("x", 350).attr("y", 10)
   .text("Number of Events");
svg.append("text").classed("title", true)
   .attr("x", 350).attr("y", 40)
   .text("broken down by Category");

// Provide a placeholder for the axis.
svg.append("g").attr("id", "axis");


// This function will take incoming fairly raw JSON data and clean it up.
var cleanData = function(incoming_data) {
      // Pick out only these handful of attributes of the event.
      incoming_data = _.map(incoming_data, function(elem) {
        return _.pick(elem, 'subcategory', 'event_name', 'event_url', 'free',
                      'kid_friendly', 'venue_name', 'web_description');
      });
      // Ensure that each event has a "category".
      incoming_data.forEach(function(elem) {
        if (elem.subcategory === undefined | elem.subcategory === null) {
          elem.subcategory = 'None';
        }
      });
      // Nest on the category.
      var nested_data = d3.nest().key(function(elem) {
            return elem['subcategory'];
          }).entries(incoming_data);
      // Calculate the number of events in each category.
      nested_data.forEach(function(elem) {
        elem.num_events = elem.values.length;
        elem.num_free = elem.values.reduce(function(total, first) {
          return total + first.free;
        }, 0);
        elem.num_kid_friendly = elem.values.reduce(function(total, first) {
          return total + first.kid_friendly;
        }, 0);
		//Pick a random sample description and name.
		var random = Math.floor(Math.random() * (elem.values.length));
		elem.web_description = elem.values[random].web_description;
		elem.event_name = elem.values[random].event_name;
      });
      return nested_data;
};

// I have called the main callback function from d3.json simply "main".
var main = function(error, raw_data) {
  if (error) {
    alert("We had trouble accessing the data:\n\n" + error.currentTarget
            .responseURL + "\n\n" + error.currentTarget.statusText + "!!");
  }
  // Clean up the data.
  var data = cleanData(raw_data.results);

  // Define the domain side of our scales, now that we know the data.
  xScale.domain(data.map(function(elem) {
    return elem.key;
  }));
  yScale.domain([1, d3.max(data, function(elem) {
           return elem.num_events;
         })]);

  // Now the axis can be generated.
  svg.select("#axis").call(yAxis);

  // Define our bars, the rectangles that will describe our data.
  var bars = svg.selectAll("rect").data(data).enter().append("rect")
                .classed("bar", true).attr("width", xScale.bandwidth());
  bars.attr("width", xScale.bandwidth())
      .attr("x", function(elem) {
         return xScale(elem.key);
       })
      .attr("y", function(elem) {
         return yScale(elem.num_events);
       })
      .attr("height", function(elem) {
         return 560 - yScale(elem.num_events);
       })
      // Give a mouseover event to highlight where we've placed the mouse.
      .on("mouseover", function() {
         d3.selectAll(".bar").classed("hovered", false);
         d3.selectAll(".bar").classed("unhovered", true);
         d3.select(this).classed("hovered", true);
       })
      // Now negate the mouseover.
      .on("mouseout", function() {
         d3.selectAll(".bar").classed("hovered", false);
         d3.selectAll(".bar").classed("unhovered", false);
       })
	   .on("click", changetip);

  // Provide some in-place labels for each rectangle.
  
  //And rotate them to 90 because... well those labels are long! I dont have time to code a better way to handle the long labels with short bars in 90 minutes.
  //Also the "Events" bar is only 1 item 'big', so it's essentially nonexistant and invisible. But it still works.
  var labels = svg.selectAll(".label").data(data).enter().append("text")
                  .classed("label", true);
  labels.attr("transform", function(elem) {
           return "translate(" + (xScale.bandwidth()/2 + xScale(elem.key))
             + "," + (10 + yScale(elem.num_events))
             + ") rotate(-90)";
         })
        .text(function(elem) {
           return elem.key;
         });

  // Below, this is providing an example to help show the structure of
  // the underlying data.  May be useful for your quiz work??
  // Ewww... a simple paragraph? Fine, fine...
  d3.select("body").append("p")
     .attr("id", "tooltip")
     .html("Example event: " + data[0].values[0].event_name +
              data[0].values[0].web_description);
};

//Update Tooltip
function changetip() {
	var info = "Example Event: " + d3.select(this).data()[0].event_name + " " + d3.select(this).data()[0].web_description;
	d3.select("#tooltip").html(info);
}


// And here is our trusty "d3.json" function that gets the data.
d3.json("./data/nytimes_event_listings.json", main);
