const CATEGORY_DURATION_MS      = 1200;
const ISI_DURATION_MS           = 500;
const WORD_DURATION_MS          = 100;
const PRACTICE_WORD_DURATION_MS = 100;

const MASK_DURATION_MS          = 300;

const POST_RESPONSE_DELAY_MS    = 750;
const NEXT_TRIAL_FIXATION_MS    = 500;
const MIN_CATEGORY_GAP          = 3;

// ?demo=true runs a short version (DEMO_TRIAL_COUNT random main-phase trials)
// so the full pipeline, including the DataPipe/OSF upload, can be tested fast.
const DEMO_TRIAL_COUNT          = 10;

let KEY_YES = "x";
let KEY_NO  = "m";
let SUBJECT_ID = "";

const FEEDBACK_AUDIO = "buzz.wav";

const DATAPIPE_EXPERIMENT_ID = "vwMy1envtzkv";

const QUALTRICS_URL = "https://uwmadison.co1.qualtrics.com/jfe/form/SV_cBmgrOhfT6CscD4";

// ---------------------------------------------------------------------------
// Forms of Inner Thinking (FIT) questionnaire — Section 3 only ("Specific
// Inner Speaking/Hearing") for now, per current study scope. Blocks 1a/1b/2a/2b
// from the full instrument (Forms_of_Inner_Thinking (FIT)_v202604.pdf) are not
// run at the moment; see git history / the PDF if the full instrument needs to
// come back later.
// ---------------------------------------------------------------------------

const FIT_SHORT_DURATION_MS = 10000;

const FIT_BLOCKS = [
  {
    id: "practice",
    label: "Practice",
    duration: FIT_SHORT_DURATION_MS,
    prompts: ["Imagine saying the sentence: Practice is helpful"],
  },
  {
    id: "block3a",
    label: "Specific Inner Speaking",
    duration: FIT_SHORT_DURATION_MS,
    prompts: [
      "Imagine saying the sentence: English is a language",
      "Imagine saying the sentence: Mathematics is a major",
      "Imagine saying the sentence: Democracy is a system",
      "Imagine saying the sentence: Growth is a process",
      "Imagine saying the sentence: Time is a dimension",
    ],
  },
  {
    id: "block3b",
    label: "Specific Inner Hearing",
    duration: FIT_SHORT_DURATION_MS,
    prompts: [
      "Imagine hearing the sentence: Logic is a tool",
      "Imagine hearing the sentence: Gravity is a force",
      "Imagine hearing the sentence: Ideas are valuable",
      "Imagine hearing the sentence: Honesty is a quality",
      "Imagine hearing the sentence: Learning is a journey",
    ],
  },
];

const FIT_YES_NO       = ["Yes", "No"];
const FIT_YES_NO_WORDS = ["Yes", "No", "I did not experience words"];

function buildFITFormsQuestions() {
  return [
    { prompt: "Were words in English part of your inner experience?", name: "lang_english", options: FIT_YES_NO, required: true },
    { prompt: "Were words in a language other than English part of your inner experience?", name: "lang_other", options: FIT_YES_NO, required: true },
    { prompt: "Were visual images part of your inner experience?", name: "visual", options: FIT_YES_NO, required: true },
    { prompt: "Were abstract thoughts and ideas (without words or images) part of your inner experience?", name: "concept", options: FIT_YES_NO, required: true },
    { prompt: "During the experience, were your eyes closed or open?", name: "eyes", options: ["Closed", "Open", "Sometimes open, sometimes closed"], required: true },
    { prompt: "Did you experience the words as having sound in your mind?", name: "auditory", options: FIT_YES_NO_WORDS, required: true },
    { prompt: "Did you experience the words as having a written form in your mind?", name: "orthographic", options: FIT_YES_NO_WORDS, required: true },
    { prompt: "Did you say any words out loud?", name: "artic_outloud", options: FIT_YES_NO_WORDS, required: true },
    { prompt: "While experiencing words, did you physically move your mouth, lips, tongue, or throat?", name: "artic_real", options: FIT_YES_NO_WORDS, required: true },
    { prompt: "While experiencing words, did you imagine moving your mouth, lips, tongue, or throat?", name: "artic_imagined", options: FIT_YES_NO_WORDS, required: true },
    { prompt: "Did you experience the words without any imagined sound, visual form, or movement?", name: "pure_lexical", options: FIT_YES_NO_WORDS, required: true },
  ];
}

const FIT_OTHER_EXPERIENCE_OPTIONS = [
  "Imagined sounds (not of words)",
  "Imagined voice (not of words)",
  "Imagined voice without sounds",
  "Imagined smells",
  "Imagined tastes",
  "Emotions",
  "Imagined bodily sensations",
  "Real bodily sensations",
  "Imagined movements of your body",
  "Real bodily movement",
  "Other",
  "None of the above",
];

// Fixed column order for the tidy FIT CSV, one row per prompt.
const FIT_CSV_COLUMNS = [
  "subjCode", "block", "block_label", "prompt_index", "prompt",
  "lang_english", "lang_other", "visual", "concept", "eyes",
  "auditory", "orthographic", "artic_outloud", "artic_real", "artic_imagined", "pure_lexical",
  "other_experiences", "other_experiences_text",
];

// The 8 example infographics shown during the FIT instructions, matched to
// the "Forms of Language" / general questions they illustrate.
const FIT_EXAMPLE_IMAGES = [
  "inforgaphics/infographics-01-cropped.jpg",
  "inforgaphics/infographics-02-cropped.jpg",
  "inforgaphics/infographics-03-cropped.jpg",
  "inforgaphics/infographics-04-cropped.jpg",
  "inforgaphics/infographics-05-cropped.jpg",
  "inforgaphics/infographics-06-cropped.jpg",
  "inforgaphics/infographics-07-cropped.jpg",
  "inforgaphics/infographics-08-cropped.jpg",
];

