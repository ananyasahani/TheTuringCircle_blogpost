export const POSTS = [
  {
    id: 10,
    slug: "why-the-turing-circle-exists",
    variant: "hero",
    author: {
      initials: "TTC",
      name: "The Turing Circle",
      meta: "Letters · Just now",
    },
    title: ["Why The Turing Circle ", "Exists"],
    titleHighlight: true,
    excerpt:
      "We started in our second year as a few mathematics and computing students with too many ideas and nowhere to put them. This is a short note on how it began, what we love, and the fact that yes, there are easter eggs.",
    content: `We started in our second year. A few of us studying mathematics and computing, sharing the same happy problem: too many ideas we thought were clever, and nowhere to show them off. A proof would live and die inside an assignment. A neat trick in code would run once and vanish. The good part, the bit that made us grin, almost never made it out into the open.

So we built somewhere to put it. A place to take an idea we found beautiful, or funny, or a little devious, and give it room to breathe. Written well enough that a friend from another course could follow along, and hiding a wink or two for the people who look closely.

### What we love
We like being clever, and we are not going to pretend otherwise. We like the elegant proof that lands like a punchline. We like the one line of code that does the work of twenty. We like a good pun in a variable name. Devilry, in small and well tested doses, is very much encouraged.

What we care about underneath the mischief is craft. Nothing hidden, nothing wasted, every step there because it earns its place. If we are going to be cheeky, we would like to be correct about it too.

### Look closely
Yes, there are easter eggs. Some are in the writing. Some are in the site. We are not going to tell you where, because that would rather defeat the point. If you find one, consider it a handshake from whoever hid it.

### How it has grown
We are in our fourth year now, and the Circle has grown up alongside us. We have learned more than we expected, been wrong plenty, and enjoyed the company more than any of us will admit in writing.

### What we hope it becomes
Mostly, we hope it keeps going, and keeps its sense of humour. That whoever picks this up in a later year finds it sharp, warm, and worth adding a trick or two of their own to. Write about what you find beautiful. Take your time. Leave something clever for the next person to discover.

Thanks for reading. There is at least one easter egg on this very page.`,
    image: "/editorial/glass-ribbon.png",
    stats: { views: "0", comments: 0 },
    tags: [
      { label: "Letters", style: "gold" },
      { label: "The Circle", style: "muted" },
    ],
  },
  {
    id: 9,
    slug: "building-a-place-where-mathematics-moves",
    variant: "hero",
    author: {
      initials: "TTC",
      name: "The Turing Circle",
      meta: "Projects & Process · 1h ago",
    },
    title: ["Building a Place Where ", "Mathematics Moves"],
    titleHighlight: true,
    excerpt:
      "Why we built an interactive mathematics laboratory, what the particle system taught us, and how simulations can turn abstract ideas into questions a visitor can manipulate.",
    content: `The project began with a dissatisfaction: mathematical ideas are often presented after all the movement has been removed from them. A graph appears as a finished diagram. An algorithm appears as pseudocode. A surface appears as a formula. These forms are precise, but they hide the process by which structure develops.

We wanted to build a place where a visitor could interrupt that process. Change the rule. Advance one layer. Watch a search frontier expand. See a network lose distinction as information is repeatedly averaged. The result became the Turing Circle Project Lab: part visualization, part instrument, and part argument about how technical ideas should be communicated.

### Why Interaction Matters
An animation can still be passive. It may be beautiful while asking nothing from the viewer. We treated interaction as a way to expose assumptions rather than as decoration.

In the particle field, the same points become a graph, an orbital sketch, a matrix, or an attractor. Keeping the visual vocabulary stable makes the changed rule easier to notice. In the pathfinding modes, the final route matters less than the shape of the search. Dijkstra expands without directional information; A* spends a heuristic to narrow its attention.

The visitor is not only shown a result. They are given a way to compare the work that produced it.

### The Particle System
The main field is built with Three.js and buffer geometry. Each particle stores position and color in typed arrays that can be updated without creating thousands of React elements. Every visualization mode precomputes a target geometry. The render loop interpolates current positions toward those targets, preserving continuity while the mathematical interpretation changes.

Connections are generated from local distance checks. Colors carry state in algorithm modes: unvisited nodes remain dim, the frontier becomes visible, explored nodes leave a fading trail, and the final path resolves in white.

Performance shaped the design. Pixel density is capped, connection checks are sampled, the heavier surface engine pauses when it leaves the viewport, and mobile devices receive less work. These constraints are not separate from the experience. A model that drops frames stops communicating change clearly.

### A Surface You Can Write
MosDes is the in-house surface explorer. A visitor enters an expression z = f(x, y, t), and the system evaluates it over a field of points. Presets include waves, ripples, saddles, and decaying peaks. Particle and vector views reveal two different readings of the same function: height and local orientation.

The expression parser is deliberately constrained. Earlier prototypes evaluated generated JavaScript directly, which was flexible but unsafe. The current version compiles mathematical expressions with an explicit symbol whitelist. Building an interactive technical tool also means deciding what the input is allowed to mean.

### Graph Intelligence
The GNN lab makes message passing visible. Every node begins with a two-dimensional feature vector. One layer gathers neighboring vectors using mean, sum, or max aggregation, then transforms the result. Visitors can switch graph structures and inspect a selected node after every pass.

Repeated averaging produces an important failure mode: over-smoothing. Node embeddings become increasingly similar until communities that were initially distinct are difficult to separate. The lab turns that phrase into a measurable change in feature spread.

### Beliefs in Public
The collective-behavior lab studies a different network: people observing people. Its coordination mode shows how expectations can select between multiple equilibria even when neither option is intrinsically superior. Its cascade mode reveals private signals one participant at a time.

Later participants observe earlier decisions but not the evidence behind them. A public majority can therefore become stronger while the underlying information remains weak. This connects game theory, Bayesian updating, and institutional design in a form that can be explored in under a minute.

### Being Honest About Models
Not every mode is a scientific simulation. Some are geometric constructions or conceptual sketches. The project now says so directly. A cluster inspired by the three-body problem is not the same thing as numerically integrating gravity. A visual metaphor becomes misleading when its simplifications are hidden.

Our standard is not photorealism. It is legibility: what does each point represent, which rule changes it, and what claim can the result support?

### What It Means to Us
The Turing Circle sits between mathematics and computing, but the interesting work happens when that boundary becomes porous. An equation becomes a surface. A graph becomes an algorithm, then a neural network, then a model of social belief. Code gives the idea time, motion, and response.

This project is not a map of everything we study. It is a statement about how we want to study: by making assumptions explicit, building things that can be questioned, and treating explanation as a technical craft of its own.`,
    image: "/editorial/project-lab.svg",
    stats: { views: "1.2k", comments: 18 },
    tags: [
      { label: "Design", style: "gold" },
      { label: "Engineering", style: "muted" },
    ],
  },
  {
    id: 8,
    slug: "fibonacci-is-not-natures-secret-code",
    variant: "hero",
    author: {
      initials: "TTC",
      name: "The Turing Circle",
      meta: "Patterns & Growth · 2h ago",
    },
    title: ["Fibonacci Is Not Nature's ", "Secret Code"],
    titleHighlight: true,
    excerpt:
      "The Fibonacci sequence appears in flowers, shells, and branching systems, but not because nature is solving a textbook recurrence. The real explanation is more interesting.",
    content: `The Fibonacci sequence is easy to recognize: begin with 1 and 1, then obtain each new term by adding the previous two. Its ratios approach the golden ratio, roughly 1.618. Once you know this, it becomes tempting to find Fibonacci numbers everywhere.

Some examples are real. Sunflower seed spirals often occur in neighboring Fibonacci counts. Pinecones and pineapples display similar families of spirals. But the common explanation - that nature somehow prefers a beautiful number - mistakes the result for the mechanism.

### Start With the Growth Rule
Plants produce new leaves or seeds near a growing tip. If each new element appeared directly above the last one, lower leaves would be shaded and seeds would leave large gaps. A turn of approximately 137.5 degrees, the golden angle, distributes successive elements unusually well.

The golden angle is difficult to approximate with a simple fraction of a full turn. That means new elements take a long time to line up with old ones. The visible spiral counts emerge from this packing process, and neighboring counts are frequently Fibonacci numbers because ratios of consecutive Fibonacci terms are unusually good rational approximations to the golden ratio.

### Shells Are a Different Story
Many shells grow approximately as logarithmic spirals: the shape stays similar while its scale increases. The golden ratio can describe one particular logarithmic spiral, but most shells do not use that exact value. A spiral alone is not evidence of Fibonacci growth.

The broader principle is scale invariance. An organism can keep the same overall shape while adding material at the edge. That mechanism produces a family of spirals, not one sacred curve.

### Pattern Matching Needs a Denominator
If we count only the flowers that fit the story, Fibonacci will look universal. The correct question is comparative: how many specimens follow the pattern, how close are their counts, and which alternative growth rules predict the misses?

This is a useful habit beyond botany. A pattern becomes evidence only when we specify what else could have happened.

### The Better Wonder
The lesson is not that nature contains a hidden numerical code. It is that simple local constraints - limited space, repeated growth, and competition for light - can generate global structure. Fibonacci numbers are one mathematical fingerprint of that process.

That explanation is less mystical, but it is more powerful. It tells us when the pattern should appear, when it should fail, and what to measure next.`,
    image: "/editorial/fibonacci-field.svg",
    stats: { views: "2.4k", comments: 34 },
    tags: [
      { label: "Math", style: "gold" },
      { label: "Nature", style: "muted" },
    ],
  },
  {
    id: 7,
    slug: "when-the-measure-becomes-the-target",
    variant: "blueprint",
    author: {
      initials: "AK",
      name: "Ankur Kumar",
      meta: "Decision Theory · 7h ago",
    },
    title: "When the Measure Becomes the Target",
    excerpt:
      "Metrics work because they correlate with goals. Optimization breaks that quiet agreement by searching for ways to raise the number without producing the result.",
    content: `A metric is a compressed description of something we care about. Test scores stand in for learning. Response time stands in for service quality. Publication count stands in for research output. The compression is useful because the real goal is usually too complicated to inspect continuously.

Goodhart's law describes what happens next: when a measure becomes a target, it ceases to be a good measure. This is often quoted as a warning against metrics. A more useful reading is that optimization changes the data-generating process.

### Correlation Before Pressure
Before a target is introduced, people have little reason to manipulate the proxy. Faster response times may genuinely indicate a healthier service. Once bonuses, rankings, or public status depend on the number, every participant gains an incentive to find the cheapest way to move it.

The metric did not suddenly become irrational. The environment around it changed.

### The Optimizer Finds the Gap
Any proxy differs from its goal. Under weak pressure, that gap may be harmless. Strong optimization searches precisely for cases where the gap is largest: easy tests that inflate scores, trivial publications that raise counts, or requests closed before the underlying problem is solved.

This is why powerful optimizers are dangerous even when their objective seems sensible. They do not need malice. They only need access to degrees of freedom the designer failed to model.

### Use a Dashboard, Not a Number
One defense is to track multiple measures that fail in different ways. Speed can be paired with error rate and user-reported resolution. Research output can be examined alongside replication, citation quality, and long-term contribution.

Multiple metrics do not eliminate gaming, but they make the cheapest exploit harder and disagreements more visible.

### Preserve Human Review
Metrics are strongest as attention-directing tools. They tell us where to look, not what final judgment to make. A sharp change should trigger investigation rather than automatic reward or punishment.

The practical question is never simply "What should we measure?" It is "How will behavior change once people know we are measuring it?" A metric without that second question is not a control system. It is an invitation to optimize the wrong thing.`,
    image: "/editorial/goodhart-gap.svg",
    stats: { views: "1.9k", comments: 28 },
    tags: [
      { label: "Decision Theory", style: "gold" },
      { label: "Systems", style: "muted" },
    ],
  },
  {
    id: 6,
    slug: "small-probabilities-large-attention",
    variant: "minimal",
    author: {
      initials: "R",
      name: "Roy",
      meta: "Risk & Probability · 12h ago",
    },
    title: "Small Probabilities Deserve Large Attention",
    excerpt:
      "A rare event can dominate a decision when its consequences are large enough. Expected value is the beginning of the analysis, not the end.",
    content: `People are often accused of overreacting to vivid, unlikely risks. We fear plane crashes more than long drives and dramatic failures more than slow deterioration. The correction is usually to focus on probability. But probability alone is not enough.

A one-percent event that costs one unit is minor. A one-percent event that permanently destroys a system may determine the entire decision. Low probability and low importance are different claims.

### Start With Expected Value
Expected value multiplies each outcome by its probability. It is a useful common scale and prevents us from ignoring unlikely outcomes merely because they feel remote.

But the calculation is only as good as the probabilities and consequences supplied to it. In unfamiliar systems, both may be uncertain. Writing "0.1%" can create false precision rather than knowledge.

### Tails Change the Problem
Many everyday quantities have thin tails: extreme deviations become rapidly less likely. Other domains have fat tails, where rare events contribute a large share of total impact. Wealth, cyber incidents, pandemics, and project delays can behave more like the second category.

In a fat-tailed domain, an average can be a poor guide. A strategy that works on ordinary days may fail exactly when survival matters.

### Reversibility Is a Hidden Variable
When mistakes are cheap and reversible, experimentation is rational. When a decision is irreversible, uncertainty deserves a larger penalty. This is not fearfulness; it is an acknowledgement that future evidence cannot repair every loss.

The same logic supports small trials, staged deployments, backups, and circuit breakers. They convert one irreversible bet into a sequence of recoverable ones.

### Do Not Multiply Fantasy Numbers
Expected-value language can disguise speculation. Assigning tiny probabilities to enormous outcomes produces impressive numbers with little empirical content. A responsible analysis includes sensitivity: does the decision change if the probability is ten times larger or smaller?

The useful habit is to ask three questions together: how likely is the event, how large is the consequence, and how recoverable is the mistake? Any risk discussion that omits one of them is incomplete.`,
    image: "/editorial/fat-tail-risk.svg",
    stats: { views: "1.7k", comments: 23 },
    tags: [
      { label: "Math", style: "gold" },
      { label: "Risk", style: "muted" },
    ],
  },
  {
    id: 5,
    slug: "how-rational-people-form-wrong-cascades",
    variant: "hero",
    author: {
      initials: "AS",
      name: "Ananya Sahani",
      meta: "Collective Intelligence · 1d ago",
    },
    title: ["How Rational People Form ", "Wrong Cascades"],
    excerpt:
      "When we observe decisions but not the evidence behind them, copying the crowd can be individually reasonable and collectively disastrous.",
    content: `Imagine people entering a room one at a time and choosing between two doors. Each person receives a weak private signal about which door is correct, then sees every earlier choice.

The first person follows their signal. The second sees one action and has one signal. By the third or fourth person, the public sequence may appear stronger than any new private clue. Later participants begin ignoring their own information and follow the apparent consensus.

This is an information cascade. No participant needs to be foolish. The group can become confidently wrong through individually reasonable updates.

### Decisions Hide Evidence
An action is a lossy summary of the reasoning behind it. We see that someone chose a course, company, framework, or investment. We do not see whether their evidence was strong, whether they copied someone else, or whether constraints forced the choice.

Treating every public action as an independent vote counts the same evidence many times.

### Early Noise Becomes History
Cascades are path-dependent. A few noisy signals at the beginning can determine what later participants observe. Once a visible majority forms, contrary private evidence stops reaching the public record because people suppress it in their actions.

The consensus becomes stable without becoming more informed.

### Ask for Beliefs Before Discussion
Groups can preserve information by collecting independent estimates before people hear the room. Anonymous forecasts, written pre-mortems, and simultaneous votes reduce the pressure to conform and make disagreement measurable.

Another useful practice is to ask for confidence and evidence, not only a choice. Five people repeating one source should not count like five independent observations.

### Disagreement Has Information Value
A dissenting view may be wrong, but its existence tells us something about the distribution of private evidence. Systems that punish dissent destroy this signal and become more certain at the exact moment they become less informed.

The goal is not to resist every consensus. It is to distinguish consensus produced by shared evidence from consensus produced by observing one another. The visible pattern can look identical while the epistemic quality is completely different.`,
    image: "/editorial/information-cascade.svg",
    stats: { views: "3.2k", comments: 47 },
    tags: [
      { label: "Decision Theory", style: "gold" },
      { label: "Society", style: "muted" },
    ],
  },
  {
    id: 4,
    slug: "compression-and-understanding",
    variant: "blueprint",
    author: {
      initials: "AK",
      name: "Ankur Kumar",
      meta: "Information Theory · 1d ago",
    },
    title: "What Compression Teaches Us About Understanding",
    excerpt:
      "To understand a dataset is to find a shorter description that preserves what matters. The hard part is deciding what may safely be discarded.",
    content: `A list of a thousand coin flips usually requires nearly a thousand bits to record. A thousand alternating heads and tails can be described in a sentence. The second sequence is compressible because it contains a pattern.

This suggests an appealing view of understanding: a good explanation compresses many observations into a smaller set of rules. Newton's laws replace separate descriptions of falling apples, projectiles, and planetary motion with one framework.

### Prediction Is the Test
A short description is not automatically an explanation. "The data came from magic" is short but predicts nothing. Useful compression allows us to reconstruct observations or anticipate new ones.

This is why models are judged out of sample. Memorization can reproduce the past without discovering structure.

### Lossy Compression Is Everywhere
Human concepts are lossy. The category "chair" discards color, scratches, exact dimensions, and history while preserving features relevant to sitting. Expertise often consists of learning which details may be ignored for a particular purpose.

The same abstraction can fail when the purpose changes. Treating a user as an average session may help capacity planning and harm accessibility design.

### Simplicity Needs a Penalty
Given enough parameters, a model can fit almost any finite dataset. Penalizing complexity protects us from explanations that merely encode every exception. Occam's razor is not a claim that reality must be simple; it is a strategy for choosing among models that explain the same evidence.

Minimum description length makes this intuition explicit: prefer the model that gives the shortest combined description of the model and the unexplained data.

### Understanding Is Purpose-Relative
There is no single perfect compression. A physicist, an economist, and a designer may compress the same system differently because they need to predict different outcomes.

The important question is not whether an explanation is elegant. It is what information the explanation preserves, what it throws away, and whether those choices survive contact with the decision we are trying to make.`,
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1800&auto=format&fit=crop",
    stats: { views: "2.1k", comments: 25 },
    tags: [
      { label: "AI", style: "gold" },
      { label: "Information", style: "muted" },
    ],
  },
  {
    id: 3,
    slug: "simulations-are-arguments-not-oracles",
    variant: "minimal",
    author: {
      initials: "R",
      name: "Roy",
      meta: "Models & Reality · 2d ago",
    },
    title: "Simulations Are Arguments, Not Oracles",
    excerpt:
      "A simulation can make assumptions precise and consequences visible. It cannot rescue assumptions that were wrong before the code ran.",
    content: `A simulation produces detailed output: trajectories, confidence bands, heat maps, and precise timestamps. The detail can create an impression of authority. Yet every output is conditional on a model, parameters, initial state, and numerical method.

The simulation answers "What follows if these assumptions hold?" It does not answer "Do these assumptions hold?" That second question requires observation and comparison with reality.

### Precision Is Not Accuracy
A model can report six decimal places and still describe the wrong mechanism. Numerical precision concerns repeatability inside the model. Accuracy concerns correspondence with the world.

Confusing them is especially easy when the output is visual. Smooth motion feels physically plausible even when the update rule leaks energy or omits an important force.

### Calibrate Before Extrapolating
A useful model should reproduce data it was not directly fitted to. Calibration chooses parameters; validation tests whether the resulting system predicts withheld observations.

Passing one validation does not establish universal truth. It establishes a region in which the model has earned some trust.

### Sensitivity Is Part of the Result
If a small change in an uncertain input reverses the conclusion, that fragility matters more than the headline forecast. Sensitivity analysis should vary plausible assumptions and show which ones control the output.

Sometimes the honest conclusion is a range of qualitatively different futures, not one central curve.

### Models Coordinate Thought
Even an imperfect simulation can be valuable. It forces assumptions into an executable form, reveals contradictions, and gives people a shared object to criticize. Disagreement becomes specific: which parameter, mechanism, or boundary condition should change?

That is the right standard. A simulation is strongest when it improves the argument around a decision, not when it ends the argument by producing a complicated picture.`,
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1800&auto=format&fit=crop",
    stats: { views: "1.6k", comments: 21 },
    tags: [
      { label: "Math", style: "gold" },
      { label: "Science", style: "muted" },
    ],
  },
  {
    id: 2,
    slug: "prediction-is-better-than-confidence",
    variant: "blueprint",
    author: {
      initials: "AS",
      name: "Ananya Sahani",
      meta: "Forecasting · 3d ago",
    },
    title: "Prediction Is Better Than Confidence",
    excerpt:
      "Confidence is a feeling unless it is tied to an outcome. Forecasts turn vague certainty into something that can be scored, compared, and improved.",
    content: `Two people can both say they are confident while meaning completely different things. One means "more likely than not." The other means "I would be shocked to be wrong." Natural language hides this difference.

A forecast makes the claim explicit: a probability, a resolution condition, and a date. This does not guarantee correctness. It creates the possibility of learning.

### Probabilities Leave a Trail
If someone assigns 80 percent to ten events, roughly eight should occur over time. Calibration compares stated probabilities with observed frequencies. A forecaster who is right six times may have made better predictions than one who is right seven times if the probabilities were more honest and informative.

Proper scoring rules reward both accuracy and appropriate confidence. They penalize a confident error more than a cautious one.

### Define the Question
Many disputes survive because participants are forecasting different events. "Will this project work?" might refer to launching on time, attracting users, recovering costs, or remaining useful after a year.

Writing a resolvable question often reveals more disagreement than arguing about the answer.

### Update Without Shame
A forecast should change when evidence changes. Treating updates as inconsistency creates incentives to defend old positions. The better norm is to preserve the history: what probability was assigned, what new evidence arrived, and why the estimate moved.

This separates responsiveness from hindsight.

### Use Forecasts for Decisions
Not every belief needs a number. Forecasting is most useful when uncertainty affects action: staffing a project, choosing a deadline, planning capacity, or deciding whether to run an experiment.

The objective is not to turn conversation into arithmetic. It is to replace unaccountable certainty with claims that reality is allowed to grade.`,
    image:
      "https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1800&auto=format&fit=crop",
    stats: { views: "1.4k", comments: 18 },
    tags: [
      { label: "Decision Theory", style: "gold" },
      { label: "Probability", style: "muted" },
    ],
  },
  {
    id: 1,
    slug: "coordination-problems-look-like-personality-problems",
    variant: "hero",
    author: {
      initials: "TTC",
      name: "The Turing Circle",
      meta: "Game Theory · 4d ago",
    },
    title: ["Coordination Problems Look Like ", "Personality Problems"],
    excerpt:
      "When incentives and information are misaligned, blaming individuals feels satisfying and fixes very little.",
    content: `A team misses a deadline. One explanation is personal: someone was careless, indecisive, or uncommitted. Another explanation is structural: information arrived late, ownership overlapped, and admitting uncertainty carried a social cost.

Personality explanations are attractive because they identify a clear cause. Coordination problems are distributed across rules, incentives, and expectations. No single participant contains the failure.

### Local Rationality, Global Failure
In the prisoner's dilemma, each player has a reason to defect even though mutual cooperation would produce a better result. Real organizations contain softer versions of this pattern.

An engineer hides a delay because early disclosure is punished. A manager adds a buffer because estimates are unreliable. Stakeholders then treat every estimate as inflated, encouraging even larger buffers. Each move is locally understandable and collectively expensive.

### Common Knowledge Matters
It is not enough for everyone to know a fact. Coordination may require everyone to know that everyone knows it. Public deadlines, written ownership, and visible decisions create common knowledge that private messages do not.

This explains why a short meeting can sometimes resolve what many one-to-one conversations could not.

### Change the Payoff
Appeals to "communicate better" fail when communication remains costly. If reporting a risk reliably attracts blame, risks will remain hidden. A functioning system rewards early uncertainty and distinguishes a useful warning from poor execution.

Mechanism design begins with behavior as it is, not behavior as we wish it were.

### Diagnose Before Blaming
Before assigning a character flaw, ask what action was rewarded, what information was available, and what each person believed others would do. If replacing one individual leaves the same incentives intact, the problem will probably return.

This does not eliminate responsibility. It locates responsibility at the level where intervention can work. Sometimes a person needs to change. Often the game does.`,
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1800&auto=format&fit=crop",
    stats: { views: "1.8k", comments: 29 },
    tags: [
      { label: "Game Theory", style: "gold" },
      { label: "Society", style: "muted" },
    ],
  },
];
