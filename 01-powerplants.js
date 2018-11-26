(function() {
  let margin = { top: 10, left: 100, right: 10, bottom: 150 }

  let height = 500 - margin.top - margin.bottom
  let width = 730 - margin.left - margin.right

  let svg = d3.select('#powerplants')
    .append('svg')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  let projection = d3.geoAlbersUsa()
  var colorScale = d3
    .scaleOrdinal()
    .range([
      '#ec913f',
      '#99979a',
      '#c1619c',
      '#2a83c2',
      '#de473a',
      '#51a74c',
      '#d7c54f',
      '#fdeed7'
    ])

  let radiusScale = d3
    .scaleSqrt()
    .domain([0, 5000])
    .range([0, 10])

  let xPositionScale = d3.scaleLinear().domain([0, 500000]).range([0, width])
  let yPositionScale = d3.scaleBand().range([0, height]).padding(0.2)

  let path = d3.geoPath().projection(projection)

  Promise.all([
    d3.json('data/us_states.topojson'),
    d3.csv('data/powerplants.csv')
  ])
    .then(ready)
    .catch(err => console.log('Failed on', err))

  function ready([json, datapoints]) {
    datapoints = datapoints.slice(0, 500)
    let states = topojson.feature(json, json.objects.us_states)

    projection.fitSize([width, height], states)

    var mapGroup = svg.append('g').attr('id', 'map')

    mapGroup
      .append('g')
      .selectAll('.state')
      .data(states.features)
      .enter()
      .append('path')
      .attr('class', 'state')
      .attr('d', path)
      .attr('fill', '#e1e1e1')

    mapGroup
      .append('g')
      .selectAll('.powerplant')
      .data(datapoints)
      .enter()
      .append('circle')
      .attr('class', 'powerplant')
      .attr('r', d => radiusScale(d.Total_MW))
      .attr('transform', d => {
        let coords = projection([d.Longitude, d.Latitude])
        return `translate(${coords})`
      })
      .attr('fill', d => colorScale(d.PrimSource))
      .attr('opacity', 0.5)

    // Group them together by the 'PrimSource' column
    // then add up the 'Total_MW' column for each group
    var nested = d3.nest()
      .key(d => d.PrimSource)
      .rollup(values => d3.sum(values, d => d.Total_MW))
      .entries(datapoints)

    var barsGroup = svg.append('g').attr('id', 'bars')

    console.log(nested)

    // Pull out the list of power sources
    var names = nested.map(d => d.key)
    console.log(names)

    yPositionScale.domain(names)

    // YOUR MISSION:
    // Make a bunch of bars (one for each group) 
    // that sized by the amount of power
    // and colored according to the type of energy
    barsGroup.selectAll('.bar')
      .data(nested)
      .enter().append('rect')
      .attr('class', d => {
        // give 'coal' a class of 'coal'
        // give 'nuclear power' a class of 'nuclear-power'
        return d.key.replace(" ", "-")
      })
      .classed('bar', true)
      .attr('x', 0)
      .attr('y', d => yPositionScale(d.key))
      .attr('width', 0)
      .attr('height', yPositionScale.bandwidth())
      .attr('fill', d => colorScale(d.key))

    d3.select("#draw-map").on('click', () => {

    })

    d3.select("#draw-bars-1").on('click', () => {
      console.log("I was clicked")

      // Move the powerplants to where the bars start
      svg.selectAll('.powerplant')
        .transition()
        .duration(1000)
        .attr('transform', d => {
          var yPosition = yPositionScale(d.PrimSource) + yPositionScale.bandwidth() / 2
          return `translate(0,${yPosition})`
        })
        .transition()
        .attr('opacity', 0)

      // Show the bars
      barsGroup
        .transition()
        .duration(1500)
        .style('opacity', '1')

      // Grow the bars
      svg.selectAll('.bar')
        .transition()
        .delay(1000) // delay until the dots are in place
        .duration(1500)
        .attr('width', d => xPositionScale(d.value))

      // Hide the map
      // mapGroup
      //   .transition()
      //   .duration(1500)
      //   .style('opacity', '0')
    })

    d3.select("#draw-bars-15").on('click', () => {
      console.log("I was clicked")

      // Move the powerplants to where the bars start
      svg.selectAll('.powerplant')
        .transition()
        .duration(d => Math.random() * 5000 + 500)
        .attr('transform', d => {
          var yPosition = yPositionScale(d.PrimSource) + yPositionScale.bandwidth() / 2
          return `translate(0,${yPosition})`
        })
        .on('end', function(d) {
          console.log("This transition finished")
          console.log(d.PrimSource, d.Total_MW)

          // Find the coal bar, or the nuclear bar, etc
          // and get its current width
          var klass = d.PrimSource.replace(" ", "-")
          var currentWidth = +svg.select("." + klass).attr('width')

          // new width is old width + this powerplant's output
          var newWidth = currentWidth + xPositionScale(d.Total_MW)

          // now update that bar
          svg.select("." + klass).attr('width', newWidth)
        })

      // Show the bars
      barsGroup
        .transition()
        .duration(1500)
        .style('opacity', '1')
    })

    d3.select("#draw-bars-2").on('click', () => {
      var coal = datapoints.filter(d => d.PrimSource === 'coal')

      var names = coal.map(d => d.Plant_Name)

      // Give me everything about the coal bar
      var coalYPosition = yPositionScale('coal')
      var coalHeight = yPositionScale.bandwidth()
      var coalWidth = xPositionScale(36005.8)

      yPositionScale.domain(names)

      var tinyScale = d3.scaleBand()
      .domain(names)
      .range([coalYPosition,coalYPosition + coalHeight])
      
      svg.selectAll('.bar')
        .filter(d => d.key !== 'coal')
        .transition()
        .duration(1000)
        .attr('width', 0)

      xPositionScale.domain([0, 7500])

      svg.selectAll('.plantBar')
        .data(coal)
        .enter().append('rect')
        .classed('plantBar', true)
        .attr('width', coalWidth)
        .attr('y', coalYPosition)
        .attr('height', coalHeight)
        .transition()
        .duration(1000)
        .attr('width', d => xPositionScale(d.Total_MW))
        .attr('x', 0)
        .attr('height', yPositionScale.bandwidth())
        .attr('y', d => yPositionScale(d.Plant_Name))
        .attr('fill', colorScale('coal'))

      svg.selectAll('.bar')
        .transition()
        .delay(250)
        .attr('width', 0)

      // Find the y axis on the page
      // and update it with the new y axis
      svg.select('.y-axis')
        .transition()
        .call(yAxis)

      svg.select('.x-axis')
        .transition()
        .call(xAxis)
    })

    d3.select("#draw-scatter").on('click', () => {

    })
  
    const xAxis = d3.axisBottom(xPositionScale)
    barsGroup
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    const yAxis = d3.axisLeft(yPositionScale)
    barsGroup
      .append('g')
      .attr('class', 'axis y-axis')
      .call(yAxis)

    barsGroup.style('opacity', '0')
  }
})()
