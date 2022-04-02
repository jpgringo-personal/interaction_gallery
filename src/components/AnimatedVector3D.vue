<template>
  <div class="component d3-sandbox animated-vector">
    <svg ref="frontView"
         :width="viewWidth"
         :height="viewHeight"></svg>
    <svg ref="sideView"
         :width="viewWidth"
         :height="viewHeight"></svg>
    <div class="controls">
      <p>Origin:
        <label>X: <input type="number" id="startOffsetX" v-model.number="startOffsetX"
                         :min="offsetMin" :max="offsetMax"> %</label>
        <label>Y: <input type="number" id="startOffsetY" v-model.number="startOffsetY"
                         :min="offsetMin" :max="offsetMax"> %</label>
        <label>Z: <input type="number" id="startOffsetZ" v-model.number="startOffsetZ"
                         :min="offsetMin" :max="offsetMax"> %</label>
        <button @click="testDrawOrigin">Test Origin</button>
      </p>
      <p>
        Vector:
        <label>X: <input type="text" id="startVectorX" v-model="startVectorX"></label>
        <label>Y: <input type="text" id="startVectorY" v-model="startVectorY"></label>
        <label>Z: <input type="text" id="startVectorZ" v-model="startVectorZ"></label>
        <label>velocity: <input type="text" id="velocity" v-model="velocity"></label>
      </p>
      <p style="display: flex; flex-direction: row; flex-wrap: nowrap">
        <label style="flex: 0 0 8em">Trail Length</label>
        <simple-slider style="flex: 1 1 75%"
                       :min="minTrailLength" :max="maxTrailLength"
                       :current-value="trailLength"
                       @valueUpdated="updateTrailLength"></simple-slider>
      </p>
      <p style="border-top:solid 1px silver; border-bottom:solid 1px silver;padding:0.5em 0">
        <button @click="step">Step</button>
      </p>
      <p>
        <button @click="startAnimation(startingVector)">Start</button>
        <button @click="stopAnimation">Stop</button>
        <button @click="clearStages">Clear</button>
      </p>
      <p>
        <button @click="testCollisionSet">Test</button>
        <button @click="setBgColor">Test Color</button>
      </p>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import SimpleSlider from "@/components/SimpleSlider";

function permuteNormals(_rect, _dimensions) {
  // TODO: figure out how to make this work in n dimensions
  return [[0, 1], [1, 0], [0, -1], [-1, 0]];

}

// TODO: figure out how to make this work in n dimensions
function calculateEdges(rect) {
  return permuteNormals(rect, 2).map(n => {
    const value = (n[0] < 0 ? rect.x + rect.w :
            n[0] > 0 ? rect.x : 0)
        + (n[1] < 0 ? rect.y + rect.h :
            n[1] > 0 ? rect.y : 0);
    return {value: value, normal: n};
  });
}

const devBoxColors = ['magenta', 'lime', 'orange', 'cyan', 'yellow', 'violet'];
const devLineColors = ['goldenrod', 'magenta', 'lime'];

