“D3 for the Impatient” Exercises


//    <p>After having used <a href="https://d3js.org/" target="_blank">D3.js</a> off and on
//      for literally years with only a very fuzzy understanding of how it works, I'd gotten tired
//      of getting stopped in my tracks and having to spend unnecessary (and unnecessarily
//      frustrating) hours getting some close-enough example from
//      <a href="http://observablehq.com/" target="_blank">Observable HQ</a> to meet my immediate
//      need, through a process that was mostly trial and error, to be completely honest. And of
//      course, the end result was generally something that was a near — or not so near — compromise
//      with my original expectation. ObservableHQ is an amazing tool (as is D3, to state the obvious)
//      but to me, at least, provided an additional hurdle; while its 'notebook' style is fantastic
//      for
//      exploring ideas in D3 itself, it doesn't provide a lot of clues on how to integrate those
//      examples into a living, breathing app.</p>
//    <p>So I determined to work my way methodically through some beginner-to-expert tutorial, filling
//      in gaps as I went, taking time to ensure I understood <em>all</em> the concepts thoroughly. I
//      further determined to modify and extend the examples as necessary to mimic the demands I might
//      encounter in a real project, and to really ensure that I had a firm enough grasp to be
//      <em>able</em> to do so — and, as it turns out, to discover even more challenges and techniques
//      in so doing.</p>
//    <p>In searching, I discovered Philipp K. Janert's excellent
//      <a href="https://learning.oreilly.com/library/view/d3-for-the/9781492046783/">D3 for the
//        Impatient</a>, which I can't recommend highly enough. The explanations are incredibly
//    clear and detailed, and — as far as I can tell — the book in its entirety covers every important
//      corner of D3's huge range of functionality.</p>
//    <p>So this project is the (continuing) result of that exercise, with my goals being:</p>
//    <ul>
//      <li>work through every example in the book, only moving on when I feel I've mastered it</li>
//      <li>adapt every example to a front-end SPA framework, adopting as many of the
//        idioms/strengths of that framework as possible.
//        (<a href="https://vuejs.org/" target="_blank">Vue.js 3.0</a>, specifically, since that's
//      my current go-to, but I think the principles would be easy enough to migrate to React,
//      Angular, etc.)</li>
//      <li>think of at least one modification and/or extension I might realistically
//        need to apply to the example in a real project, and complete those, incorporating
//      as many of these goals as possible:
//        <ul>
//          <li>live updating of the display in response to modification of the underlying data,
//          including…
//            <ul>
//              <li>adding data points</li>
//              <li>removing data points</li>
//              <li>changing the value of existing data points</li>
//            </ul>
//          </li>
//          <li>adding parameters to alter the display of the data, either by altering the default
//          state of the containing component, passing params from the containing component or,
//          ideally, exposing these as user-accessible controls in the UI</li>
//          <li>Adding some kind of animation, but only if that serves to enhance the user's
//          understanding of the data/its evolution</li>
//          <li>mimicking the way the display might need to respond to data incoming from external
//          sources, if only, in this case, via a user button-press or a Javascript time/interval
//          function.</li>
//        </ul>
//      </li>
//    </ul>
//    <p>So here they are… I hope they can be useful to you, too, somehow.</p>
//
//## Project setup
//```
//yarn install
//```
//
//### Compiles and hot-reloads for development
//```
//yarn serve
//```
//
//### Compiles and minifies for production
//```
//yarn build
//```
//
//### Run your unit tests
//```
//yarn test:unit
//```
//
//### Customize configuration
//See [Configuration Reference](https://cli.vuejs.org/config/).
