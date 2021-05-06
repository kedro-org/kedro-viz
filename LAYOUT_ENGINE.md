#  The Kedro Viz Graph Layout Engine

An engine for drawing [Kedro](https://github.com/quantumblacklabs/kedro) pipelines, visualised as a graph built from nodes connected by edges. 

The solution developed for the [Kedro Viz](https://github.com/quantumblacklabs/kedro-viz) project can quickly find high quality graph drawings while performing well on Kedro scale projects.

You can see and interact with rendered graphs on the [Kedro Viz demo](https://quantumblacklabs.github.io/kedro-viz/) and explore the [code](https://github.com/quantumblacklabs/kedro-viz/tree/main/src/utils/graph) of the approach discussed here.

## Drawing from first principles

<p align="center">
  <img width="450" alt="kedro-viz-drawing" src="https://user-images.githubusercontent.com/45365769/117349544-67d75680-aea3-11eb-8c72-d1b88f4b930c.png">
</p>

We break down a graph drawing into some essential and unique principles:

- Nodes tend to be close together
- Nodes do not overlap
- Nodes align on each axis
- Edges tend to the vertical
- Edges do not cross
- Edges point in the same direction
- Trees have symmetry

When viewed as rules these can be used to form [constraints](https://en.wikipedia.org/wiki/Constraint_(mathematics)) between nodes and edges when drawing.

We then frame drawing the graph as a [constrained optimisation problem](https://en.wikipedia.org/wiki/Constrained_optimization):

> Given the graph _G_ contains set of nodes _N = { A, B, C… }_ and set of edges _E = { A → B, A → C… }_ and a set of constraints _C_
> 
> - for every node pair _{ A, B }_ in all nodes _N_
>   - minimise position distance _|A<sub>p</sub> - B<sub>p</sub>|_
>   - subject to all constraints in _C_
> - for every edge _A → B_
>   - draw path from _A<sub>p</sub>_ to _B<sub>p</sub>_ avoiding all nodes _N_

In practice two key simplifcations are made:

- We consider node position variables in X and Y axes as [independent](https://en.wikipedia.org/wiki/Dependent_and_independent_variables), such that a node may freely change position in X without affecting its position in Y and vice versa
- We consider the routing problem independent from the layout problem

## The constraints

From each rule we form [geometric constraints](https://en.wikipedia.org/wiki/Geometric_constraint_solving) as relations between node positions:

#### __Row Constraint__ 

"Edges point in the same direction" and "Nodes do not overlap"

>- for every edge _A → B_ in all edges _E_
>    - ensure minimum distance and direction A to B in Y-axis  
>    __B<sub>y</sub> ≥ A<sub>y</sub> + d__
>    - where _A_ is the _source_ node and _B_ is the _target_ node
>    - where _d_ is the minimum vertical row distance required

_Notes_
- implemented as the __row constraint__ ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L9-L22))
- and the __layer constraint__ by adding layer nodes ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L106-L136))
- expected performance is _O(E)_ [linear complexity](https://en.wikipedia.org/wiki/Computational_complexity) in number of edges
- this equation will form a [linear constraint](https://en.wikipedia.org/wiki/Linear_programming)

<p align="center">
  <img width="700" alt="kedro-viz-row-constraint" src="https://user-images.githubusercontent.com/45365769/117346462-acf98980-ae9f-11eb-87af-091afbd727c0.png">
</p>

#### __Separation Constraint__

"Nodes do not overlap"

>- for every pair of nodes _{ A, B }_ in all nodes _N_
>    - ensure minimum distance between A and B in X-axis  
>    __|A<sub>x</sub> - B<sub>x</sub>| ≥ d__
>    - where _d_ is the minimum horizontal separation distance required

_Notes_
- implemented as the __separation constraint__ ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L87-L100))
- performance _O(N<sup>2</sup>)_ quadratic complexity in number of nodes
- equation forms a [nonlinear constraint](https://en.wikipedia.org/wiki/Nonlinear_programming)
- simplifies given direction, to linear constraint __B<sub>x</sub> > A<sub>x</sub> + s<sub>x</sub>__ ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L12-L22))
- simplifies given directed rows, to _O(N)_ linear complexity ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L215-L257))

<p align="center">
  <img width="500" alt="kedro-viz-separation-constraint" src="https://user-images.githubusercontent.com/45365769/117347684-470e0180-aea1-11eb-94ec-4b733127df40.png">
</p>

#### __Parallel Constraint__

"Edges tend to the vertical"

> - for every edge _A → B_ in all edges _E_
>    - ensure zero distance between A and B in X-axis  
>    __A<sub>x</sub> - B<sub>x</sub> = 0__

_Notes_
- implemented as the __parallel constraint__ ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L39-L59))
- equation forms a linear constraint
- performance _O(E)_ linear complexity in number of edges

<p align="center">
  <img width="500" alt="kedro-viz-parallel-constraint" src="https://user-images.githubusercontent.com/45365769/117347724-51c89680-aea1-11eb-97f4-fcfa24683836.png">
</p>

#### __Crossing Constraint__

"Edges do not cross"

