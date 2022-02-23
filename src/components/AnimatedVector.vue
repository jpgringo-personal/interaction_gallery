<template>
  <div class="component d3-sandbox animated-vector">
    <p style="flex:0 0 100%">
    </p>
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
      </p>
      <p>
        Vector:
        <label>X: <input type="text" id="startVectorX" v-model="startVectorX"></label>
        <label>Y: <input type="text" id="startVectorY" v-model="startVectorY"></label>
        <label>velocity: <input type="text" id="velocity" v-model="velocity"></label>
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
  data: function () {
    return {
      viewWidth: 320,
      viewHeight: 320,
      inset: 30,
      lineColor: 'dodgerblue',
      lineWidth: 2,
      frontView: undefined,
      sideView: undefined,
      boundingRect: undefined,
      startOffset: [0, 0],
      offsetMin: -100,
      offsetMax: 100,
      startingVector: [0.025, 1],
      velocity: 5,
      timer: undefined,
      trailLength: 1000,
      selectedColor: 'whitesmoke',
      range1Extent: [0, 360], // hue
      range1Scale: undefined,
      range2Extent: [25, 100], // saturation
      range2Scale: undefined,
      range1Value: undefined,
      range2Value: undefined,
    }
  },
  computed: {
    startVectorX: {
      get() {
        return this.startingVector[0]
      },
      set(newVal) {
        if (isNaN(parseFloat(newVal))) throw 'input is not a number';
        this.startingVector[0] = parseFloat(newVal);
      }
    },
    startVectorY: {
      get() {
        return this.startingVector[1]
      },
      set(newVal) {
        if (isNaN(parseFloat(newVal))) throw 'input is not a number';
        this.startingVector[1] = parseFloat(newVal);
      }
    },
    startOffsetX: {
      get() {
        return this.startOffset[0]
      },
      set(newVal) {
        const oldVal = this.startOffset[0];
        if (isNaN(parseFloat(newVal))
            || this.offsetMin > newVal || newVal > this.offsetMax) {
          this.startOffset[0] = oldVal;
          this.$forceUpdate();
        } else {
          this.startOffset[0] = parseFloat(newVal);
        }
      }
    },
    startOffsetY: {
      get() {
        return this.startOffset[1]
      },
      set(newVal) {
        const oldVal = this.startOffset[1];
        if (isNaN(parseFloat(newVal))
            || this.offsetMin > newVal || newVal > this.offsetMax) {
          this.startOffset[1] = oldVal;
          this.$forceUpdate();
        } else {
          this.startOffset[1] = parseFloat(newVal);
        }
      }
    },
  },
  mounted() {
    const br = this.boundingRect = {
      x: this.inset, y: this.inset,
      w: this.viewWidth - this.inset * 2,
      h: this.viewHeight - this.inset * 2,
    };
    // 'decorate' with edge props to facilitate efficient reflection calculation
    br.edges = calculateEdges(br);
    this.drawBoundingBox();
    this.frontView = d3.select(this.$refs.frontView);
    this.sideView = d3.select(this.$refs.sideView);
    this.range1Scale = d3.scaleLinear().domain([this.inset, this.viewWidth - this.inset]).range(this.range1Extent);
    this.range2Scale = d3.scaleLinear().domain([this.inset, this.viewHeight - this.inset]).range(this.range2Extent.reverse());
  },
  unmounted() {
    !!this.timer && this.timer.stop();
  },
  methods: {
    drawBoundingBox() {
      const viewWidthString = `${this.viewWidth}px`;
      const allSvgs = d3.selectAll('svg');
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
    testCollisionSet() {
      const collisionSet = [
        [2, 3],
        [2, 2],
        [4, 0],
        [7, -2],
        [2, -1.8],
        [2, -2],
        [0, -2],
        [-2, -2],
        [-2, -1.5],
        [-2, 0],
        [-7, -2],
        [-2, 2],
        [-2, 3],
        [0, 2]
      ];
      const velocity = this.velocity;
      collisionSet.forEach(vector => this.testCollision(vector, velocity))
    },
    testCollision(vector, velocity) {
      const origin = [this.viewWidth / 2, this.viewHeight / 2];
      let normalizedVector = normalizeVector(vector)
      let startPoint = origin,
          endPoint = calculateEndpoint(origin, normalizedVector, velocity);
      while (inBounds(endPoint, this.boundingRect)) {
        this.frontView.append('line')
            .attr('stroke', 'dodgerblue').attr('stroke-width', this.lineWidth)
            .attr('x1', startPoint[0]).attr('y1', startPoint[1])
            .attr('x2', endPoint[0]).attr('y2', endPoint[1]);
        startPoint = endPoint;
        endPoint = calculateEndpoint(startPoint, normalizedVector, velocity)
      }
      // now calculate the reflection
      const reflectionResult = this.reflectLine(this.boundingRect, startPoint, vector, velocity);
      reflectionResult.segments.forEach((segment, i) => {
        console.log(`segment:`, segment);
        this.frontView.append('line')
            .attr('stroke', devLineColors[i])
            .attr('stroke-width', this.lineWidth)
            .attr('x1', segment[0][0]).attr('y1', segment[0][1])
            .attr('x2', segment[1][0]).attr('y2', segment[1][1]);

      })
    },
    startAnimation(vector) {
      console.log(`will start animation...`, vector);
      // start with just 2D…
      const origin = [this.viewWidth / 2, this.viewHeight / 2]
      let normalizedVector = normalizeVector(vector);
      const scaledStartOffset = [
        this.startOffsetX / 100 * (this.viewWidth / 2 - this.inset),
        this.startOffsetY / 100 * (this.viewHeight / 2 - this.inset),
      ];
      let startPoint = addVectors(origin, scaledStartOffset),
          endPoint = calculateEndpoint(startPoint, normalizedVector, this.velocity);
      const vm = this;
      this.timer = d3.timer(function (t) {
        if (!inBounds(endPoint, vm.boundingRect)) {
          // vm.stopAnimation();
          const reflectionResult = vm.reflectLine(vm.boundingRect, startPoint, normalizedVector, vm.velocity);
          reflectionResult.segments.forEach((segment, i) => {
            vm.drawSegment(vm.frontView, segment[0], segment[1]);
          })
          startPoint = reflectionResult.nextPoint;
          normalizedVector = reflectionResult.nextVector;
          endPoint = calculateEndpoint(startPoint, normalizedVector, vm.velocity)
          vm.setValues(endPoint);
        } else {
          vm.fadeSegments(vm.frontView)
          vm.drawSegment(vm.frontView, startPoint, endPoint);
          startPoint = endPoint;
          endPoint = calculateEndpoint(startPoint, normalizedVector, vm.velocity);
          vm.setValues(endPoint);
        }
      })
    },
    setValues(point) {
      this.range1Value = this.range1Scale(point[0]);
      this.range2Value = this.range2Scale(point[1]);
      this.setBgColor(this.range1Value, this.range2Value);
    },
    setBgColor(hue, saturation, lightness = 60) {
      d3.selectAll('svg').select('.color-bg').select('rect')
          .attr('fill', `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    },
    continueLine(view, startPoint, endPoint, vector, velocity, iterations = 1) {
      console.log(`will continue line`);
      for (let i = 0; i < iterations; i++) {
        this.drawSegment(view, startPoint, endPoint);
        startPoint = endPoint;
        endPoint = calculateEndpoint(startPoint, vector, velocity);
      }
    },
    drawSegment(view, startPoint, endPoint) {
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
            // console.log(`tl=${this.trailLength}; op=${this.opacity_value}`);
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
      const normalizedVector = normalizeVector(vector)
      const result = getReflectionSegments_best(startPoint, normalizedVector, this.boundingRect);
      const epsilon = 0.001;
      const bestMatch = result.reduce((acc, res) => {
        if (acc === undefined) {
          if (Math.abs(res.pt[0] - startPoint[0]) <= epsilon
              || Math.abs(res.pt[1] - startPoint[1]) <= epsilon) {
            res.isEdge = true;
          }
          return res;
        } else if (res.hypotenuse <= acc.hypotenuse) {
          if (Math.abs(res.hypotenuse - acc.hypotenuse) <= epsilon
              && pointsAreEqual(res.pt, acc.pt, epsilon)) {
            res.isCorner = true;
          }
          return res;
        } else {
          return acc;
        }
      }, undefined)
      // add the first line segment
      segments.push([startPoint, bestMatch.pt]);

      // calculate the reflected segment
      let n; // the surface normal
      if (bestMatch.isEdge || bestMatch.isCorner) {
        const rotationAmount = bestMatch.isCorner ? 0.125 / 2 : 0.125;
        const sign = Math.round(Math.random()) * 2 - 1;
        const theta = rotationAmount * Math.PI * sign;
        const bmn = bestMatch.isCorner ?
            normalizedVector :
            bestMatch.normal;
        console.log(`currentNormal:`, bmn.toString());
        const rotatedNormal = [
          bmn[0] * Math.cos(theta) - bmn[1] * Math.sin(theta),
          bmn[0] * Math.sin(theta) + bmn[1] * Math.cos(theta)
        ]
            .map(val => parseFloat(val.toFixed(6)));
        console.log(`rotatedNormal:`, rotatedNormal.toString());
        n = rotatedNormal;
      } else if (bestMatch.isCorner) {
        n = [0, 0]
      } else {
        n = bestMatch.normal;

      }
      const dDotN = dotProduct(vector, n);
      const r = subtractVectors(vector, scalarMultiplyVector(2 * dDotN, n));
      const magnitude = velocity - bestMatch.hypotenuse;
      const newEndPoint = calculateEndpoint(bestMatch.pt, normalizeVector(r), magnitude);
      if (!inBounds(newEndPoint, boundingRect)) {
        console.log(`DAMMIT!! THAT'S NOT IN BOUNDS, EITHER :(`);
        return this.reflectLine(boundingRect, bestMatch.pt, r, velocity, segments)
      } else {
        segments.push([bestMatch.pt, newEndPoint]);
        return {segments: segments, nextPoint: newEndPoint, nextVector: r};
      }

    },
    stopAnimation() {
      console.log(`will stop animation...`);
      !!this.timer && this.timer.stop();
    },
    clearStages() {
      d3.selectAll('svg').selectAll('*').remove();
      this.drawBoundingBox();
    },
    checkComponentValue(evt) {
      console.log(`checking (and maybe resetting) component value… `, evt);
    }
  }
}