function buildFITPromptTrials(jsPsych, promptText, durationMs, blockId, blockLabel, globalPromptIndex) {
  const displayTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="fit-prompt-display">${promptText}</div>`,
    choices: "NO_KEYS",
    trial_duration: durationMs,
    data: {
      screen: "fit_prompt",
      fit_block: blockId,
      fit_block_label: blockLabel,
      fit_prompt: promptText,
      fit_prompt_index: globalPromptIndex,
    },
  };

  const formsTrial = {
    type: jsPsychSurveyMultiChoice,
    preamble: `<p>Please answer the following questions about what you just experienced.</p>`,
    questions: buildFITFormsQuestions(),
    data: {
      fitsave: true,
      screen: "fit_forms_survey",
      fit_block: blockId,
      fit_block_label: blockLabel,
      fit_prompt: promptText,
      fit_prompt_index: globalPromptIndex,
      subjCode: SUBJECT_ID,
    },
  };

  const otherTrial = {
    type: jsPsychSurveyMultiSelect,
    preamble: `<p>In addition to the experiences you already reported, did you experience any of the following? (Select all that apply)</p>`,
    questions: [
      { prompt: "", name: "other_experiences", options: FIT_OTHER_EXPERIENCE_OPTIONS },
    ],
    data: {
      fitsave: true,
      screen: "fit_other_survey",
      fit_block: blockId,
      fit_block_label: blockLabel,
      fit_prompt: promptText,
      fit_prompt_index: globalPromptIndex,
      subjCode: SUBJECT_ID,
    },
  };

  const otherTextTrial = {
    type: jsPsychSurveyText,
    questions: [
      { prompt: 'You selected "Other" — please briefly describe:', name: "other_experiences_text" },
    ],
    data: {
      fitsave: true,
      screen: "fit_other_text",
      fit_block: blockId,
      fit_block_label: blockLabel,
      fit_prompt: promptText,
      fit_prompt_index: globalPromptIndex,
      subjCode: SUBJECT_ID,
    },
    conditional_function: function () {
      const last = jsPsych.data.get().filter({ screen: "fit_other_survey" }).last(1).trials[0];
      return Boolean(
        last && last.response && last.response.other_experiences &&
        last.response.other_experiences.includes("Other")
      );
    },
  };

  return [displayTrial, formsTrial, otherTrial, otherTextTrial];
}

// Builds the full FIT questionnaire section: instructions with the example
// images, the prompt/survey loop for every block, the closing frequency
// survey, and the DataPipe/local-download save of "<subjCode>_FIT.csv". Runs
// in full regardless of demo mode — demo mode only shortens the category
// task; use the "Skip category task" setup option to jump straight here.
function buildFITTimeline(jsPsych, subjectID, rng) {
  const timeline = [];

  timeline.push({
    type: jsPsychInstructions,
    pages: [
      `
        <div class="instructions-block">
          <h2>Next: a questionnaire about your inner experience</h2>
          <p>You will now see a series of short prompts. For each one, take the full time given to actually think about (or imagine) what the prompt describes.</p>
          <p>Afterward, you will answer a few questions about <strong>how</strong> you experienced that thought — for example, whether it involved words, sounds, images, or something else entirely.</p>
          <p>There are no right or wrong answers. Please answer as accurately as you can about your own experience.</p>
          <p>Press "Next" to see some examples of what these questions are asking.</p>
        </div>
      `,
      ...FIT_EXAMPLE_IMAGES.map(
        (src) => `
          <div class="instructions-block">
            <p class="fit-example-caption">Responding "yes" to a question like this might come from an example experience like this:</p>
            <img class="fit-example-image" src="${src}" alt="Example of a form of inner experience">
          </div>
        `
      ),
      `
        <div class="instructions-block">
          <p>Keep these examples in mind as you answer. Press "Next" to begin with a practice prompt.</p>
        </div>
      `,
    ],
    show_clickable_nav: true,
    key_forward: "ArrowRight",
    key_backward: "ArrowLeft",
    data: { screen: "fit_instructions" },
    on_start: showCursor,
  });

  let globalPromptIndex = 0;
  FIT_BLOCKS.forEach((block) => {
    const prompts = seededShuffle(block.prompts, rng);
    prompts.forEach((promptText) => {
      globalPromptIndex += 1;
      timeline.push(
        ...buildFITPromptTrials(jsPsych, promptText, block.duration, block.id, block.label, globalPromptIndex)
      );
    });
  });

  // One tidy row per prompt (forms + other-experiences answers).
  function buildFITCleanCSV() {
    const byIndex = {};

    jsPsych.data.get().filter({ fitsave: true }).trials.forEach((t) => {
      if (!byIndex[t.fit_prompt_index]) {
        byIndex[t.fit_prompt_index] = {
          subjCode: t.subjCode,
          block: t.fit_block,
          block_label: t.fit_block_label,
          prompt_index: t.fit_prompt_index,
          prompt: t.fit_prompt,
        };
      }
      const row = byIndex[t.fit_prompt_index];
      if (t.screen === "fit_forms_survey") {
        Object.assign(row, t.response);
      } else if (t.screen === "fit_other_survey") {
        row.other_experiences = (t.response.other_experiences || []).join(";");
      } else if (t.screen === "fit_other_text") {
        row.other_experiences_text = t.response.other_experiences_text;
      }
    });

    const rows = Object.values(byIndex);

    const orderedRows = rows.map((r) => {
      const row = {};
      FIT_CSV_COLUMNS.forEach((c) => { row[c] = r[c] !== undefined ? r[c] : ""; });
      return row;
    });
    return Papa.unparse(orderedRows);
  }

  function downloadFITCSV(filename) {
    const blob = new Blob([buildFITCleanCSV()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const datapipeConfigured = DATAPIPE_EXPERIMENT_ID !== "REPLACE_WITH_YOUR_DATAPIPE_ID";
  const fitFilename = `${subjectID}_FIT.csv`;

  if (datapipeConfigured) {
    timeline.push({
      type: jsPsychPipe,
      action: "save",
      experiment_id: DATAPIPE_EXPERIMENT_ID,
      filename: fitFilename,
      data_string: () => buildFITCleanCSV(),
      on_finish: function (data) {
        console.log("[DataPipe] FIT save response:", JSON.stringify(data));
        const msg = String(
          (data && (data.message || data.error || data.result)) || ""
        ).toLowerCase();
        const looksOk =
          data &&
          !data.error &&
          data.success !== false &&
          (data.message !== undefined || data.result !== undefined) &&
          !/error|fail|not accepting|exceed|invalid|denied|missing/.test(msg);
        if (!looksOk) {
          console.error(
            "[DataPipe] FIT upload did NOT succeed — downloading a local backup instead."
          );
          data.datapipe_failed = true;
          try {
            downloadFITCSV(`BACKUP_${fitFilename}`);
          } catch (e) {
            console.error("[DataPipe] FIT local backup also failed:", e);
          }
        }
      },
    });

    timeline.push({
      timeline: [
        {
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `<div class="instructions-block"><p>We could not upload your questionnaire data automatically. A copy has been saved to this computer's downloads folder. Please let the researcher know.</p></div>`,
          choices: "NO_KEYS",
          trial_duration: 5000,
        },
      ],
      conditional_function: function () {
        const last = jsPsych.data.get().last(1).trials[0];
        return Boolean(last && last.datapipe_failed);
      },
    });
  } else {
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="instructions-block"><p>(Saving a local copy of the questionnaire data to your downloads folder.)</p></div>`,
      choices: "NO_KEYS",
      trial_duration: 1500,
      on_start: function () {
        try {
          downloadFITCSV(fitFilename);
        } catch (e) {
          console.error("Local FIT save failed:", e);
        }
      },
    });
  }

  return timeline;
}

// ---------------------------------------------------------------------------
// IRQ questionnaire
// Source: VIS_IRQ_Demographics.qsf, the "Default" block (DataExportTag "IRQ"),
// a single Qualtrics Matrix/Likert question. Only this block is ported here —
// the Standard demographics block stays in Qualtrics, after the counterbalanced
// FIT / IRQ pair. Item order was randomized per participant in the original
// ("Randomization": "All"); the same is done here via randomize_question_order.
// ---------------------------------------------------------------------------

const IRQ_LIKERT_LABELS = [
  "Strongly disagree",
  "Somewhat disagree",
  "Neither agree nor disagree",
  "Somewhat agree",
  "Strongly agree",
];

const IRQ_ITEMS = [
  { name: "Factor1_1", text: "I often enjoy the use of mental pictures to reminisce" },
  { name: "Factor1_2", text: "I can close my eyes and easily picture a scene I have experienced" },
  { name: "Factor1_3", text: "My mental images are very vivid and photographic" },
  { name: "Factor1_4", text: "The old saying 'A picture is worth a thousand words' is certainly true for me" },
  { name: "Factor1_5", text: "When I think about someone I know well, I instantly see their face in my mind" },
  { name: "Factor1_6", text: "I rarely use mental images or pictures to help me remember things" },
  { name: "Factor1_7", text: "My memories are mainly visual in nature" },
  { name: "Factor1_8", text: "When traveling to get to somewhere I tend to think more verbally than visually" },
  { name: "Factor1_9", text: "If I talk to myself in my head it is rarely accompanied by visual imagery" },
  { name: "Factor1_10", text: "If I imagine my memories visually they are more often static than moving" },
  { name: "Factor2_1", text: "I think about problems in my mind in the form of a conversation with myself" },
  { name: "Factor2_2", text: "If I am walking somewhere by myself, I rarely have a silent conversation with myself" },
  { name: "Factor2_3", text: "If I am walking somewhere by myself, I frequently think of conversations that I've recently had" },
  { name: "Factor2_4", text: "My inner speech helps my imagination" },
  { name: "Factor2_5", text: "I tend to think things through verbally when I am relaxing" },
  { name: "Factor2_6", text: "When thinking about a personal problem, I rarely talk it through in my head" },
  { name: "Factor2_7", text: "I like to give myself some down time to talk through thoughts in my mind" },
  { name: "Factor2_8", text: "I don't hear words in my 'mind's ear' when I think" },
  { name: "Factor2_9", text: "I rarely vocalize thoughts in my mind" },
  { name: "Factor2_10", text: "I often talk to myself internally while watching TV" },
  { name: "Factor2_11", text: "My memories rarely involve conversations I've had" },
  { name: "Factor2_12", text: "When I read, I tend to hear a voice in my 'mind's ear'" },
  { name: "Factor3_1", text: "When I hear someone talking, I see words written down in my mind" },
  { name: "Factor3_2", text: "I don't see words in my 'mind's eye' when I think" },
  { name: "Factor3_3", text: "When I am introduced to someone for the first time, I imagine what their name would look like when written down" },
  { name: "Factor3_4", text: "A strategy I use to help me remember written material is imagining what the writing looks like" },
  { name: "Factor3_5", text: "I hear a running summary of everything I am doing in my head" },
  { name: "Factor3_6", text: "I rehearse in my mind how someone might respond to a text message before I send it" },
  { name: "Factor4_1", text: "I can easily imagine and mentally rotate three-dimensional geometric figures" },
  { name: "Factor4_2", text: "It is hard for me to imagine this sentence in my mind pronounced unnaturally slowly" },
  { name: "Factor4_3", text: "In school, I had no problems with geometry" },
  { name: "Factor4_4", text: "It is easy for me to imagine the sensation of licking a brick" },
  { name: "Factor4_5", text: "I find it difficult to imagine how a three-dimensional geometric figure would exactly look like when rotated" },
  { name: "Factor4_6", text: "I can easily imagine someone clearly talking, and then imagine the same voice with a heavy cold" },
  { name: "Factor4_7", text: "I think I have a large vocabulary in my native language compared to other people" },
  { name: "Factor4_8", text: "I can easily imagine the sound of a trumpet getting louder" },
  { name: "catch1", text: "Select the middle option for this item" },
  { name: "catch2", text: "Five minus two is three" },
];

// Fixed CSV column order: subjCode + one column per IRQ item, in the item's
// canonical (non-randomized) order, regardless of the order it was presented in.
const IRQ_CSV_COLUMNS = ["subjCode", ...IRQ_ITEMS.map((q) => q.name)];

// Builds the IRQ questionnaire section: a short intro, the 38-item Likert
// matrix (order randomized per participant, matching the original Qualtrics
// "Randomization: All" setting), and the DataPipe/local-download save of
// "<subjCode>_IRQ.csv". Runs in full regardless of demo mode — demo mode only
// shortens the category task; use the "Skip category task" setup option to
// jump straight here.
function buildIRQTimeline(jsPsych, subjectID, rng) {
  const timeline = [];

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions-block">
        <p>Please select a response for each statement. Make sure to read each question carefully.</p>
        <p>Press any key to continue.</p>
      </div>
    `,
    data: { screen: "irq_instructions" },
    on_start: showCursor,
  });

  // Item order is randomized from the participant's seed (like every other
  // random order in this study), rather than jsPsych's own unseeded
  // randomize_question_order, so a re-run with the same seed is reproducible.
  timeline.push({
    type: jsPsychSurveyLikert,
    preamble: `<p>Please select a response for each statement. Make sure to read each question carefully.</p>`,
    questions: seededShuffle(IRQ_ITEMS, rng).map((item) => ({
      prompt: item.text,
      name: item.name,
      labels: IRQ_LIKERT_LABELS,
      required: true,
    })),
    data: { irqsave: true, screen: "irq_survey", subjCode: SUBJECT_ID },
  });

  function buildIRQCleanCSV() {
    const trial = jsPsych.data.get().filter({ irqsave: true }).last(1).trials[0];
    const row = {};
    IRQ_CSV_COLUMNS.forEach((c) => {
      if (c === "subjCode") {
        row[c] = trial ? trial.subjCode : subjectID;
      } else {
        row[c] = trial && trial.response && trial.response[c] !== undefined ? trial.response[c] : "";
      }
    });
    return Papa.unparse([row]);
  }

  function downloadIRQCSV(filename) {
    const blob = new Blob([buildIRQCleanCSV()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const datapipeConfigured = DATAPIPE_EXPERIMENT_ID !== "REPLACE_WITH_YOUR_DATAPIPE_ID";
  const irqFilename = `${subjectID}_IRQ.csv`;

  if (datapipeConfigured) {
    timeline.push({
      type: jsPsychPipe,
      action: "save",
      experiment_id: DATAPIPE_EXPERIMENT_ID,
      filename: irqFilename,
      data_string: () => buildIRQCleanCSV(),
      on_finish: function (data) {
        console.log("[DataPipe] IRQ save response:", JSON.stringify(data));
        const msg = String(
          (data && (data.message || data.error || data.result)) || ""
        ).toLowerCase();
        const looksOk =
          data &&
          !data.error &&
          data.success !== false &&
          (data.message !== undefined || data.result !== undefined) &&
          !/error|fail|not accepting|exceed|invalid|denied|missing/.test(msg);
        if (!looksOk) {
          console.error(
            "[DataPipe] IRQ upload did NOT succeed — downloading a local backup instead."
          );
          data.datapipe_failed = true;
          try {
            downloadIRQCSV(`BACKUP_${irqFilename}`);
          } catch (e) {
            console.error("[DataPipe] IRQ local backup also failed:", e);
          }
        }
      },
    });

    timeline.push({
      timeline: [
        {
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `<div class="instructions-block"><p>We could not upload your questionnaire data automatically. A copy has been saved to this computer's downloads folder. Please let the researcher know.</p></div>`,
          choices: "NO_KEYS",
          trial_duration: 5000,
        },
      ],
      conditional_function: function () {
        const last = jsPsych.data.get().last(1).trials[0];
        return Boolean(last && last.datapipe_failed);
      },
    });
  } else {
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="instructions-block"><p>(Saving a local copy of the questionnaire data to your downloads folder.)</p></div>`,
      choices: "NO_KEYS",
      trial_duration: 1500,
      on_start: function () {
        try {
          downloadIRQCSV(irqFilename);
        } catch (e) {
          console.error("Local IRQ save failed:", e);
        }
      },
    });
  }

  return timeline;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function seededShuffle(array, rng) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function seededInterleaveByCategory(trials, rng, minGap = MIN_CATEGORY_GAP) {
  const buckets = {};
  trials.forEach((t) => {
    if (!buckets[t.category]) buckets[t.category] = [];
    buckets[t.category].push(t);
  });
  Object.keys(buckets).forEach((cat) => {
    buckets[cat] = seededShuffle(buckets[cat], rng);
  });

  const categories = Object.keys(buckets);
  const result = [];
  const recent = [];

  while (result.length < trials.length) {
    let available = categories.filter(
      (c) => buckets[c].length > 0 && !recent.includes(c)
    );
    if (available.length === 0) {
      available = categories.filter((c) => buckets[c].length > 0);
    }

    const weights = available.map((c) => buckets[c].length);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = rng() * totalWeight;
    let chosen = available[available.length - 1];
    for (let i = 0; i < available.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosen = available[i];
        break;
      }
    }
    result.push(buckets[chosen].shift());
    recent.push(chosen);
    if (recent.length > minGap) recent.shift();
  }
  return result;
}

async function loadCSV(path) {
  const response = await fetch(path);
  const text = await response.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

// Feedback buzz. Decoded once into our own Web Audio buffer; a fresh one-shot
// source is created for every play, so it fires on every practice trial with no
// gap after the keypress. initFeedbackBuzz() must run inside a user gesture (the
// setup "Start" click) so the AudioContext starts unlocked.
let buzzContext = null;
let buzzBuffer = null;

function initFeedbackBuzz() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    buzzContext = new AudioCtx();
    fetch(FEEDBACK_AUDIO)
      .then((r) => r.arrayBuffer())
      .then((data) => buzzContext.decodeAudioData(data))
      .then((decoded) => { buzzBuffer = decoded; })
      .catch((e) => console.error("Could not load the feedback buzz:", e));
  } catch (e) {
    console.error("Could not set up the feedback buzz:", e);
  }
}

function playFeedbackBuzz() {
  if (!buzzContext || !buzzBuffer) return;
  try {
    if (buzzContext.state === "suspended") buzzContext.resume();
    const source = buzzContext.createBufferSource();
    source.buffer = buzzBuffer;
    source.connect(buzzContext.destination);
    source.start();
  } catch (e) {
    console.error("Feedback buzz playback failed:", e);
  }
}

// Persistent key-press reminder shown at the bottom of the page for the
// duration of the practice phase. Lives outside jsPsych's own content
// container, so it survives the per-trial stimulus swaps without needing to
// be baked into every practice screen's HTML.
const PRACTICE_REMINDER_ID = "practice-key-reminder";

function showPracticeReminder() {
  hidePracticeReminder();
  const el = document.createElement("div");
  el.id = PRACTICE_REMINDER_ID;
  el.textContent = `Press "${KEY_YES}" for yes and "${KEY_NO}" for no.`;
  document.body.appendChild(el);
}

function hidePracticeReminder() {
  const el = document.getElementById(PRACTICE_REMINDER_ID);
  if (el) el.remove();
}

// The category task hides the cursor in fullscreen mode to avoid distraction,
// but the FIT/IRQ questionnaires need it visible again since participants
// have to click radio buttons and checkboxes.
function showCursor() {
  document.body.classList.remove("hide-cursor");
}

function buildTrialSequence(trial, jsPsych, phase, trialNum) {
  // phase: "practice" | "test" | "example"
  const isPractice = phase === "practice";
  const save = phase !== "example";

  const categoryScreen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="category-display">${trial.category}</div>`,
    choices: "NO_KEYS",
    trial_duration: CATEGORY_DURATION_MS,
    data: { screen: "category", phase: phase },
  };

  const isiScreen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="fixation">+</div>`,
    choices: "NO_KEYS",
    trial_duration: ISI_DURATION_MS,
    data: { screen: "isi", phase: phase },
  };

  const wordDurationForThisTrial = isPractice
    ? PRACTICE_WORD_DURATION_MS
    : WORD_DURATION_MS;
  const maskOnsetMs = wordDurationForThisTrial;
  const questionMarkOnsetMs = wordDurationForThisTrial + MASK_DURATION_MS;

  const wordScreen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="word-display" id="word-stim">${trial.word}</div>`,

    choices: "NO_KEYS",

    // No trial_duration: there is no response deadline. The key listener is
    // armed the instant the target word appears and the first valid keypress
    // ends the trial. If the participant has not responded, the question-mark
    // screen simply stays up until they do.

    data: {
      trialsave: save,
      screen: "word",
      phase: phase,
      trial_num: trialNum,
      subjCode: SUBJECT_ID,
      category: trial.category,
      word: trial.word,
      condition: trial.condition,
      yes_key: KEY_YES,
      correct_response: trial.correct_answer,
    },
    on_load: function () {
      // RT is measured from the moment the target word is shown.
      const wordOnsetTime = performance.now();
      const maskString = "X".repeat(trial.word.length);
      const el = document.getElementById("word-stim");

      // Visual sequence only: target word -> mask -> question mark.
      // These swaps do NOT gate responses. (pluginAPI.setTimeout handles are
      // cleared automatically when the trial ends.)
      jsPsych.pluginAPI.setTimeout(() => {
        if (el) el.innerHTML = maskString;
      }, maskOnsetMs);

      jsPsych.pluginAPI.setTimeout(() => {
        if (el) el.innerHTML = '<span class="response-window">?</span>';
      }, questionMarkOnsetMs);

      // Response window opens immediately at word onset. Whatever is on screen
      // when the participant responds, the first valid key records RT (from
      // word onset) and ends the trial.
      jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: (info) => {
          const rt = Math.round(performance.now() - wordOnsetTime);
          const given =
            info.key === KEY_YES ? "yes" : info.key === KEY_NO ? "no" : null;

          // Practice feedback: play the buzz the instant a wrong key lands.
          if (isPractice && given !== trial.correct_answer) {
            playFeedbackBuzz();
          }

          jsPsych.finishTrial({ response: info.key, rt: rt });
        },
        valid_responses: [KEY_YES, KEY_NO],
        rt_method: "performance",
        persist: false,
        allow_held_key: false,
      });
    },
    on_finish: function (data) {
      let given = null;
      if (data.response === KEY_YES) given = "yes";
      else if (data.response === KEY_NO) given = "no";
      data.correct = given === trial.correct_answer ? 1 : 0;
    },
  };

  const sequence = [categoryScreen, isiScreen, wordScreen];

  // The one-off example trial ends as soon as the participant responds; the
  // post-response blank and inter-trial fixation are only for real trials.
  if (phase !== "example") {
    sequence.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="word-display"></div>`,
      choices: "NO_KEYS",
      trial_duration: POST_RESPONSE_DELAY_MS,
      data: { screen: "post_response_blank", phase: phase },
    });

    sequence.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="fixation">+</div>`,
      choices: "NO_KEYS",
      trial_duration: NEXT_TRIAL_FIXATION_MS,
      data: { screen: "next_trial_fixation", phase: phase },
    });
  }

  return sequence;
}

