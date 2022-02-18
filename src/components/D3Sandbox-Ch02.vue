<template>
  <div class="component d3-sandbox">
    <svg ref="stage" :width="width" :height="height"></svg>
    <p>
      <button @click="addNewData(false)">Add Random Points</button>
      <button @click="addNewData(true)">Add Drunkard's Walk Points</button>
      <button @click="removeData">Remove Random Points</button>
    </p>
    <p>
      <button @click="autoDrunkardsWalk" :disabled="timerRunning">Start Drunkard's Walk</button>
      <button @click="autoDrunkardsWalk(false)" :disabled="!timerRunning">Stop Drunkard's Walk
      </button>
    </p>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: "D3SandboxCh02",
  data: function () {
    return {
      width: 480,
      height: 320,
      inset: 30,
      colors: ['darkorange', 'dodgerblue', 'firebrick', 'mediumseagreen', 'violet', 'yellow', 'indigo'],
      minPoints: 4,
      maxPoints: 20,
      stage: undefined,
      g: undefined,
      multipleData: undefined,
      points: new Map(),
      axes: undefined,
      timerPeriod: Math.round(1000 / 12),
      walkTimer: undefined,
      timerRunning: false
    }
  },
  mounted() {
    this.stage = this.$refs.stage;
    this.g = d3.select(this.stage);
    this.loadDemo2Data()
        .then(() => {
          this.plot();
        })
  },
  methods: {
    addNewData(walk = false) {
      walk ?
          this.appendDrunkardsWalkPoints(this.multipleData) :
          this.appendRandomPoints(this.multipleData);
      this.eraseAllLines(this.points);
      this.plot();
    },
    appendDrunkardsWalkPoints(data) {
      const maxXIncrement = 1.0, maxYVariation = 0.25;
      const newX = parseFloat((data[data.length - 1].x + Math.random() * maxXIncrement).toFixed(2));
      const newPoint = {x: newX};
      const lastPoint = data[data.length - 1];
      const keys = Array.from(Object.keys(lastPoint)).filter(el => el !== 'x');
      keys.forEach(k => {
        const multiplier = Math.random() * maxYVariation * 2 + (1 - maxYVariation);
        newPoint[k] = lastPoint[k] * multiplier;
      })
      data.push(newPoint);
      if (data.length > this.maxPoints) data.shift();

    },
    autoDrunkardsWalk(run = true) {
      if (run) {
        this.timerRunning = true;
        this.addNewData(true);
        this.walkTimer = setInterval(() =>
                this.addNewData(true)
            , this.timerPeriod)
      } else {
        clearInterval(this.walkTimer);
        this.timerRunning = false;
      }
    },
    appendRandomPoints(data) {
      const maxXIncrement = 1.0;
      const newX = parseFloat((data[data.length - 1].x + Math.random() * maxXIncrement).toFixed(2));
      const newPoint = {x: newX};
      Object.keys(data[0]).filter(k => k !== 'x')
          .reduce((acc, k) => {
            acc.set(k, d3.extent(data, d => d[k]));
            return acc;
          }, new Map())
          .forEach((val, key) => {
            newPoint[key] = parseFloat((Math.random() * (val[1] - val[0]) + val[0]).toFixed(3));
          });
      data.push(newPoint);
      if (data.length > this.maxPoints) data.shift();
    },
    removeData() {
      this.removeRandomPoints(this.multipleData);
      this.eraseAllLines(this.points);
      this.plot()
    },
    removeRandomPoints(data) {
      if (data.length > this.minPoints) {
        data.splice(Math.floor(Math.random() * data.length), 1);
      }
    },
    loadDemo2Data() {
      return d3.tsv("data/examples-multiple.tsv")
          .then(data => {
            this.multipleData = data.map(d => {
              for (let p in d) {
                d[p] = parseFloat(d[p])
              }
              return d;
            });
            return true;
          })
    },
    groupKey(fieldName, type) {
      return `${type === undefined ? 'ds' : type}_${fieldName}`;
    },
    plot() {
      const axisGroup = this.axes || (() => {
        this.axes = this.g.append('g').attr('id', 'axes');
        return this.axes;
      })();
      axisGroup.selectAll('g').remove();
      const scaleFunctions = this.createAllScaleFunctions(this.multipleData, this.width, this.height, this.inset);
      this.extractFieldNames(this.multipleData).filter(el => el !== 'x').forEach((fieldName, index) => {
        const groupKey = this.groupKey(fieldName);
        const group = this.points.get(groupKey) || this.points.set(groupKey,
            this.g.append('g').attr('id', `ds_${fieldName}`)).get(groupKey);

        const color = this.colors[index % this.colors.length];
        const yScale = scaleFunctions[index + 1];
        this.drawLines(group,
            color,
            scaleFunctions[0],
            yScale,
            fieldName);
        this.drawPoints(
            group,
            this.multipleData,
            this.createDrawFunctions(color, scaleFunctions[0], yScale, fieldName));
        if (index < 2) {
          const axisFn = index % 2 === 0 ? d3.axisLeft : d3.axisRight;
          let axMkr = axisFn(scaleFunctions[index + 1]);
          if (index % 2 === 0) {
            axisGroup.append('g')
                .attr('transform', `translate(${this.width},0)`)
                .call(axMkr);
          } else {
            axMkr(axisGroup.append('g'));
          }
        }
      });
      axisGroup.append('g').call(d3.axisTop(scaleFunctions[0]))
          .attr('transform', `translate(0,${this.height})`);
    },
    extractFieldNames(data) {
      // only works if the data consists of an array of objects with the same field names
      // proceed incautiously on purpose, so that errors are thrown here if the data doesn't comply
      return Array.from(Object.keys(data[0]));
    },
    createAllScaleFunctions(data, width, height, inset) {
      const fieldNames = this.extractFieldNames(this.multipleData)
      let rangeMax = width, invert = false;
      return fieldNames.map(field => {
        const sc = this.createScaleFunction(data, field, [0, rangeMax], inset, invert);
        rangeMax = height;
        invert = true;
        return sc;
      });
    },
    createScaleFunction(domain, fieldName, [rMin, rMax], inset = 0, invert = false) {
      const range = invert ? [rMax - inset, rMin + inset] : [rMin + inset, rMax - inset]
      return d3.scaleLinear()
          .domain(d3.extent(domain, d => d[fieldName]))
          .range(range).nice();
    },
    drawPoints(g, data, {enter: enterFunction, update: updateFunction}) {
      return g
          .selectAll('circle')
          .data(data)
          .join(enterFunction,
              !!updateFunction ? updateFunction : update => update.attr('fill', 'lime'),
              exit => exit.remove()
          );
    },
    createDrawFunctions(fill, scX, scY, yPropName) {
      const updateAttrs = sel => sel.attr('r', 5)
          .attr('fill', fill)
          .attr('cx', d => scX(d.x))
          .attr('cy', d => scY(d[yPropName]))
      return {
        enter: sel => updateAttrs(sel.append('circle')),
        update: sel => updateAttrs(sel)
      }
    },
    eraseLines(target) {
      target.selectAll('path').remove();
    },
    eraseAllLines(targets) {
      targets.forEach(this.eraseLines);
    },
    drawLines(target, stroke, scX, scY, yPropName) {
      const lineMaker = d3.line()
          .x(d => scX(d.x))
          .y(d => scY(d[yPropName]));

      target
          .append('path')
          .attr('fill', 'none')
          .attr('stroke', stroke)
          .attr('d', lineMaker(this.multipleData))

    }
  }
}
</script>

<style scoped>

</style>
