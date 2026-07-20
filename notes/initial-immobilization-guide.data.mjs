export const IMMOBILIZATION_GUIDE_ENTRIES = [
  {
    id: "clavicle-fracture",
    section: "Upper extremity",
    label: "Clavicle fracture",
    device: "Sling for comfort",
    bullets: [
      "Support the arm in a sling for comfort.",
      "Reassess the skin and distal neurovascular status after immobilization.",
      "Evaluate for associated chest injury and displacement."
    ],
    warning: "Seek urgent orthopedic evaluation for open injury, threatened skin, neurovascular compromise, significant chest injury, or severe displacement in an appropriate operative candidate.",
    diagram: "sling",
    headingId: "clavicle-fracture",
    searchTerms: ["clavicle", "collarbone", "sling"],
    diagramAlt: "An arm supported in a sling with the elbow flexed and the forearm resting across the torso."
  },
  {
    id: "scapula-fracture",
    section: "Upper extremity",
    label: "Scapula fracture",
    device: "Sling for comfort",
    bullets: [
      "Support the arm in a sling for comfort.",
      "Perform and document a distal neurovascular examination.",
      "Evaluate the chest and other areas for associated injury."
    ],
    warning: "Obtain orthopedic guidance when the fracture pattern or an associated injury requires it.",
    diagram: "sling",
    headingId: "scapula-fracture",
    searchTerms: ["scapula", "shoulder blade", "sling"],
    diagramAlt: "An arm supported in a sling with the elbow flexed and the forearm resting across the torso."
  },
  {
    id: "shoulder-dislocation",
    section: "Upper extremity",
    label: "Shoulder dislocation",
    device: "Sling with optional swathe after reduction",
    bullets: [
      "Evaluate for an associated greater-tuberosity or proximal-humerus fracture before forceful reduction.",
      "Repeat and document axillary-nerve and distal neurovascular examinations after reduction.",
      "Obtain post-reduction imaging when appropriate and confirm stability.",
      "Immobilize in a sling, adding a swathe when clinically appropriate."
    ],
    warning: "Do not assume an apparent dislocation is isolated before attempting forceful reduction.",
    diagram: "sling-swathe",
    headingId: "shoulder-dislocation",
    searchTerms: ["shoulder", "dislocation", "axillary nerve", "sling", "swathe"],
    diagramAlt: "The injured arm is supported in a sling and secured against the torso by a broad swathe."
  },
  {
    id: "proximal-humerus-fracture",
    section: "Upper extremity",
    label: "Proximal humerus fracture",
    device: "Sling with optional swathe",
    bullets: [
      "Support the arm in a sling, with or without a swathe, for comfort.",
      "Reassess and document distal neurovascular status after immobilization.",
      "Avoid routine manipulation of the fracture."
    ],
    warning: "Obtain urgent orthopedic consultation for significant displacement or a fracture-dislocation.",
    diagram: "sling-swathe",
    headingId: "proximal-humerus-fracture",
    searchTerms: ["proximal humerus", "shoulder fracture", "sling", "swathe"],
    diagramAlt: "The injured arm is supported in a sling and may be secured against the torso by a broad swathe."
  },
  {
    id: "humeral-shaft-fracture",
    section: "Upper extremity",
    label: "Humeral shaft fracture",
    device: "Coaptation splint",
    bullets: [
      "Apply a coaptation splint for initial immobilization.",
      "Use gentle longitudinal traction when needed for alignment and avoid repeated aggressive manipulation.",
      "Document radial-nerve function before and after immobilization.",
      "Allow gravity to assist alignment when the splint is correct and the patient tolerates the position."
    ],
    warning: "Excessive sling support beneath the elbow can remove the intended gravity-assisted alignment.",
    diagram: "coaptation",
    headingId: "humeral-shaft-fracture",
    searchTerms: ["humerus", "shaft", "coaptation", "radial nerve"],
    diagramAlt: "A padded U-shaped coaptation splint extends along both sides of the upper arm and around the elbow."
  },
  {
    id: "distal-humerus-fracture",
    section: "Upper extremity",
    label: "Distal humerus fracture",
    device: "Posterior long-arm splint",
    bullets: [
      "Apply a well-padded posterior long-arm splint.",
      "Use an elbow angle near 90 degrees only when swelling, fracture pattern, vascular status, and orthopedic recommendations permit.",
      "Recheck and document distal neurovascular status after immobilization."
    ],
    warning: "Do not force elbow flexion if it worsens perfusion, pain, or skin tension.",
    diagram: "posterior-long-arm",
    headingId: "distal-humerus-fracture",
    searchTerms: ["distal humerus", "supracondylar", "elbow", "posterior splint"],
    diagramAlt: "A padded posterior splint follows the back of the upper arm around the flexed elbow and along the forearm."
  },
  {
    id: "olecranon-fracture",
    section: "Upper extremity",
    label: "Olecranon fracture",
    device: "Posterior long-arm splint",
    bullets: [
      "Apply a well-padded posterior long-arm splint.",
      "Select elbow flexion according to the fracture, swelling, soft tissues, and orthopedic direction.",
      "Inspect the skin over the olecranon and document distal neurovascular status."
    ],
    warning: "Threatened skin over the subcutaneous olecranon requires urgent treatment.",
    diagram: "posterior-long-arm",
    headingId: "olecranon-fracture",
    searchTerms: ["olecranon", "elbow fracture", "posterior splint"],
    diagramAlt: "A well-padded posterior long-arm splint supports the elbow and forearm without pressure on the olecranon."
  },
  {
    id: "radial-head-fracture",
    section: "Upper extremity",
    label: "Radial head fracture",
    device: "Sling or brief posterior splint",
    bullets: [
      "Use a sling or brief posterior splint for comfort in a nondisplaced or minimally displaced injury.",
      "Begin early elbow motion when clinically appropriate to limit stiffness.",
      "Evaluate for mechanical block, instability, interosseous-membrane injury, and wrist pain."
    ],
    warning: "Avoid prolonged routine immobilization unless instability, pain, or associated injury requires it.",
    diagram: "sling",
    headingId: "radial-head-fracture",
    searchTerms: ["radial head", "elbow", "sling", "mechanical block"],
    diagramAlt: "An arm supported in a sling with the elbow flexed and the forearm resting across the torso."
  },
  {
    id: "elbow-dislocation",
    section: "Upper extremity",
    label: "Elbow dislocation",
    device: "Posterior long-arm splint after reduction",
    bullets: [
      "Repeat the neurovascular examination and obtain post-reduction imaging.",
      "Apply a posterior long-arm splint, commonly near 90 degrees when appropriate.",
      "Confirm that the joint remains concentrically reduced.",
      "Tailor flexion to instability direction, fractures, swelling, and vascular findings."
    ],
    warning: "A fixed 90-degree position is not appropriate if it compromises perfusion or stability.",
    diagram: "posterior-long-arm",
    headingId: "elbow-dislocation",
    searchTerms: ["elbow", "dislocation", "reduction", "posterior splint"],
    diagramAlt: "A padded posterior long-arm splint supports the reduced elbow in a clinically selected flexion angle."
  },
  {
    id: "terrible-triad-of-the-elbow",
    section: "Upper extremity",
    label: "Terrible triad of the elbow",
    device: "Posterior long-arm splint after reduction",
    bullets: [
      "Reduce gently and repeat the neurovascular examination.",
      "Apply a posterior long-arm splint in the position of greatest stability.",
      "Confirm alignment with post-reduction imaging."
    ],
    warning: "Obtain urgent orthopedic consultation because this fracture-dislocation is frequently unstable and commonly requires operative management.",
    diagram: "posterior-long-arm",
    headingId: "terrible-triad-of-the-elbow",
    searchTerms: ["terrible triad", "elbow", "radial head", "coronoid", "dislocation"],
    diagramAlt: "A padded posterior long-arm splint supports the reduced elbow in its position of greatest stability."
  },
  {
    id: "forearm-fracture",
    section: "Upper extremity",
    label: "Forearm fracture",
    device: "Sugar-tong splint",
    bullets: [
      "Run the splint from one side of the MCP joints around the elbow to the other side.",
      "Use the sugar-tong configuration to control pronation and supination.",
      "Keep the forearm neutral and wrist near neutral or slightly extended unless the injury requires otherwise."
    ],
    warning: "Adult both-bone fractures, Galeazzi or Monteggia injuries, open fractures, and neurovascular compromise require urgent orthopedic evaluation.",
    diagram: "sugar-tong",
    headingId: "forearm-fracture",
    searchTerms: ["forearm", "radius", "ulna", "Galeazzi", "Monteggia", "sugar tong"],
    diagramAlt: "A padded sugar-tong splint runs from one side of the MCP joints around the flexed elbow to the other side."
  },
  {
    id: "distal-radius-fracture",
    section: "Upper extremity",
    label: "Distal radius fracture",
    device: "Sugar-tong splint after reduction",
    bullets: [
      "Use a sugar-tong splint after reduction to control wrist motion and forearm rotation.",
      "After reduction, keep the wrist near neutral or in slight extension; avoid excessive flexion and tight circumferential wrapping.",
      "For a stable nondisplaced fracture, a volar wrist or short-arm splint may be appropriate."
    ],
    warning: "Recheck and document distal pulses, capillary refill, motor function, and sensation after application.",
    diagram: "sugar-tong",
    headingId: "distal-radius-fracture",
    searchTerms: ["wrist", "radius", "Colles", "sugar tong"],
    diagramAlt: "A padded sugar-tong splint runs from the hand around the flexed elbow and returns to the hand, leaving the digits visible."
  },
  {
    id: "femoral-neck-fracture",
    section: "Lower extremity",
    label: "Femoral neck fracture",
    device: "Position of comfort",
    bullets: [
      "Provide analgesia and position for comfort.",
      "Obtain prompt orthopedic consultation and operative planning.",
      "Use Buck traction only when specifically ordered for comfort or alignment.",
      "Obtain advanced imaging according to the clinical scenario and local protocol when suspicion persists despite negative or equivocal radiographs."
    ],
    warning: "Routine preoperative traction is not supported for every hip fracture.",
    diagram: "position-of-comfort",
    headingId: "femoral-neck-fracture",
    searchTerms: ["femoral neck", "hip fracture", "occult", "Buck traction"],
    diagramAlt: "The injured lower extremity is supported in the patient's tolerated position without forced alignment."
  },
  {
    id: "intertrochanteric-fracture",
    section: "Lower extremity",
    label: "Intertrochanteric fracture",
    device: "Position of comfort",
    bullets: [
      "Provide analgesia and position for comfort.",
      "Obtain prompt orthopedic evaluation and operative planning.",
      "Use Buck traction only when orthopedics orders it and it improves comfort or alignment."
    ],
    warning: "Do not apply traction automatically to every proximal-femur fracture.",
    diagram: "position-of-comfort",
    headingId: "intertrochanteric-fracture",
    searchTerms: ["intertrochanteric", "hip fracture", "proximal femur", "Buck traction"],
    diagramAlt: "The injured lower extremity is supported in the patient's tolerated position without forced alignment."
  },
  {
    id: "subtrochanteric-fracture",
    section: "Lower extremity",
    label: "Subtrochanteric fracture",
    device: "Position of comfort pending orthopedic direction",
    bullets: [
      "Provide analgesia and perform a careful distal neurovascular examination.",
      "Position for comfort while obtaining prompt orthopedic evaluation.",
      "Use temporary skin or skeletal traction only under orthopedic direction."
    ],
    warning: "Traction selection depends on deformity, pain, associated injuries, and the fixation plan.",
    diagram: "position-of-comfort",
    headingId: "subtrochanteric-fracture",
    searchTerms: ["subtrochanteric", "proximal femur", "traction"],
    diagramAlt: "The injured lower extremity is supported in the patient's tolerated position while awaiting an orthopedic plan."
  },
  {
    id: "femoral-shaft-fracture",
    section: "Lower extremity",
    label: "Femoral shaft fracture",
    device: "Traction splint when appropriate",
    bullets: [
      "Consider a traction splint only for an isolated midshaft fracture without a contraindication.",
      "Examine the pelvis, hip, knee, and ipsilateral lower leg before application.",
      "Reassess and document distal perfusion and neurologic function after application.",
      "Use hospital skeletal traction only when selected and applied by orthopedics."
    ],
    warning: "Do not apply a Hare traction splint automatically; associated injuries may make standard traction splinting unsafe.",
    diagram: "traction-splint",
    headingId: "femoral-shaft-fracture",
    searchTerms: ["femur", "shaft", "traction splint", "Hare"],
    diagramAlt: "A traction splint supports an isolated midshaft femoral injury with longitudinal traction and visible distal circulation checks."
  },
  {
    id: "distal-femur-fracture",
    section: "Lower extremity",
    label: "Distal femur fracture",
    device: "Knee immobilizer or long-leg posterior splint",
    bullets: [
      "Use a knee immobilizer for a relatively stable injury when appropriate.",
      "Use a well-padded long-leg posterior splint for substantial deformity or instability.",
      "Recheck and document distal neurovascular status after immobilization."
    ],
    warning: "Obtain urgent orthopedic consultation for a displaced, intra-articular, open, or neurovascularly compromised injury.",
    diagram: "knee-immobilizer",
    headingId: "distal-femur-fracture",
    searchTerms: ["distal femur", "knee", "knee immobilizer", "long leg splint"],
    diagramAlt: "A knee immobilizer supports the leg above and below the knee while leaving the distal extremity visible."
  },
  {
    id: "patella-fracture",
    section: "Lower extremity",
    label: "Patella fracture",
    device: "Knee immobilizer in extension",
    bullets: [
      "Immobilize the knee in extension with a knee immobilizer.",
      "Assess and document the extensor mechanism.",
      "Recheck and document distal neurovascular status."
    ],
    warning: "Inability to perform a straight-leg raise, significant displacement, open injury, or threatened skin requires orthopedic evaluation.",
    diagram: "knee-immobilizer",
    headingId: "patella-fracture",
    searchTerms: ["patella", "kneecap", "straight leg raise", "knee immobilizer"],
    diagramAlt: "A knee immobilizer holds the injured knee in extension while leaving the foot visible for reassessment."
  },
  {
    id: "tibial-plateau-fracture",
    section: "Lower extremity",
    label: "Tibial plateau fracture",
    device: "Knee immobilizer for a stable injury",
    bullets: [
      "Use a knee immobilizer for a stable, minimally displaced injury.",
      "Use a long-leg posterior splint for marked swelling, instability, deformity, or higher-energy injury.",
      "Maintain non-weight-bearing status pending orthopedic direction.",
      "Assess repeatedly for compartment syndrome and vascular injury."
    ],
    warning: "Assess repeatedly for compartment syndrome and vascular injury.",
    diagram: "knee-immobilizer",
    headingId: "tibial-plateau-fracture",
    searchTerms: ["tibial plateau", "knee", "non weight bearing", "compartment syndrome"],
    diagramAlt: "A knee immobilizer stabilizes an aligned plateau injury while the foot remains visible for neurovascular checks."
  },
  {
    id: "complex-tibial-plateau-or-proximal-tibia-fracture",
    section: "Lower extremity",
    label: "Complex tibial plateau or proximal tibia fracture",
    device: "Long-leg posterior splint",
    bullets: [
      "Apply a well-padded long-leg posterior splint.",
      "Avoid repeated or forceful manipulation.",
      "For vascular compromise or threatened skin, use urgent, gentle realignment under orthopedic or emergency protocol and obtain urgent orthopedic consultation.",
      "Keep severe deformity under urgent specialist direction.",
      "Perform frequent compartment checks and evaluate for vascular and ligamentous injury."
    ],
    warning: "High-energy, unstable, open, or neurovascularly compromised injuries require urgent orthopedic evaluation and repeated compartment and vascular assessment.",
    diagram: "long-leg-posterior",
    headingId: "complex-tibial-plateau-or-proximal-tibia-fracture",
    searchTerms: ["complex tibial plateau", "proximal tibia", "long leg splint", "compartment syndrome"],
    diagramAlt: "A well-padded posterior splint extends along the back of the leg from the thigh to the foot."
  },
  {
    id: "general-reduction-principles",
    section: "General principles",
    label: "General reduction principles",
    device: "Position of comfort pending reduction",
    bullets: [
      "Restore acceptable length, alignment, and rotation while reducing pain and soft-tissue tension.",
      "Document skin and distal neurovascular findings before and after reduction.",
      "Provide stable temporary immobilization until definitive management."
    ],
    warning: "Open fracture, threatened skin, vascular compromise, compartment syndrome, irreducibility, or an unstable fracture-dislocation requires urgent orthopedic evaluation.",
    diagram: "position-of-comfort",
    headingId: "general-reduction-principles",
    searchTerms: ["reduction", "alignment", "neurovascular", "fracture", "dislocation"],
    diagramAlt: "An injured extremity is supported in a comfortable position while alignment and distal neurovascular status are assessed."
  },
  {
    id: "pediatric-both-bone-forearm-fractures",
    section: "General principles",
    label: "Pediatric both-bone forearm fractures",
    device: "Position of comfort pending reduction",
    bullets: [
      "Recognize that intact periosteum may act as a hinge during reduction.",
      "Document skin and distal neurovascular findings before and after treatment.",
      "Arrange appropriately timed follow-up because reduction can be lost."
    ],
    warning: "Prompt orthopedic consultation is required for open fracture, neurovascular injury, extreme swelling or compartment syndrome, inability to achieve or maintain reduction, elbow or wrist dislocation, ipsilateral upper-extremity fracture, or plastic deformation.",
    diagram: "position-of-comfort",
    headingId: "pediatric-both-bone-forearm-fractures",
    searchTerms: ["pediatric", "both bone", "forearm", "radius", "ulna", "periosteum"],
    diagramAlt: "A child's injured forearm is supported without force while skin, alignment, and distal neurovascular status are assessed."
  },
  {
    id: "splinting-technique",
    section: "General principles",
    label: "Splinting technique",
    device: "Well-padded noncircumferential splint",
    bullets: [
      "Prepare materials and apply smooth padding over skin and bony prominences.",
      "Mold with the palms while maintaining reduction and avoid focal fingertip pressure.",
      "Keep digits visible when possible and avoid tight circumferential wrapping.",
      "Use cool or lukewarm water and never very hot water.",
      "Recheck and document distal neurovascular status after application."
    ],
    warning: "Avoid tight circumferential wrapping during acute swelling, and never use very hot water.",
    diagram: "position-of-comfort",
    headingId: "splinting-technique",
    searchTerms: ["splint", "padding", "plaster", "fiberglass", "neurovascular"],
    diagramAlt: "A padded extremity is supported in a comfortable injury-appropriate position before splint molding."
  },
  {
    id: "position-of-function",
    section: "General principles",
    label: "Position of function",
    device: "Intrinsic-plus hand position when appropriate",
    bullets: [
      "Extend the wrist approximately 20 to 30 degrees.",
      "Flex the MCP joints approximately 70 to 90 degrees.",
      "Keep the interphalangeal joints near full extension.",
      "Adjust the position for the specific injury."
    ],
    warning: "Do not force a standard hand posture when the injury requires another position.",
    diagram: "position-of-function",
    headingId: "position-of-function",
    searchTerms: ["intrinsic plus", "safe position", "MCP", "wrist", "hand"],
    diagramAlt: "The wrist is slightly extended, the MCP joints are flexed, and the interphalangeal joints are near extension."
  },
  {
    id: "hematoma-block",
    section: "Analgesia",
    label: "Hematoma block",
    device: "Fracture-site local anesthesia",
    bullets: [
      "Consider the block for a displaced distal-radius fracture or selected accessible fracture hematoma.",
      "Confirm that the block matches the injury and local procedural protocol.",
      "Use digital or peripheral nerve blocks for many finger and hand injuries instead.",
      "Reassess analgesia before manipulation."
    ],
    warning: "A hematoma block is not the preferred block for every hand injury.",
    diagram: "position-of-comfort",
    headingId: "hematoma-block",
    searchTerms: ["hematoma block", "distal radius", "local anesthesia", "reduction"],
    diagramAlt: "The injured extremity rests in a supported position while analgesia is established before reduction."
  },
  {
    id: "intra-articular-shoulder-block",
    section: "Analgesia",
    label: "Intra-articular shoulder block",
    device: "Intra-articular local anesthetic",
    bullets: [
      "Consider the block for selected anterior shoulder-dislocation reductions.",
      "Use sterile technique and follow local dosing and monitoring protocols.",
      "Reassess pain and neurovascular status before reduction.",
      "Use procedural sedation when clinically indicated."
    ],
    warning: "Do not assume intra-articular analgesia will be adequate for every patient or reduction.",
    diagram: "position-of-comfort",
    headingId: "intra-articular-shoulder-block",
    searchTerms: ["shoulder block", "intra-articular", "lidocaine", "dislocation", "analgesia"],
    diagramAlt: "The injured arm is supported in a comfortable position while analgesia is established before reduction."
  },
  {
    id: "bier-block",
    section: "Analgesia",
    label: "Bier block",
    device: "Intravenous regional anesthesia",
    bullets: [
      "Reserve the technique for selected distal upper-extremity procedures.",
      "Exsanguinate and isolate the extremity with a tourniquet under a formal protocol.",
      "Use protocol-based local-anesthetic dosing and physiologic monitoring.",
      "Ensure trained personnel are present."
    ],
    warning: "Do not perform intravenous regional anesthesia as an improvised bedside technique.",
    diagram: "position-of-comfort",
    headingId: "bier-block",
    searchTerms: ["Bier block", "intravenous regional anesthesia", "tourniquet", "upper extremity"],
    diagramAlt: "The distal upper extremity is supported in a controlled procedural position for regional anesthesia."
  },
  {
    id: "buck-traction",
    section: "Traction",
    label: "Buck traction",
    device: "Temporary skin traction",
    bullets: [
      "Use Buck traction temporarily for selected pain, muscle spasm, or alignment needs.",
      "Apply it only when orthopedics orders it under institutional protocol.",
      "Monitor skin, pressure areas, distal neurovascular status, and alignment.",
      "Use only the ordered weight."
    ],
    warning: "Do not apply Buck traction automatically to every proximal-femur fracture or use a universal percentage-of-body-weight rule.",
    diagram: "buck-traction",
    headingId: "buck-traction",
    searchTerms: ["Buck traction", "skin traction", "hip fracture", "proximal femur"],
    diagramAlt: "Skin traction is applied along the lower leg with the ordered weight aligned beyond the foot of the bed."
  },
  {
    id: "skeletal-traction",
    section: "Traction",
    label: "Skeletal traction",
    device: "Orthopedic transosseous traction",
    bullets: [
      "Treat pin placement and traction setup as a supervised orthopedic procedure.",
      "Individualize pin location, direction, and weight to the injury, imaging, and orthopedic plan.",
      "Follow institutional protocol for the ordered weight.",
      "Monitor neurovascular status, pin sites, pressure areas, and alignment."
    ],
    warning: "Do not teach pin placement or traction weight as a universal bedside memorization rule.",
    diagram: "skeletal-traction",
    headingId: "skeletal-traction",
    searchTerms: ["skeletal traction", "Steinmann pin", "Kirschner wire", "transosseous"],
    diagramAlt: "A transosseous traction pin is connected to an aligned traction system under orthopedic supervision."
  },
  {
    id: "traction-splint-contraindications",
    section: "Traction",
    label: "Traction-splint contraindications",
    device: "Check potential contraindications for the specific traction-splint device",
    bullets: [
      "Review the specific device and manufacturer instructions, injury pattern, orthopedic direction, and local protocol.",
      "Consider pelvic, acetabular, femoral-neck, distal-femur, knee, tibia, and ankle injuries as potential reasons to avoid the selected device.",
      "Also consider partial amputation, interference with open-wound care, and inability to assess or maintain distal perfusion.",
      "Recheck and document distal neurovascular status after any traction device."
    ],
    warning: "These are potential contraindications or reasons to avoid a specific traction-splint device, not universal prohibitions.",
    diagram: "traction-splint",
    headingId: "traction-splint-contraindications",
    searchTerms: ["traction splint", "contraindication", "pelvis", "hip", "knee", "amputation"],
    diagramAlt: "A traction splint is shown with checkpoints at the pelvis, hip, knee, lower leg, and distal circulation."
  }
];