// Setup pop-up shown before the experiment starts, in place of URL parameters.
// Any matching URL parameters are used only to pre-fill the fields.
function promptForParameters(urlParams) {
  return new Promise((resolve) => {
    const prefillSubj =
      urlParams.get("subjCode") ||
      urlParams.get("PROLIFIC_PID") ||
      urlParams.get("subject") ||
      urlParams.get("subj") ||
      "";
    const prefillDemo = /^(1|true|yes)$/i.test((urlParams.get("demo") || "").trim());
    const prefillSkipCategory = /^(1|true|yes)$/i.test(
      (urlParams.get("skipCategory") || "").trim()
    );
    const prefillOrder = /^(irq_first|fit_first)$/i.test(
      (urlParams.get("questionnaireOrder") || "").trim()
    )
      ? urlParams.get("questionnaireOrder").trim().toLowerCase()
      : "";
    const prefillFullscreen = /^(1|true|yes)$/i.test(
      (urlParams.get("fullscreen") || "").trim()
    );

    const overlay = document.createElement("div");
    overlay.id = "param-overlay";
    overlay.innerHTML = `
      <form class="param-box" autocomplete="off">
        <h2>Experiment setup</h2>
        <label>Subject code
          <input type="text" name="subjCode" required>
        </label>
        <label>Random seed
          <input type="text" name="seed" required>
        </label>
        <label>Yes key
          <select name="yesKey" required>
            <option value="" disabled selected hidden></option>
            <option value="x">x</option>
            <option value="m">m</option>
          </select>
        </label>
        <label>Questionnaire order
          <select name="questionnaireOrder" required>
            <option value="" disabled selected hidden></option>
            <option value="fit_first">FIT then IRQ</option>
            <option value="irq_first">IRQ then FIT</option>
          </select>
        </label>
        <label class="param-check">
          <input type="checkbox" name="demo">
          Demo mode (short ${DEMO_TRIAL_COUNT}-trial run)
        </label>
        <label class="param-check">
          <input type="checkbox" name="skipCategory">
          Skip category task (go straight to the questionnaires)
        </label>
        <label class="param-check">
          <input type="checkbox" name="fullscreen">
          Fullscreen (maximize + hide cursor during trials)
        </label>
        <div class="param-error"></div>
        <button type="submit">Start</button>
      </form>
    `;
    document.body.appendChild(overlay);

    const form = overlay.querySelector("form");
    const errorEl = overlay.querySelector(".param-error");
    form.subjCode.value = prefillSubj;
    form.demo.checked = prefillDemo;
    form.skipCategory.checked = prefillSkipCategory;
    form.fullscreen.checked = prefillFullscreen;
    if (prefillOrder) form.questionnaireOrder.value = prefillOrder;
    form.subjCode.focus();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const subjCode = form.subjCode.value.trim();
      const seed = form.seed.value.trim();
      const yesKey = form.yesKey.value;
      const questionnaireOrder = form.questionnaireOrder.value;
      if (!subjCode || !seed || !yesKey || !questionnaireOrder) {
        errorEl.textContent = "Please fill in all fields.";
        (!subjCode ? form.subjCode : !seed ? form.seed : !yesKey ? form.yesKey : form.questionnaireOrder).focus();
        return;
      }
      // Create + unlock the feedback-buzz audio while we have a user gesture.
      initFeedbackBuzz();

      const demoMode = form.demo.checked;
      const fullscreenMode = form.fullscreen.checked;
      // The Fullscreen API requires a user gesture, so it must be requested
      // here, synchronously within this click handler — not later on, after
      // the promise resolves and runExperiment() resumes.
      if (fullscreenMode) {
        try {
          document.documentElement.requestFullscreen().catch((e) => {
            console.error("Could not enter fullscreen:", e);
          });
        } catch (e) {
          console.error("Could not enter fullscreen:", e);
        }
        document.body.classList.add("hide-cursor");
      }

      overlay.remove();
      resolve({
        subjectID: subjCode,
        seed: seed,
        yesKey: yesKey, // "x" | "m"
        demoMode: demoMode,
        skipCategoryTask: form.skipCategory.checked,
        questionnaireOrder: questionnaireOrder, // "fit_first" | "irq_first"
        fullscreenMode: fullscreenMode,
      });
    });
  });
}

