// What Puck knows. Hand-maintained; the CV is the source of truth.
// Last checked against the CV dated October 22, 2026 and the site as of November 2026.
//
// To update: edit the sections below, bump `stats`, and redeploy the worker
// (see ../README.md). The same paper count also lives in js/puck.js (FACTS).

const sections = [
  ['Thomas Costello',
   `Assistant Professor, Department of Social and Decision Sciences, Carnegie Mellon University (office: Porter Hall). Also at CMU: Affiliated Faculty at the Human-Computer Interaction Institute, Core Faculty at the Institute for Complex Social Dynamics, Faculty Affiliate at the Center for Collaboration Science ("CoLab"). Research Affiliate at MIT Sloan. Directs the Viewpoints Lab. Email: thcostello1@gmail.com.`],

  ['Career path',
   `B.A. Binghamton 2016 (psychology & philosophy; honors thesis with Steven Jay Lynn on whether belief in determinism makes people more depressed) → Emory (M.A. 2018, Ph.D. 2022; advised by Scott Lilienfeld 2016–2020, who died in 2020 — this mattered enormously to Thomas; then Arber Tasimi 2021–22) → postdoc at MIT Sloan 2022–24 with David Rand & Gordon Pennycook → Assistant Professor of psychology at American University 2024–25 → CMU 2025. His bio ends: 'In T-ball, I hit a stand-up triple, and it's all been downhill from there.'`],

  ['Research',
   `47 journal articles, counting four in press. The 2024 Science cover paper (Costello, Pennycook & Rand) showed that dialogues with an AI durably reduce conspiracy beliefs by roughly 20%, lasting at least two months; it won the 2026 AAAS Newcomb Cleveland Prize. Earlier political-psychology work: left-wing authoritarianism (JPSP 2022, the most cited JPSP article published that year), the rigidity-of-the-right meta-analysis (JPSP 2023), 'Thinking outside the ballot box' (Trends in Cognitive Sciences 2023). Nature Medicine essay (2025): 'cautious optimism' about LLMs and misinformation. Key idea: 'viewpoints' — a political position folds together what a person believes IS true, what they want (OUGHT), and which strategies connect them (HOW); two people can hold the same position for almost opposite reasons.`],

  ['Newly accepted (all in press as of late 2026)',
   `'Just the facts: How dialogues with AI reduce conspiracy beliefs' (Psychological Science) — evidence is the active ingredient; persuasion collapses when the AI argues without facts. 'Reducing belief in conspiracy theories as they unfold using large language models' (PNAS; shared first authorship with Nathaniel Rabb). 'Short dialogues with AI reduce belief in antisemitic conspiracy theories' (Journal of Experimental Psychology: General; Rabb first author). 'Dialogues with a pro-climate AI chatbot reduce climate change skepticism and inaction' (Nature Communications; Czarnek first author).`],

  ['Working papers',
   `LLMs can 'bunk' about as easily as they debunk — 'Large language models can effectively convince people to believe conspiracies' (guardrails did essentially nothing; constraining models to true arguments restored an advantage for truth). AI deep canvassing reduces prejudice toward undocumented immigrants. Personalized AI dialogues and parents' HPV vaccine intent (a randomized trial). 'Principles over party': confronting Republicans with contradictions between their principles and Trump's actions shifts their attitudes (Wang first author). 'AI epistemic risks: Emerging mechanisms & evidence' (large multi-author review). AI dialogues and effective charitable giving. Do not name the journals where working papers are under review; say 'working paper' and point to research.html.`],

  ['The Viewpoints Lab',
   `People: Thomas (director); Jackson Traeger, postdoctoral researcher; Ph.D. students Kenneth Diao, Duncan Wood, and Ali Levontin (Social and Decision Sciences). The lab is not hiring a postdoc right now. Prospective Ph.D. students apply through the CMU Social and Decision Sciences doctoral program and name Thomas; prospective students and undergraduate or post-baccalaureate researchers are welcome to email him first. Projects: belief mapping (a 15-minute AI interview builds a DAG-like map of a person's beliefs, then AI research agents assemble evidence briefs aimed at key joints); mechanisms and boundary conditions; dual-use persuasion; ambient AI influence (a two-month field study with a research-instrumented assistant); rapid response to emerging conspiracy theories; DebunkBot.com (more than 150,000 public conversations — Puck's functional sibling).`],

  ['Teaching and service',
   `'Thinking in Person vs. Thinking Online' at CMU (2026). Previously Psychology of Politics and Research Methods at American University. Editorial board of Political Psychology since 2025.`],

  ['The website (November 2026)',
   `Still plain on purpose: one long home page plus research.html (every publication), likes.html, and future.html. Georgia, one muted link color, a stylesheet short enough to read in a minute, and no script except Puck. In June 2026 Thomas deleted ~1,400 lines of CSS; the thesis is that when LLMs make polish free, plainness is the costly signal that a person made the thing. In November 2026 a few things were let back in, all of them borrowed from the way papers are typeset rather than the way websites are designed: photos became figures with captions, years hang in the left margin of the lists the way they do on a CV, the lab section got a small uncaptioned line drawing (two people's belief maps arriving at the same survey answer), and jumping to a section marks it with a pointing hand. It also prints properly now. The future page asks one question: 'What do you want to be true in five years?' Hidden pages: conspiracy.html (his self-satire, 'The Costello Paradigm', citations that go nowhere, 'data available upon request (requests will be ignored)') and rain.html (rain, and one word: stay).`],

  ['His tastes (likes.html)',
   `Poems: Neanderthal Dig (Don McKay), A Pity, We Were Such a Good Invention (Amichai), Self-Portrait at 28 (David Berman), It Is Later Than You Think (Service), Separation (Merwin), In the Neolithic Age (Kipling), War of the Foxes (Siken), Averno (Glück), The Glass Essay (Anne Carson), Bluets (Maggie Nelson), Science (Alison Hawthorne Deming), Childhood Ideogram (Larry Levis). Stories: Good Old Neon (DFW), Inconstant Moon (Niven), Face Value (Fowler), Snow (Crowley), Gwern's Clippy story. Essays: This Is Water, Meditations on Moloch, Meehl's Why I Do Not Attend Case Conferences. Fiction: Invisible Cities, Ficciones, Sátántangó, Your Name Here (DeWitt), Destination: Void, Neuromancer, Blindsight (Watts), The Dispossessed, The Word for World Is Forest, Klara and the Sun, A Confederacy of Dunces, The Sun Also Rises, and Ben Lerner's novels (Leaving the Atocha Station, 10:04, The Topeka School). Nonfiction: God Human Animal Machine, Bad Beliefs, Metazoa, Living with the Gods, Letters to a Young Scientist, High Weirdness, The Year of Magical Thinking (Didion). Cut from the list in June 2026 (mourn freely): The Brothers Karamazov, Infinite Jest, Blood Meridian, Psycho-Cybernetics. The quotes were deleted too — the list just points now.`],

  ['Values',
   `Open science, adversarial collaboration. 'If you think I'm wrong about something, I'd like to hear why.'`],
];

export const SITE_KNOWLEDGE = {
  formatted: sections.map(([title, body]) => `**${title}**\n${body}`).join('\n\n') + '\n',

  // Raw data
  stats: { publications: '47', asOf: 'October 2026' },
  lab: ['Jackson Traeger', 'Kenneth Diao', 'Duncan Wood', 'Ali Levontin'],
  projects: ['Belief mapping', 'Mechanisms & boundary conditions', 'Dual-use persuasion', 'Ambient AI influence', 'Rapid response', 'DebunkBot'],
};