function normalizeVector(vector) {
  const [a, b] = vector;
  const c = Math.sqrt(a * a + b * b);
  const scale = 1 / c;
  return [a * scale, b * scale];
}

function calculateEndpoint(origin, normalizedVector, magnitude) {
  const [a, b] = normalizedVector.map(c => c * magnitude);
  return origin.map((c, i) => c + normalizedVector[i] * magnitude);
}

function inBounds(point, rect) {
  return point[0] >= rect.x
      && point[0] <= rect.x + rect.w
      && point[1] >= rect.y
      && point[1] <= rect.y + rect.h;
}

function getCollisionNormal(point, rect) {
  if (point[0] < rect.x) {
    console.log(`collided with left edge of rectangle`);
    return [1, 0];
  } else if (point[0] > rect.x + rect.w) {
    console.log(`collided with right edge of rectangle`);
    return [-1, 0];
  } else if (point[1] < rect.y) {
    console.log(`collided with bottom edge of rectangle`);
    return [0, 1];
  } else if (point[1] > rect.y + rect.h) {
    console.log(`collided with top edge of rectangle`);
    return [0, -1];
  } else {
    return null;
  }
}

function dotProduct(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length) throw new Error('dot product: vectors must be of the same length');
  return vectorA.reduce((acc, coord, i) => {
    return acc + coord * vectorB[i];
  }, 0);
}

