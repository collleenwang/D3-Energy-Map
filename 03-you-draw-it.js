(function() {
  function clamp(a, b, c){ return Math.max(a, Math.min(b, c)) }

  var margin = { left: 50, right: 50, top: 30, bottom: 30 }
  var height = 400 - margin.top - margin.bottom
  var width = 400 - margin.left - margin.right

  // Add our SVG normally
  var svg = d3.select('#you-draw-it')
    .append('svg')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Scales obvs
  var xPositionScale = d3.scaleLinear().domain([2001, 2015]).range([0, width])
  var yPositionScale = d3.scaleLinear().domain([0, 100]).range([height, 0])

  // This will be the filled-in part
  var area = d3.area()
    .x(d => xPositionScale(d.year))
    .y(d => yPositionScale(d.debt))
    .y1(height)

  // This will be the top of the filled-in part
  var line = d3.line()
    .x(d => xPositionScale(d.year))
    .y(d => yPositionScale(d.debt))

  // This is the line where we guess
  // .defined is "don't draw a line here until this has a value"

  // This is used to hide the initially-hidden part of the complete graph
  // var clipper = svg
  //   .append('clipPath')
  //   .attr('id', 'clip')
  //   .append('rect')
  //   .attr('width', xPositionScale(2008) - 2)
  //   .attr('height', height)

  Promise.all([
    d3.csv("data/data.csv")
  ]).then(ready)

  function ready([datapoints]) {
    // This group is the full graph
    // we clip everything after 2008
    svg.append('g')
      .attr('id', 'hidden')
      // .attr('clip-path', 'url(#clip)')

    svg.select('#hidden')
      .append('path')
      .attr('class', 'area')
      .attr('d', area(datapoints))
      .attr('fill', '#f2f2f2')

    svg.select('#hidden')
      .append('path')
      .attr('class', 'line')
      .attr('d', line(datapoints))
      .attr('stroke', 'red')
      .attr('stroke-width', 5)
      .attr('fill', 'none')

    // This is our line!
    svg.append('path')
      .attr('class', 'your-line')

    // We make a new dataset from the original dataset
    // the differences are that it's only 2008 and later
    // and is it has a "guess" column
    // yourData = datapoints
    //   .sort((a, b) => a.year - b.year)
    //   .filter(d => d.year >= 2008)
    //   .map(d => { 
    //     return {
    //       year: d.year,
    //       debt: d.debt,
    //       guess: null
    //     }
    //   })

    // 2008 is where the 'original' data ends, so we need
    // to make sure our line starts at the right spot
    // (they'll be guessing starting 2009)
    // yourData[0].guess = yourData[0].debt

    var completed = false

    // This function is run whenever there is a drag or a click
    function selected() {
      console.log('You are dragging')
    }

    var drag = d3.drag()
      .on('drag', selected)

    var xAxis = d3.axisBottom(xPositionScale)
      .ticks(4).tickFormat(d => d)

    svg
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    var yAxis = d3.axisLeft(yPositionScale)
      .ticks(5).tickFormat(d => d + '%')
    svg
      .append('g')
      .attr('class', 'axis y-axis')
      .call(yAxis)
  }
})()