async function runExperiment() {
  const urlParams = new URLSearchParams(window.location.search);
  const { subjectID, seed: seedInput, yesKey, demoMode, skipCategoryTask, questionnaireOrder, fullscreenMode } =
    await promptForParameters(urlParams);

  if (demoMode || skipCategoryTask) {
    const labels = [];
    if (demoMode) labels.push(`DEMO MODE — ${DEMO_TRIAL_COUNT}-trial run`);
    if (skipCategoryTask) labels.push("CATEGORY TASK SKIPPED");
    const banner = document.createElement("div");
    banner.textContent = labels.join(" | ");
    banner.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:9999;background:#b30000;color:#fff;" +
      "font:14px/1.4 Arial,Helvetica,sans-serif;text-align:center;padding:4px 8px;";
    document.body.appendChild(banner);
  }

  // The seed comes straight from the setup box; hashing lets it be any string.
  const seed = hashStringToSeed(seedInput);
  const rng = mulberry32(seed);

  const useMappingA = yesKey === "x";
  KEY_YES = useMappingA ? "x" : "m";
  KEY_NO  = useMappingA ? "m" : "x";
  const keyMappingLabel = useMappingA ? "A" : "B";

  const jsPsych = initJsPsych({
    on_finish: function () {
      if (fullscreenMode) {
        document.body.classList.remove("hide-cursor");
        if (document.fullscreenElement) {
          document.exitFullscreen().catch((e) => {
            console.error("Could not exit fullscreen:", e);
          });
        }
      }
      const qualtricsConfigured = QUALTRICS_URL !== "REPLACE_WITH_YOUR_QUALTRICS_LINK";
      if (qualtricsConfigured) {
        const redirectURL = new URL(QUALTRICS_URL);
        redirectURL.searchParams.set("subjCode", subjectID);
        window.location = redirectURL.toString();
      }
    },
  });

  SUBJECT_ID = subjectID;
  jsPsych.data.addProperties({
    subject_id: subjectID,
    key_mapping: keyMappingLabel,
    questionnaire_order: questionnaireOrder,
  });

  const timeline = [];

  if (!skipCategoryTask) {
    const [practiceRaw, mainRaw] = await Promise.all([
      loadCSV("practice_trials.csv"),
      loadCSV("final_trials_master.csv"),
    ]);

    const practiceTrials = seededShuffle(practiceRaw, rng);
    let mainTrials = seededInterleaveByCategory(mainRaw, rng, MIN_CATEGORY_GAP);

    if (demoMode) {
      // A random subset of the main trials, kept category-spaced.
      const demoSubset = new Set(
        seededShuffle(mainRaw, rng).slice(0, DEMO_TRIAL_COUNT)
      );
      mainTrials = mainTrials.filter((t) => demoSubset.has(t));
    }

    // Example item shown in the instructions (page 2 flow diagram and the page 5
    // real-time example trial).
    const EXAMPLE_TRIAL = {
      category: "A TYPE OF FRUIT",
      word: "APPLE",
      condition: "example",
      correct_answer: "yes",
    };
    const exampleKey = EXAMPLE_TRIAL.correct_answer === "yes" ? KEY_YES : KEY_NO;

    const FLOW_STYLE = `
      <style>
        .flow-row {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 32px;
          margin: 30px auto;
          max-width: 900px;
        }
        .flow-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          max-width: 200px;
        }
        .flow-col .flow-label { font-size: 18px; }
        .flow-col .flow-stim { font-size: 34px; font-weight: bold; }
        .flow-arrow { align-self: center; padding-top: 26px; font-size: 24px; color: #888; }
      </style>
    `;

    // Pages 1-3: welcome, the trial-flow example, and the "pay attention" note.
    timeline.push({
      type: jsPsychInstructions,
      pages: [
        // Page 1: Welcome
        `
          <div class="instructions-block">
            <h2>Welcome</h2>
            <p>Hello and welcome to the experiment!</p>
            <p>In this experiment, you will determine whether a <strong>word</strong> belongs to a <strong>category</strong>.</p>
            <p>Press "Next" to continue.</p>
          </div>
        `,

        // Page 2: the trial flow, shown left to right
        `
          <div class="instructions-block">
            ${FLOW_STYLE}
            <p>Every trial will have the following flow:</p>
            <div class="flow-row">
              <div class="flow-col">
                <div class="flow-label">You will see <strong>a category</strong></div>
                <div class="flow-stim">${EXAMPLE_TRIAL.category}</div>
              </div>
              <div class="flow-arrow">&rarr;</div>
              <div class="flow-col">
                <div class="flow-label">Then you will see a fixation</div>
                <div class="flow-stim">+</div>
              </div>
              <div class="flow-arrow">&rarr;</div>
              <div class="flow-col">
                <div class="flow-label">Followed by a <strong>word</strong></div>
                <div class="flow-stim">${EXAMPLE_TRIAL.word}</div>
              </div>
            </div>
            <p>Your job is to indicate whether this word IS or IS NOT a member of the category.</p>
            <p>Press <strong>"${KEY_YES}"</strong> for "yes" and <strong>"${KEY_NO}"</strong> for "no".</p>
            <p>In this case, you would press <strong>"${exampleKey}"</strong>.</p>
            <p>Press "Next" to continue.</p>
          </div>
        `,

        // Page 3: Special note
        `
          <div class="instructions-block">
            <h2>Pay attention!</h2>
            <p>The word will only appear on the screen for a short period of time and will then be replaced by some X's and a question mark.</p>
            <p>You are allowed to take as long as you need to respond, but please try to be as <strong>accurate and quick as possible</strong>.</p>
            <p>Press "Next" for an example in real time.</p>
          </div>
        `,
      ],
      show_clickable_nav: true,
      key_forward: "ArrowRight",
      key_backward: "ArrowLeft",
    });

    // Page 4: intro to the real-time example
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <div class="instructions-block">
          <p>Now we are going to show you what one full trial looks like in real time.</p>
          <p><strong>Remember!</strong> The word will only appear for a very short time, so pay attention. You have as long as you need to respond.</p>
          <p>Remember to press <strong>"${KEY_YES}"</strong> if the word IS a member of the category and <strong>"${KEY_NO}"</strong> is the word IS NOT a member of the category.</p>
          <p>Press any key now to show the timed example of what a trial will look like.</p>
        </div>
      `,
      data: { screen: "example_intro" },
    });

    // Page 5: one real-time example trial (not saved, no buzz)
    timeline.push(...buildTrialSequence(EXAMPLE_TRIAL, jsPsych, "example", null));

    // Page 6: overview of the three stages
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <div class="instructions-block">
          <h2>Great job!</h2>
          <p>Remember, place one index finger on the <strong>"x"</strong> key and your other index finger on the <strong>"m"</strong> key. </p>
          <p>Press <strong>"${KEY_YES}"</strong> for "yes" and <strong>"${KEY_NO}"</strong> for "no". </p>
          <p>There are three stages to this study:</p>
          <p><strong>Stage 1: Practice phase</strong> so you can get used to doing the task. You will wear the headphones for this phase, and <strong>if you answer incorrectly you will hear a small buzz </strong>. If you are hearing lots of buzzes, slow down just a little.</p>
          <p><strong>Stage 2: Experimental phase.You will not hear any more buzzes during this phase</strong>, but focus on answering as accurately and quickly as you can.</p>
          <p><strong>Stage 3: Questionnaires.</strong> The final phase will take you to some questionnaires. <strong>Take your time and answer thoughtfully.</strong></p>
          <p>Press any key to continue.</p>
        </div>
      `,
      data: { screen: "stages_overview" },
    });

    // Page 7: final reminders. Advanced by the researcher with "q" (not shown to
    // the participant).
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <div class="instructions-block">
          <h2>Remember</h2>
          <p>Press <strong>"${KEY_YES}"</strong> if the word IS a member of the previous category, and press <strong>"${KEY_NO}"</strong> if it is not.</p>
          <p>Respond accurately and pay attention!</p>
          <p>Please let the researcher know you have finished the instructions, and ask any questions you may have.</p>
        </div>
      `,
      choices: ["q"],
      data: { screen: "final_reminders" },
    });

    // Page 8: shown after the researcher presses "q"; starts the practice trials.
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <div class="instructions-block">
          <p>When you are ready to begin the practice trials, put your headphones on, place your fingers on the response keys, and press any key to start.</p>
        </div>
      `,
      data: { screen: "start_practice" },
    });

    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="fixation">+</div>`,
      choices: "NO_KEYS",
      trial_duration: NEXT_TRIAL_FIXATION_MS,
      data: { screen: "next_trial_fixation", phase: "practice" },
      on_start: function () {
        showPracticeReminder();
      },
    });

    practiceTrials.forEach((trial, i) => {
      timeline.push(...buildTrialSequence(trial, jsPsych, "practice", i + 1));
    });

    // End of practice -> Stage 2. The participant advances themselves.
    // (This transition is not part of the written instructions doc.)
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <div class="instructions-block">
          <h2>End of practice</h2>
          <p>You have finished the practice phase. You can now take your headphones off for the rest of the task.</p>
          <p><strong>Stage 2, the experimental phase, will begin next.</strong> There will be no more buzzes. Keep answering as accurately and quickly as you can.</p>
          <p>Remember: press <strong>"${KEY_YES}"</strong> for "yes" and <strong>"${KEY_NO}"</strong> for "no", and respond as soon as the word shows on the screen.</p>
          <p>If you have any questions, please let the researcher know before continuing.</p>
          <p>Press any key to begin.</p>
        </div>
      `,
      data: { screen: "practice_to_test" },
      on_start: function () {
        hidePracticeReminder();
      },
    });

    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="fixation">+</div>`,
      choices: "NO_KEYS",
      trial_duration: NEXT_TRIAL_FIXATION_MS,
      data: { screen: "next_trial_fixation", phase: "test" },
    });

    mainTrials.forEach((trial, i) => {
      timeline.push(...buildTrialSequence(trial, jsPsych, "test", i + 1));
    });

    // One row per trial, only the columns we care about, in a fixed order.
    function buildCleanCSV() {
      const rows = jsPsych.data
        .get()
        .filter({ trialsave: true })
        .trials.map((t) => ({
          subjCode: t.subjCode,
          phase: t.phase,
          trial_num: t.trial_num,
          trial_type: t.condition,       // target / E1-E4 / *_homophone / *_spelling / Filler / nonword
          category: t.category,
          word: t.word,
          yes_key: t.yes_key,
          response: t.response,          // raw key pressed ("x" / "m")
          correct_response: t.correct_response,
          correct: t.correct,            // 1 = matched correct_response, 0 = did not
          rt: t.rt,                      // ms from target-word onset to keypress
        }));
      return Papa.unparse(rows);
    }

    function downloadCSV(filename) {
      const blob = new Blob([buildCleanCSV()], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    const datapipeConfigured = DATAPIPE_EXPERIMENT_ID !== "REPLACE_WITH_YOUR_DATAPIPE_ID";
    // Demo runs get a unique, clearly-labelled filename so repeated tests don't
    // collide with DataPipe's "filename already exists" rejection.
    const dataFilename = demoMode
      ? `demo_${subjectID}_${Date.now()}.csv`
      : `${subjectID}.csv`;

    if (datapipeConfigured) {
      timeline.push({
        type: jsPsychPipe,
        action: "save",
        experiment_id: DATAPIPE_EXPERIMENT_ID,
        filename: dataFilename,
        data_string: () => buildCleanCSV(),
        on_finish: function (data) {
          // The DataPipe plugin never throws on a rejected upload, so inspect the
          // server response and fall back to a local download if it failed.
          console.log("[DataPipe] save response:", JSON.stringify(data));
          const msg = String(
            (data && (data.message || data.error || data.result)) || ""
          ).toLowerCase();
          const looksOk =
            data &&
            !data.error &&
            data.success !== false &&
            (data.message !== undefined || data.result !== undefined) &&
            !/error|fail|not accepting|exceed|invalid|denied|missing/.test(msg);
          if (!looksOk) {
            console.error(
              "[DataPipe] upload did NOT succeed — downloading a local backup instead. " +
                "Check: (1) data collection is enabled for this experiment on pipe.jspsych.org, " +
                "(2) the OSF component is still linked, (3) this filename was not already uploaded, " +
                "(4) the session limit has not been reached."
            );
            data.datapipe_failed = true;
            try {
              downloadCSV(`BACKUP_${dataFilename}`);
            } catch (e) {
              console.error("[DataPipe] local backup also failed:", e);
            }
          }
        },
      });

      // Shown only if the upload above failed.
      timeline.push({
        timeline: [
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `<div class="instructions-block"><p>We could not upload your data automatically. A copy has been saved to this computer's downloads folder. Please let the researcher know.</p></div>`,
            choices: "NO_KEYS",
            trial_duration: 5000,
          },
        ],
        conditional_function: function () {
          const last = jsPsych.data.get().last(1).trials[0];
          return Boolean(last && last.datapipe_failed);
        },
      });
    } else {
      timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `<div class="instructions-block"><p>(Saving a local copy of the data to your downloads folder.)</p></div>`,
        choices: "NO_KEYS",
        trial_duration: 1500,
        on_start: function () {
          try {
            downloadCSV(dataFilename);
          } catch (e) {
            console.error("Local save failed:", e);
          }
        },
      });
    }
  }

  // FIT and IRQ questionnaires: always run in full, whether or not the
  // category task above was skipped or demo mode is on, each saving to its
  // own "<subjCode>_FIT.csv" / "<subjCode>_IRQ.csv" file. Their order is
  // counterbalanced per participant via the "Questionnaire order" setup field.
  const fitTimeline = buildFITTimeline(jsPsych, subjectID, rng);
  const irqTimeline = buildIRQTimeline(jsPsych, subjectID, rng);
  if (questionnaireOrder === "irq_first") {
    timeline.push(...irqTimeline, ...fitTimeline);
  } else {
    timeline.push(...fitTimeline, ...irqTimeline);
  }

  const qualtricsConfigured = QUALTRICS_URL !== "REPLACE_WITH_YOUR_QUALTRICS_LINK";
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: qualtricsConfigured
      ? `<div class="instructions-block"><h2>Thank you!</h2><p>The study is now complete. You will now be redirected to a final survey.</p></div>`
      : `<div class="instructions-block"><h2>Thank you!</h2><p>The study is now complete. You may close this window.</p></div>`,
    choices: "NO_KEYS",
    trial_duration: qualtricsConfigured ? 2000 : null,
  });

  jsPsych.run(timeline);
}

runExperiment();