function subtractVectors(minuendVector, subtrahendVector) {
  return minuendVector.map((val, i) => val - (subtrahendVector[i] !== undefined ? subtrahendVector[i] : 0));
}

function addVectors(augendVector, addendVector) {
  console.log(`augendVector:`, augendVector);
  console.log(`addendVector:`, addendVector);
  return augendVector.map((val, i) => val + (addendVector[i] !== undefined ? addendVector[i] : 0));
}

function scalarMultiplyVector(scalar, vector) {
  return vector.map(val => scalar * val);
}

function getAdjacentValues(startPoint, endPoint, edge) {
  const adjacentEndpoint = startPoint.reduce((acc, coord, i) => {
    console.log(`startPoint[${i}]=${coord}; endPoint[${i}]=${endPoint[i]}; edge.normal[${i}]=${edge.normal[i]}`);
    const excluded = edge.normal[i] >= 0;
    acc[i] = excluded ? coord : endPoint[i];
    return acc;
  }, [0, 0])
  console.log(`adjacentEndPoint:`, adjacentEndpoint);
  const adjacentLength = (adjacentEndpoint[0] - startPoint[0]) + (adjacentEndpoint[1] - startPoint[1]);
  const oppositeEndpoint = adjacentEndpoint.reduce((acc, coord, i) => {

  }, [0, 0]);
  return {adjacent: {points: [startPoint, adjacentEndpoint], length: adjacentLength}};
}

