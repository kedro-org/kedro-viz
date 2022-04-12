#  The Kedro-Viz graph layout engine

On this page you'll find high-level details of how we have implemented the engine we use in [Kedro-Viz](https://github.com/kedro-org/kedro-viz). We intend this to be useful as a reference for our project maintainers.  

You can see and interact with the engine's graph drawings on the [Kedro-Viz demo](https://demo.kedro.org/) or explore our [code](https://github.com/kedro-org/kedro-viz/tree/main/src/utils/graph) to see how it works in practice, which we describe below in more detail.

<p align="center">
  <img width="450" alt="kedro-viz-drawing" src="https://user-images.githubusercontent.com/45365769/117349544-67d75680-aea3-11eb-8c72-d1b88f4b930c.png">
</p>

We break down graph drawings, like those shown above, into what we consider essential and unique principles:

- The nodes tend to be close together
- The nodes do not overlap
- The nodes align on each axis
- The edges tend to the vertical
- The edges do not cross
- The edges point in the same direction
- The trees have symmetry

We form our [constraints](https://en.wikipedia.org/wiki/Constraint_(mathematics)) between nodes and edges using these rules, which allows us to frame the graph drawing problem as a [constrained optimisation problem](https://en.wikipedia.org/wiki/Constrained_optimization):

> Given the graph _G_ contains set of nodes _N = { A, B, C… }_ with position _A<sub>p</sub>, B<sub>p</sub>, C<sub>p</sub> …_, a set of edges _E = { A → B, A → C… }_ and a set of constraints _C_
> 
> - For every node pair _{ A, B }_ in all nodes _N_
>   - Minimise position distance _|A<sub>p</sub> - B<sub>p</sub>|_
>   - Subject to all constraints in _C_
> - For every edge _A → B_
>   - Draw path from _A<sub>p</sub>_ to _B<sub>p</sub>_ avoiding all nodes _N_

In practice we've made two key simplifcations:

- We consider node position variables in X and Y axes as [independent](https://en.wikipedia.org/wiki/Dependent_and_independent_variables), such that a node may change position freely in X without affecting its position in Y and vice versa
- We consider the routing problem independent from the layout problem

## The constraints

From each rule we form [geometric constraints](https://en.wikipedia.org/wiki/Geometric_constraint_solving) as relations between our node positions:

#### __Row Constraint__ 

"Edges point in the same direction" and "Nodes do not overlap"

>- For every edge _A → B_ in all edges _E_
>    - Ensure minimum distance and direction A to B in Y-axis  
>    __B<sub>y</sub> ≥ A<sub>y</sub> + d__
>    - Where _A_ is the _source_ node and _B_ is the _target_ node
>    - Where _d_ is the minimum vertical row distance required

_Notes_
- We implemented this as our __row constraint__ ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L9-L22))  
and our __layer constraint__ by adding intermediate layer nodes ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L106-L136))
- The expected performance is _O(E)_ [linear complexity](https://en.wikipedia.org/wiki/Computational_complexity) in number of edges
- This equation forms a [linear constraint](https://en.wikipedia.org/wiki/Linear_programming) with one minimal solution

<p align="center">
  <img width="700" alt="kedro-viz-row-constraint" src="https://user-images.githubusercontent.com/45365769/117346462-acf98980-ae9f-11eb-87af-091afbd727c0.png">
</p>

#### __Separation Constraint__

"Nodes do not overlap"

>- For every pair of nodes _{ A, B }_ in all nodes _N_
>    - Ensure minimum distance between A and B in X-axis  
>    __|A<sub>x</sub> - B<sub>x</sub>| ≥ d__
>    - Where _d_ is the minimum horizontal separation distance required

_Notes_
- We implemented this as our __separation constraint__ ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L87-L100))
- Its performance is _O(N<sup>2</sup>)_ quadratic complexity in number of nodes
- This equation forms a [nonlinear constraint](https://en.wikipedia.org/wiki/Nonlinear_programming) with two minimal solutions
- This simplifies given a direction, to linear constraint __B<sub>x</sub> > A<sub>x</sub> + s<sub>x</sub>__ ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L12-L22))
- This simplifies once we have rows with direction, to _O(N)_ linear complexity ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L215-L257))

<p align="center">
  <img width="500" alt="kedro-viz-separation-constraint" src="https://user-images.githubusercontent.com/45365769/117347684-470e0180-aea1-11eb-94ec-4b733127df40.png">
</p>

#### __Parallel Constraint__

"Edges tend to the vertical"

> - For every edge _A → B_ in all edges _E_
>    - Ensure zero distance between A and B in X-axis  
>    __A<sub>x</sub> - B<sub>x</sub> = 0__

_Notes_
- We implemented this as our __parallel constraint__ ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L39-L59))
- This equation forms a linear constraint with one minimal solution
- Its performance is _O(E)_ linear complexity in number of edges

<p align="center">
  <img width="500" alt="kedro-viz-parallel-constraint" src="https://user-images.githubusercontent.com/45365769/117347724-51c89680-aea1-11eb-97f4-fcfa24683836.png">
