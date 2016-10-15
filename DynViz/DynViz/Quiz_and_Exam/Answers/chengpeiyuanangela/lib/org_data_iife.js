//'use strict';
// Be sure to mention eslint --global d3,_ clean_viz.js

od = function() {
  var od = {};

  /**
   * @typedef LocaleCrime
   * @type Object
   * @property {Object} locale_data The neighborhood data
   * @property {Object} nested_crime The crime data, nested by neighborhood
   */

  /**
   * Generate a Bar Plot on the browser page (no return value).
   * @function orgdata
   * @param {Object[]} incoming_data Chicago Crime data, read from d3.json
   * @returns {LocaleCrime}
   *          Object with neighborhood and nested crime data properly organized.
   */
  od.nestSummarize = function(raw_data, nest_lvl, sum_lvl, sum_label,
                              attribs) {
    // Capture data elements for summarizing arrests.
    // (Note:  Crime *type* is ignored for now, but kept "just in case".)
    var nest_raw = _.map(raw_data, function(elem) {
          return _.pick(elem, nest_lvl, sum_lvl, attribs);
        });

    // Create the nested structure for summarizing arrests.
    var nested_data = d3.nest().key(function(elem) {
          return elem['CA Name'];
        })
        .entries(nest_raw);

    // Summarize arrests.
    nested_data.forEach(function(elem) {
      elem[sum_label] = elem.values.reduce(function(frst, scd) {
        var elem_obj = {};
        elem_obj[sum_lvl] = frst[sum_lvl] + scd[sum_lvl];
        return elem_obj;
      })[sum_lvl];
    });
    return nested_data;
  };


  /**
   * @typedef LocaleCrime
   * @type Object
   * @property {Object} locale_data The neighborhood data
   * @property {Object} nested_crime The crime data, nested by neighborhood
   */

  /**
   * Generate a Bar Plot on the browser page (no return value).
   * @function orgdata
   * @param {Object[]} incoming_data Chicago Crime data, read from d3.json
   * @returns {LocaleCrime}
   *          Object with neighborhood and nested crime data properly organized.
   */
  od.filterSummarize = function(raw_data, uniq_lvl, attribs) {
    // Capture neighborhood data elements.
    var locale_data = _.map(raw_data, function(elem) {
          return _.pick(elem, uniq_lvl, attribs);
        });

    // Remove duplicate elements.
    locale_data = _.uniqBy(locale_data, function (elem) {
      return elem[uniq_lvl];
    });

    return locale_data;
  };


  /**
   * @typedef LocaleCrime
   * @type Object
   * @property {Object} locale_data The neighborhood data
   * @property {Object} nested_crime The crime data, nested by neighborhood
   */

  /**
   * Generate a Bar Plot on the browser page (no return value).
   * @function orgdata
   * @param {Object[]} incoming_data Chicago Crime data, read from d3.json
   * @returns {LocaleCrime}
   *          Object with neighborhood and nested crime data properly organized.
   */
  od.organizeData = function(incoming_data, nest_lvl = 'CA Name',
                             sum_lvl = 'Arrest', sum_label = 'Arrests',
                             sum_attribs = ['Primary Type'],
                             filter_lvl = 'CA Name',
                             filter_attribs = ['Primary Type',
                                        'Area Per Capita Income',
                                        'Area Prop Age>16 Unemployed',
                                        'Area Prop Households Below Poverty',
                                        'Hardship Index']) {
    // Filter out elements without a neighborhood.
    incoming_data.forEach(function(elem) {
      if (elem[nest_lvl] === null) {
        elem[nest_lvl] = "unknown";
      }
    });
    var nested_data = od.nestSummarize(incoming_data, nest_lvl, sum_lvl,
                                    sum_label, sum_attribs);
    var filtered_data = od.filterSummarize(incoming_data, filter_lvl,
                                        filter_attribs);
    // Merge the nested and filtered data.
    filtered_data.forEach(function(filtered_elem) {
      var nested_obj = nested_data.find(function(nested_elem) {
        return nested_elem.key === filtered_elem[filter_lvl];
      });
      filtered_elem[sum_label] = nested_obj[sum_label];
    });

    return filtered_data;
  };

  return od;
}();