>- for every pair of edges _{ A → B, C → D }_ in all edges _E_
>    - ensure direction A to C is same direction B to D in X-axis  
>    _(A<sub>x</sub> < C<sub>x</sub> and B<sub>x</sub> < D<sub>x</sub>) or (A<sub>x</sub> > C<sub>x</sub> and B<sub>x</sub> > D<sub>x</sub>)_  
or as vectors __(A<sub>x</sub> - C<sub>x</sub>) ・ (B<sub>x</sub> - D<sub>x</sub>) < 0__

_Notes_
- implemented as the __crossing constraint__ ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L61-L85))
- equation forms a nonlinear constraint
- performance _O(E<sup>2</sup>)_ quadratic complexity in number of edges
- simplifies given rows, to _O(max|E<sub>row</sub>|<sup>2</sup>)_ complexity ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L164-L171))

<p align="center">
  <img width="500" alt="kedro-viz-crossing-constraint" src="https://user-images.githubusercontent.com/45365769/117353287-da4a3580-aea7-11eb-870c-7957e15e5580.png">
</p>

## Solving the constraints

In this engine the best properties of two distinct solving approaches are combined in the following way:

### Loose solver

For certain constraints ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L65-L68)) a quick but approximate solution is found using a [soft constraint solver](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem#Flexible_CSPs):

- simple implementation ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/solver.js#L12-L26))
- performance suited to hundreds of thousands of constraints
- supports many kinds of constraint using [objective / loss functions](https://en.wikipedia.org/wiki/Loss_function) ([code](https://github.com/quantumblacklabs/kedro-viz/blob/6572c5fa89ec57214c35e866d4584fa510b41aa3/src/utils/graph/constraints.js#L47-L52))
- supports [soft constraints](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem#Flexible_CSPs) with partial solutions
- limited output [similarity](https://en.wikipedia.org/wiki/Coherence_(signal_processing)) given similar inputs
- constraint strength and iterations must be well tuned ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L187-L189))

### Strict solver

A simplified and reduced set of constraints ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L51-L74)) is formed based on the loose solution and given to a slower but exact [hard constraint solver](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem#Flexible_CSPs):

- complex implementation (handled by [kiwi.js](https://github.com/IjzerenHein/kiwi.js/) / [Cassowary](https://en.wikipedia.org/wiki/Cassowary_(software)) library) ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/solver.js#L41-L90))
- performance suited to a few thousand constraints
- limited to [hard](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem#Flexible_CSPs) and [linear constraints](https://en.wikipedia.org/wiki/Linear_programming) ([code](https://github.com/quantumblacklabs/kedro-viz/blob/6572c5fa89ec57214c35e866d4584fa510b41aa3/src/utils/graph/constraints.js#L17-L23))
- finds an exact complete solution or no solution
- strong output similarity given similar inputs
- constraint priority can be optionally tuned ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/constraints.js#L57))

### Combining both solvers

The result is a layout in which all nodes are assigned positions that strongly respect the constraints, in a short amount of processing time.

<p align="center">
  <img width="1409" alt="kedro-viz-solvers" src="https://user-images.githubusercontent.com/45365769/117351124-41b2b600-aea5-11eb-9dfd-480c98e7ca7d.png">
</p>

## Routing

After constraints have been solved to produce the layout, routing edges is handled by a separate algorithm ([code](https://github.com/quantumblacklabs/kedro-viz/blob/main/src/utils/graph/routing.js)).

We found that in many cases a single straight line for each edge would cut through many nodes along the way. Routing moves around these nodes instead so the drawing is clear to read.

The routing algorithm implemented is roughly:

> - given positions decided for all nodes in _N_
> - for every edge _A → B_ in all edges _E_
>    - start at edge source node position _(A<sub>x</sub> A<sub>y</sub>)_
>    - draw a line to the closest empty point on each row after
>    - stop at the row of the edge target node
>    - draw a line to the edge target node position _(B<sub>x</sub> B<sub>y</sub>)_

The result is a relatively short path for the edge, where most segments tend to be vertical, with the process completed very quickly in practice ([code](https://github.com/quantumblacklabs/kedro-viz/blob/main/src/utils/graph/routing.js)).

<p align="center">
  <img width="500" alt="kedro-viz-routing" src="https://user-images.githubusercontent.com/45365769/117347854-73c21900-aea1-11eb-9ac7-6f16026c371f.png">
</p>

### Improved routing

Where there are multiple edges from a single node, we separate them further for better legibility ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/routing.js#L175-L202)) and order by direction to avoid introducing edge crossings ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/routing.js#L152-L167)).

In practice layout constraints also include additional space for edges to pass through, especially around highly connected nodes ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/utils/graph/layout.js#L246-L255)).

Routes are finally rendered to the user as smooth bezier curves ([code](https://github.com/quantumblacklabs/kedro-viz/blob/210974eb743a8116d6656ce41abe5ecee770dbcd/src/components/flowchart/draw.js#L243-L311)), as we find they are easier to read than straight lines.

## Results

You can see and interact with rendered graphs on the [Kedro Viz demo](https://quantumblacklabs.github.io/kedro-viz/) and explore the [code](https://github.com/quantumblacklabs/kedro-viz/tree/main/src/utils/graph) as implemented.