</p>

#### __Crossing Constraint__

"Edges do not cross"

>- For every pair of edges _{ A → B, C → D }_ in all edges _E_
>    - Ensure direction A to C is same direction B to D in X-axis  
>    _(A<sub>x</sub> < C<sub>x</sub> and B<sub>x</sub> < D<sub>x</sub>) or (A<sub>x</sub> > C<sub>x</sub> and B<sub>x</sub> > D<sub>x</sub>)_  
or as vectors __(A<sub>x</sub> - C<sub>x</sub>) ・ (B<sub>x</sub> - D<sub>x</sub>) < 0__

_Notes_
- We implemented this as our __crossing constraint__ ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L61-L85))
- This equation forms a nonlinear constraint with two minimal solutions
- Its performance is _O(E<sup>2</sup>)_ quadratic complexity in number of edges
- This simplifies once we have rows, to _O(max|E<sub>row</sub>|<sup>2</sup>)_ complexity ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L164-L171))

<p align="center">
  <img width="500" alt="kedro-viz-crossing-constraint" src="https://user-images.githubusercontent.com/45365769/117353287-da4a3580-aea7-11eb-870c-7957e15e5580.png">
</p>

## Solving the constraints

Our engine combines the properties of two distinct solving approaches: a loose solver and a strict solver.

### Loose solver

For certain constraints ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L65-L68)) this algorithm finds a quick but approximate solution using a [soft constraint solver](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem#Flexible_CSPs):

- It has a simple implementation ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/solver.js#L12-L26))
- Its performance is suited to hundreds of thousands of constraints
- It supports many kinds of constraint using [objective / loss functions](https://en.wikipedia.org/wiki/Loss_function) ([code](https://github.com/kedro-org/kedro-viz/blob/6572c5fa89ec57214c35e866d4584fa510b41aa3/src/utils/graph/constraints.js#L47-L52))
- It supports [soft constraints](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem#Flexible_CSPs) with partial solutions
- It has limited output [similarity](https://en.wikipedia.org/wiki/Coherence_(signal_processing)) given similar inputs
- The constraint strength and iterations must be well tuned ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L187-L189))

### Strict solver

We form a reduced set of constraints ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L51-L74)) based on the loose solution and give that to a slower but exact [hard constraint solver](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem#Flexible_CSPs):

- It has a complex implementation (handled by [kiwi.js](https://github.com/IjzerenHein/kiwi.js/) / [Cassowary](https://en.wikipedia.org/wiki/Cassowary_(software)) library) ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/solver.js#L41-L90))
- Its performance is suited to a few thousand constraints
- It is limited to [hard](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem#Flexible_CSPs) and [linear constraints](https://en.wikipedia.org/wiki/Linear_programming) ([code](https://github.com/kedro-org/kedro-viz/blob/6572c5fa89ec57214c35e866d4584fa510b41aa3/src/utils/graph/constraints.js#L17-L23))
- It finds an exact complete solution or no solution
- It has strong output similarity given similar inputs
- The constraint priority can be optionally tuned ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L57))

### Combining both solvers

The combination results in a layout that assigns all nodes positions that strongly respect our constraints, and does so in a short processing time.

<p align="center">
  <img width="1409" alt="kedro-viz-solvers" src="https://user-images.githubusercontent.com/45365769/117351124-41b2b600-aea5-11eb-9dfd-480c98e7ca7d.png">
</p>

## Routing

Given our engine has solved our constraints and it has found a layout, it then handles routing edges with a separate algorithm ([code](https://github.com/kedro-org/kedro-viz/blob/main/src/utils/graph/routing.js)).

We found that in many cases a single straight line for each edge would cut through many nodes along the way. Our routing moves around these nodes instead so the drawing is clear for us to read.

Our implemented routing algorithm is roughly:

> - Given positions decided for all nodes in _N_
> - For every edge _A → B_ in all edges _E_
>    - Start at edge source node position _(A<sub>x</sub> A<sub>y</sub>)_
>    - Draw a line to the closest empty point on each row after
>    - Stop at the row of the edge target node
>    - Draw a line to the edge target node position _(B<sub>x</sub> B<sub>y</sub>)_

This results in a relatively short path for each edge, where most path segments tend to be vertical, with its processing completed quickly in practice ([code](https://github.com/kedro-org/kedro-viz/blob/main/src/utils/graph/routing.js)).

<p align="center">
  <img width="500" alt="kedro-viz-routing" src="https://user-images.githubusercontent.com/45365769/117347854-73c21900-aea1-11eb-9ac7-6f16026c371f.png">
</p>

### Improved routing

When we have multiple edges starting from a single node, we separate them visually for better legibility ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/routing.js#L175-L202)) and order by direction to avoid introducing edge crossings ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/routing.js#L152-L167)).

In practice our layout constraints also include additional space for edges to pass through, especially around a graph's most highly connected nodes ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L246-L255)).

Finally, we render the finished routes to the user as smooth bezier curves ([code](https://github.com/kedro-org/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/components/flowchart/draw.js#L243-L311)), as we find we can read them easier than straight lines.