function calculateHypotenuse(startPoint, endPoint, vector, edge) {
  console.log(`edge - value=${edge.value}; normal:`, edge.normal.toString());
  // get the required coord value from the origin
  console.log(`startPoint:`, startPoint.toString());
  const sides = getAdjacentValues(startPoint, endPoint, edge);
  console.log(`sides:`, sides);
  // const adjacentDelta = edge.value - adjacentValue;
  // console.log(`adjacent delta:`, adjacentDelta);
  // const adjacentRatio = adjacentDelta / adjacentValue;
  // console.log(`adjacent ratio:`, adjacentRatio);
  return 0;
}

// TODO: do we need a special case for a point that is outside the bounding box?
function getReflectionSegments(startPoint, endPoint, vector, boundingRect) {
  const normalizedVector = normalizeVector(vector);
  const candidateEdges = boundingRect.edges.filter(({normal}) => {
    return dotProduct(normalizedVector, normal) < 0;
  });
  const targetEdge = candidateEdges.reduce((acc, edge) => {
    const hypotenuse = calculateHypotenuse(startPoint, endPoint, vector, edge)
    return acc === undefined ? {edge: edge, magnitude: hypotenuse} : {}
  }, undefined)
  console.log(`targetEdge:`, targetEdge);
  const reflectionPoint = [];
  console.log(`reflectionPoint`, reflectionPoint);
}

