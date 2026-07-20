const path = (className, d) => `<path class="${className}" d="${d}"/>`;

const diagram = ({ title, limb, padding, device, wrap, labels = "" }) => Object.freeze({
  title,
  viewBox: "0 0 320 220",
  body: [
    path("imm-diagram-limb", limb),
    path("imm-diagram-padding", padding),
    path("imm-diagram-device", device),
    path("imm-diagram-wrap", wrap),
    labels
  ].join("")
});

export const DIAGRAMS = Object.freeze({
  "sugar-tong": diagram({
    title: "Sugar-tong splint",
    limb: "M72 36Q34 58 55 95L130 171Q145 186 165 181L268 159",
    padding: "M70 31Q26 57 50 100L126 177Q145 194 168 188L274 164",
    device: "M68 27Q21 56 45 104L122 181Q143 201 170 194L279 169",
    wrap: "M43 67L70 58M47 92L78 78M64 119L91 98M84 140L109 118M106 163L130 140M134 183L148 157M167 191L165 163M202 185L197 158M236 178L230 151M269 171L263 144",
    labels: `<g class="imm-diagram-callout"><path d="M51 101L16 130"/><text x="8" y="145">Runs around elbow</text></g><g class="imm-diagram-callout"><path d="M276 169L298 188"/><text x="214" y="206">Digits remain visible</text></g>`
  }),
  "sling": diagram({
    title: "Sling",
    limb: "M105 48L137 104L216 136M137 104L188 83",
    padding: "M94 51L133 113L224 146",
    device: "M82 39L134 122L232 153L187 78Z",
    wrap: "M84 40Q157 2 213 40",
    labels: ""
  }),
  "sling-swathe": diagram({
    title: "Sling and swathe",
    limb: "M105 48L137 104L216 136M137 104L188 83",
    padding: "M94 51L133 113L224 146",
    device: "M82 39L134 122L232 153L187 78ZM58 91Q158 123 257 93",
    wrap: "M61 83Q159 112 254 84M61 99Q159 131 254 101",
    labels: ""
  }),
  "coaptation": diagram({
    title: "Coaptation splint",
    limb: "M157 28L159 175",
    padding: "M139 37L139 178Q158 203 178 178L178 38",
    device: "M133 34L133 182Q158 211 184 182L184 34",
    wrap: "M132 66L184 66M132 98L184 98M132 130L184 130M133 162L183 162",
    labels: ""
  }),
  "posterior-long-arm": diagram({
    title: "Posterior long-arm splint",
    limb: "M95 42L113 121Q117 139 137 143L251 143",
    padding: "M82 43L101 126Q107 151 137 156L254 156",
    device: "M76 44L95 130Q102 160 137 166L257 166",
    wrap: "M84 78L105 73M91 111L112 106M111 146L126 126M152 165L151 143M190 165L189 143M228 165L227 143",
    labels: ""
  }),
  "volar-wrist": diagram({
    title: "Volar wrist splint",
    limb: "M52 116L245 108L286 91",
    padding: "M66 128L250 120",
    device: "M72 136L252 128",
    wrap: "M100 103L105 133M137 101L141 132M174 100L178 131M211 98L215 129",
    labels: ""
  }),
  "position-of-function": diagram({
    title: "Hand position of function",
    limb: "M60 130L171 115L217 73M171 115L229 101M171 115L231 129M171 115L216 157",
    padding: "M151 122Q189 129 226 104",
    device: "M69 148L167 134Q203 144 246 120",
    wrap: "M111 124L116 141M145 119L151 136M181 117L185 137M214 108L219 128",
    labels: `<g class="imm-diagram-callout"><path d="M170 133L154 177"/><text x="107" y="195">MCP joints flexed</text></g>`
  }),
  "knee-immobilizer": diagram({
    title: "Knee immobilizer",
    limb: "M156 22L154 198",
    padding: "M133 58L132 177M177 58L176 177",
    device: "M126 46L125 188M184 46L183 188",
    wrap: "M126 72L184 72M125 104L183 104M125 136L183 136M125 168L183 168",
    labels: ""
  }),
  "long-leg-posterior": diagram({
    title: "Long-leg posterior splint",
    limb: "M151 22L154 176L246 181",
    padding: "M135 30L138 188L251 195",
    device: "M128 34L131 196L255 203",
    wrap: "M130 70L157 70M131 108L158 108M132 146L159 146M143 192L145 175M181 198L183 179M219 201L221 181",
    labels: ""
  }),
  "traction-splint": diagram({
    title: "Traction splint",
    limb: "M61 115L257 115",
    padding: "M60 94L263 94M60 136L263 136",
    device: "M48 82L278 82M48 148L278 148M48 82L48 148M278 82L278 148",
    wrap: "M90 82L90 148M135 82L135 148M180 82L180 148M225 82L225 148",
    labels: `<g class="imm-diagram-callout"><path d="M278 115L307 115"/><text x="249" y="102">Inline traction</text></g>`
  }),
  "buck-traction": diagram({
    title: "Buck traction",
    limb: "M45 94L250 121",
    padding: "M173 102L252 113",
    device: "M171 92L258 105L282 115",
    wrap: "M184 96L180 118M202 99L198 121M220 102L216 123M238 105L234 126",
    labels: `<g class="imm-diagram-callout"><path d="M282 115L309 115"/><text x="251" y="99">Ordered weight</text></g>`
  }),
  "skeletal-traction": diagram({
    title: "Skeletal traction overview",
    limb: "M43 103L245 116",
    padding: "M190 98L190 137",
    device: "M185 82L185 151M174 91L196 91M174 142L196 142M185 116L281 116",
    wrap: "M281 116Q297 116 297 132L297 155",
    labels: `<g class="imm-diagram-callout"><path d="M185 84L153 50"/><text x="97" y="40">Transosseous pin</text></g>`
  }),
  "position-of-comfort": diagram({
    title: "Position of comfort",
    limb: "M63 92Q138 117 257 111",
    padding: "M73 125Q151 143 251 135",
    device: "M58 137Q154 168 266 146L250 177Q151 197 67 166Z",
    wrap: "M99 148Q157 164 225 154",
    labels: `<g class="imm-diagram-callout"><path d="M190 157L224 196"/><text x="157" y="211">Support in comfort</text></g>`
  })
});

export function renderImmobilizationDiagram({ id, document, alt }) {
  const figure = document.createElement("figure");
  figure.className = "imm-diagram";
  const item = Object.hasOwn(DIAGRAMS, id) ? DIAGRAMS[id] : undefined;

  if (!item) {
    const fallback = document.createElement("p");
    fallback.className = "imm-diagram-fallback";
    fallback.textContent = alt;
    figure.append(fallback);
    return figure;
  }

  figure.innerHTML = `<figcaption>${item.title}</figcaption><svg viewBox="${item.viewBox}" role="img" aria-label=""></svg>`;
  const svg = figure.querySelector("svg");
  svg.setAttribute("aria-label", alt);
  svg.innerHTML = item.body;
  return figure;
}