export default {
  name: "AnimatedVector",
  components: {
    SimpleSlider
  },
  data: function () {
    return {
      // sequence variables
      timer: undefined,
      inProgress: false,
      // display variables
      viewWidth: 320,
      viewHeight: 320,
      inset: 30,
      lineColor: 'dodgerblue',
      lineWidth: 2,
      views: [],
      boundingRect: undefined,
      startOffset: [0, 0, 0],
      offsetMin: -100,
      offsetMax: 100,
      minTrailLength: 10,
      maxTrailLength: 1500,
      trailLength: 1000,
      selectedColor: 'whitesmoke',
      range1Extent: [0, 360], // hue
      range1Scale: undefined,
      range2Extent: [25, 100], // saturation
      range2Scale: undefined,
      range1Value: undefined,
      range2Value: undefined,
      // model variables
      spanBounds: [],
      currentPoint: undefined,
      startingVector: [0.25, 1, -.75],
      currentVector: undefined,
      velocity: 20,
    }
  },
  computed: {
    startVectorX: {
      get() {
        return this.startingVector[0]
      },
      set(newVal) {
        updatePropertyScalar(this, this.startingVector, 0, newVal, [-100, 100])
      }
    },
    startVectorY: {
      get() {
        return this.startingVector[1]
      },
      set(newVal) {
        updatePropertyScalar(this, this.startingVector, 1, newVal, [-100, 100])
      }
    },
    startVectorZ: {
      get() {
        return this.startingVector[2]
      },
      set(newVal) {
        updatePropertyScalar(this, this.startingVector, 2, newVal, [-100, 100])
      }
    },
    startOffsetX: {
      get() {
        return this.startOffset[0]
      },
      set(newVal) {
        updatePropertyScalar(this, this.startOffset, 0, newVal, [this.offsetMin, this.offsetMax])
      }
    },
    startOffsetY: {
      get() {
        return this.startOffset[1]
      },
      set(newVal) {
        updatePropertyScalar(this, this.startOffset, 1, newVal, [this.offsetMin, this.offsetMax])
      }
    },
    startOffsetZ: {
      get() {
        return this.startOffset[2];
      },
      set(newVal) {
        updatePropertyScalar(this, this.startOffset, 2, newVal, [this.offsetMin, this.offsetMax])
      }
    },
    origin() {
      // TODO: this probably needs to be more robust, regarding dimensions and views
      return [
        this.boundingRect.x + this.boundingRect.w / 2,
        this.boundingRect.y + this.boundingRect.h / 2,
        this.boundingRect.x + this.boundingRect.w / 2,
      ]
    },
    startPoint() {
      return addVectors(this.origin, this.startOffset);
    }
  },
  mounted() {
    const br = this.boundingRect = {
      x: this.inset, y: this.inset,
      w: this.viewWidth - this.inset * 2,
      h: this.viewHeight - this.inset * 2,
    };
    // 'decorate' with edge props to facilitate efficient reflection calculation
    br.edges = calculateEdges(br);
    // TODO: find the n-dimensional generic way to do this
    // KLUDGE: obviously, this will only work for square stages :(
    const start = this.inset, end = this.inset + this.boundingRect.w;
    this.spanBounds = [[start, start, start], [end, end, end]]
    this.drawBoundingBox();
    let view = d3.select(this.$refs.frontView);
    view.dimensions = [0, 1];
    this.views.push(view);
    view = d3.select(this.$refs.sideView);
    view.dimensions = [2, 1];
    this.views.push(view);
    this.range1Scale = d3.scaleLinear().domain([this.inset, this.viewWidth - this.inset]).range(this.range1Extent);
    this.range2Scale = d3.scaleLinear().domain([this.inset, this.viewHeight - this.inset]).range(this.range2Extent.reverse());
    this.currentPoint = this.startPoint;
    this.currentVector = normalizeVector(this.startingVector);
  },
  unmounted() {
    !!this.timer && this.timer.stop();
  },
  methods: {
    drawBoundingBox() {
      const viewWidthString = `${this.viewWidth}px`;
      const allSvgs = d3.select(this.$el).selectChildren('svg');
      allSvgs.style('min-width', viewWidthString)
          .style('width', viewWidthString)
          .style('max-width', viewWidthString);
      allSvgs.append('g')
          .attr('class', 'color-bg')
          .append('rect')
          .attr('x', 0).attr('y', 0)
          .attr('width', this.viewWidth).attr('height', this.viewHeight)
          .attr('fill', this.selectedColor);
      allSvgs.append('rect')
          .attr('fill', 'white')
          .attr('stroke', 'gainsboro')
          .attr('x', this.boundingRect.x)
          .attr('y', this.boundingRect.y)
          .attr('width', this.boundingRect.w)
          .attr('height', this.boundingRect.h);
    },
    testDrawOrigin() {
      this.views.forEach(view => {
        const dims = view.dimensions;
        // const offsets =
        const origin = [this.startPoint[dims[0]], this.startPoint[dims[1]]]; //addVectors(this.origin, offsets);
        this.showLocation(view, origin)
      })
    },
    showLocation(view, coords) {
      view.append('circle')
          .attr('fill', 'orange')
          .attr('stroke', 'goldenrod')
          .attr('stroke-width', 2)
          .attr('opacity', .2)
          .attr('r', 5)
          .attr('cx', coords[0]).attr('cy', coords[1])
    },
    step() {
      console.log(`will step`);
      console.log(`current vector:`, this.currentVector.toString());
      const vector = scalarMultiplyVector(this.velocity,
          normalizeVector(!this.inProgress ? this.startingVector : this.currentVector)
      );
      console.log(`scaled vector:`, vector.toString());
      const endPoint = addVectors(
          !this.inProgress ? this.startPoint : this.currentPoint,
          vector);
      this.inProgress = true;
      if(inBounds(endPoint, this.spanBounds)) {
        this.views.forEach(view => {
          const dims = view.dimensions;
          console.log(`dims:`, dims.toString());
          const startCoords = [this.currentPoint[dims[0]], this.currentPoint[dims[1]]],
              endCoords = [endPoint[dims[0]], endPoint[dims[1]]];
          this.drawSegment(view, startCoords, endCoords)
        })
        this.currentPoint = endPoint;
        this.currentVector = vector;
      } else {
        console.error(`OUT OF BOUNDS...`, vector);
        getReflectionSegments(this.currentPoint, vector, this.spanBounds);
        // TODO: get the _actual_ normal
        const rd = reflectVector(vector, [0, -1, 0]);
        console.log(`rd:`, rd);
        const reflectedEndPoint = addVectors(this.currentPoint, scalarMultiplyVector(this.velocity, rd));
        // TODO: draw these properly
        this.drawSegment(this.views[0], this.currentPoint.slice(0,2), reflectedEndPoint.slice(0,2))
        this.drawSegment(this.views[1], this.currentPoint.slice(1,3).reverse(), reflectedEndPoint.slice(1,3).reverse())
      }
    },
    startAnimation(vector) {
    },
    setValues(point) {
      this.range1Value = this.range1Scale(point[0]);
      this.range2Value = this.range2Scale(point[1]);
      this.setBgColor(this.range1Value, this.range2Value);
    },
    setBgColor(hue, saturation, lightness = 60) {
      d3.select(this.$el).selectChildren('svg').select('.color-bg').select('rect')
          .attr('fill', `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    },
    drawSegment(view, startPoint, endPoint) {
      console.log(`drawSegment: ${startPoint} -> ${endPoint}`);
      view.append('line')
          .each(function () {
            this.opacity_value = 1.0
          })
          .attr('stroke', this.lineColor).attr('stroke-width', this.lineWidth)
          .attr('x1', startPoint[0]).attr('y1', startPoint[1])
          .attr('x2', endPoint[0]).attr('y2', endPoint[1]);
    },
    fadeSegments(view) {
      const trailLength = this.trailLength;
      view.selectAll('line')
          .each(function () {
            this.opacity_value -= 1 / trailLength;
          })
          .attr('stroke-opacity', function () {
            return this.opacity_value;
          })
          .filter(function () {
            return this.opacity_value < 0.05;
          })
          .remove()
    },
    reflectLine(boundingRect, startPoint, vector, velocity, segments = []) {
    },
    stopAnimation() {
      !!this.timer && this.timer.stop();
    },
    clearStages() {
      this.inProgress = false;
      d3.select(this.$el).selectChildren('svg').selectAll('*').remove();
      this.currentPoint = this.startPoint;
      this.currentVector = this.startingVector;
      this.drawBoundingBox();
    },
    updateTrailLength(newVal) {
      this.trailLength = newVal;
    }
  }
}

function normalizeVector(vector) {
  const scale_ = 1 / Math.sqrt(vector.reduce((acc, val) => {
    return acc + Math.pow(val, 2);
  },0));
  return vector.map(val => val * scale_);
  // const [a, b] = vector;
  // const c = Math.sqrt(a * a + b * b);
  // const scale = 1 / c;
  // return [a * scale, b * scale];
}

function calculateEndpoint(origin, normalizedVector, magnitude) {
  const [a, b] = normalizedVector.map(c => c * magnitude);
  return origin.map((c, i) => c + normalizedVector[i] * magnitude);
}

function inBounds(point, span) {
  console.log(`inbounds: ${point.toString}:`, span.toString());
  for (let i = 0; i < point.length; i++) {
    if(span[0][i] > point[i] || point[i] > span[1][i]) return false;
  }
  return true;
}

function dotProduct(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length) throw new Error('dot product: vectors must be of the same length');
  return vectorA.reduce((acc, coord, i) => {
    return acc + coord * vectorB[i];
  }, 0);
}

function reflectVector(d,n) {
  const dn = normalizeVector(d), nn = normalizeVector(n);
  console.log(`reflectVector`, dn, nn);
  const dp = dotProduct(dn, nn);
  console.log(`dp=${dp}`);
  return subtractVectors(dn, scalarMultiplyVector(2 * dp, nn));
}

function subtractVectors(minuendVector, subtrahendVector) {
  return minuendVector.map((val, i) => val - (subtrahendVector[i] !== undefined ? subtrahendVector[i] : 0));
}

function addVectors(augendVector, addendVector) {
  return augendVector.map((val, i) => val + (addendVector[i] !== undefined ? addendVector[i] : 0));
}

function scalarMultiplyVector(scalar, vector) {
  return vector.map(val => scalar * val);
}

function getReflectionSegments(startPoint, vector, spanBounds) {
  console.log(`spanBounds`, spanBounds.toString());
  const interleavedBounds = spanBounds[0].map((min, i) => [min, spanBounds[1][i]]);
  console.log(`interleaved bounds:`, interleavedBounds.toString());
  interleavedBounds.forEach(([min, max], i) => {
    const spVal = startPoint[i];
    if(spVal < min) {
      console.log(`dim ${i}: ${spVal} is BELOW the range`);
    } else if (spVal > max) {
      console.log(`dim ${i}: ${spVal} is ABOVE the range`);
    } else {
      console.log(`dim ${i}: ${spVal} is in range`);
    }
  })
// // 1. calculate slope
//   const slope = vector[1] / vector[0];
//   // for each candidate edge…
//   const normalizedVector = normalizeVector(vector);
//   const candidateEdges = boundingRect.edges.filter(({normal}) => {
//     return dotProduct(normalizedVector, normal) < 0;
//   });
//   const results = [];
//   candidateEdges.forEach(edge => {
//     // 2. point-slope formula
//     const [nx, ny] = edge.normal.map(v => Math.abs(v));
//     let pt;
//     if (pointsAreEqual(edge.normal.map(v => Math.abs(v)), [1, 0])) {
//       const pointSlopeFormula = x => slope * x + startPoint[1] - (slope * startPoint[0]);
//       const y = pointSlopeFormula(edge.value);
//       pt = [edge.value, y];
//     } else if (nx === 0 && ny === 1) {
//       const pointSlopeFormula = y => (y - startPoint[1]) / slope + startPoint[0];
//       const x = pointSlopeFormula(edge.value);
//       pt = [x, edge.value];
//     }
//     results.push({pt: pt, normal: edge.normal, hypotenuse: hypotenuse(startPoint, pt)});
//   })
//   return results;
}

function hypotenuse([x1, y1], [x2, y2]) {
  const adj = Math.abs(x2 - x1), opp = Math.abs(y2 - y1);
  return Math.sqrt(Math.pow(opp, 2) + Math.pow(adj, 2));
}

function pointsAreEqual([x1, y1], [x2, y2], epsilon = 0) {
  return Math.abs(x1 - x2) <= epsilon && Math.abs(y1 - y2) <= epsilon;
}

function updatePropertyScalar(vm, target, index, value, [min, max]) {
  const oldVal = target[index];
  if (isNaN(parseFloat(value))
      || min > value || value > max) {
    target[index] = oldVal;
    vm.$forceUpdate();
  } else {
    target[index] = parseFloat(value);
  }
}
</script>

<style scoped>

</style>