function getReflectionSegments_better(startPoint, endPoint, vector, boundingRect) {
  // console.log(`better reflection segments...`);
  const normalizedVector = normalizeVector(vector);
  let candidateEdges = boundingRect.edges.filter(({normal}) => {
    return dotProduct(normalizedVector, normal) < 0;
  });
  const boundingBoxAsOriginAndVector = rectToVector(boundingRect);
  // console.log(`bb as o+v:`, boundingBoxAsOriginAndVector);
  // console.log(`candidateEdges:`, candidateEdges);
  const vectorBoundingBox = {
    o: [Math.min(startPoint[0], endPoint[0]),
      Math.min(startPoint[1], endPoint[1])],
    v: [Math.abs(endPoint[0] - startPoint[0]),
      Math.abs(endPoint[1] - startPoint[1])],
  }
  // TODO: the specification of boxB AND scale AND edge normal can probably be combined into one
  const boxBEndpoint = [
    candidateEdges.reduce((acc, {normal, value}) => {
      return normal[0] < 0 ? acc + value : acc;
    }, 0),
    candidateEdges.reduce((acc, {normal, value}) => {
      return normal[1] < 0 ? acc + value : acc;
    }, 0)
  ];
  const boxB = {
    o: [Math.min(startPoint[0], endPoint[0]),
      Math.min(startPoint[1], endPoint[1])],
    v: [boxBEndpoint[0] - vectorBoundingBox.o[0],
      boxBEndpoint[1] - vectorBoundingBox.o[1]]
  }
  candidateEdges.reduce((acc, edge) => {
    console.log(`edge=${edge.value}:`, edge.normal.toString());
  }, {scale: undefined, normal: undefined})
  const outcomes = candidateEdges.reduce((acc, edge) => {
    return acc;
  }, {scale: Infinity, edgeNormal: undefined});
  // console.log(`outcomes - scale=${outcomes.scale}; normal:`, outcomes.edgeNormal);
  const dim0Scale = boxB.v[0] / vectorBoundingBox.v[0], // width, i.e., v = [±1, 0]
      dim1Scale = boxB.v[1] / vectorBoundingBox.v[1]; // height; i.e., v = [0, ±1]
  const scale = Math.min(dim0Scale, dim1Scale);
  // console.log(`horizScale=${dim0Scale}; vertScale=${dim1Scale}; scale=${scale}`);
  const segment1 = [startPoint,
    [
      vectorBoundingBox.o[0] + (vectorBoundingBox.v[0] * scale),
      vectorBoundingBox.o[1] + (vectorBoundingBox.v[1] * scale)
    ]
  ]
  console.log(`startPoint:`, startPoint, '; boxB:', boxB);
  return {
    boxes: [
      vectorBoundingBox,
      boxB
    ], segments: [segment1]
  };
}

function getReflectionSegments_best(startPoint, vector, boundingRect) {
// 1. calculate slope
  const slope = vector[1] / vector[0];
  // for each candidate edge…
  const normalizedVector = normalizeVector(vector);
  const candidateEdges = boundingRect.edges.filter(({normal}) => {
    return dotProduct(normalizedVector, normal) < 0;
  });
  const results = [];
  candidateEdges.forEach(edge => {
    // 2. point-slope formula
    const [nx, ny] = edge.normal.map(v => Math.abs(v));
    let pt;
    if (pointsAreEqual(edge.normal.map(v => Math.abs(v)), [1, 0])) {
      const pointSlopeFormula = x => slope * x + startPoint[1] - (slope * startPoint[0]);
      const y = pointSlopeFormula(edge.value);
      pt = [edge.value, y];
    } else if (nx === 0 && ny === 1) {
      const pointSlopeFormula = y => (y - startPoint[1]) / slope + startPoint[0];
      const x = pointSlopeFormula(edge.value);
      pt = [x, edge.value];
    }
    results.push({pt: pt, normal: edge.normal, hypotenuse: hypotenuse(startPoint, pt)});
  })
  return results;
}

function hypotenuse([x1, y1], [x2, y2]) {
  const adj = Math.abs(x2 - x1), opp = Math.abs(y2 - y1);
  return Math.sqrt(Math.pow(opp, 2) + Math.pow(adj, 2));
}

function pointsAreEqual([x1, y1], [x2, y2], epsilon = 0) {
  return Math.abs(x1 - x2) <= epsilon && Math.abs(y1 - y2) <= epsilon;
}

function rectToVector(rect) {
  return {o: [rect.x, rect.y], v: [rect.w, rect.h]}
}

function vectorToRect(origin, vector) {
  const left = origin[0], top = origin[1],
      right = origin[0] + vector[0], bottom = origin[1] + vector[1];
  return {
    x: left,
    y: top,
    w: Math.abs(left - right),
    h: Math.abs(top - bottom)
  }
}
</script>

<style scoped>

</style>
