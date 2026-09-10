const CATEGORY_DURATION_MS      = 1000;
const ISI_DURATION_MS           = 250;
const WORD_DURATION_MS          = 100;
const PRACTICE_WORD_DURATION_MS = 100;

const MASK_DURATION_MS          = 300;

const POST_RESPONSE_DELAY_MS    = 500;
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
// Forms of Inner Thinking (FIT) questionnaire
// Source: Forms_of_Inner_Thinking (FIT)_v202604.pdf, section A (prompt-based
// questionnaire) and section B (general frequency estimation).
// ---------------------------------------------------------------------------

const FIT_LONG_DURATION_MS  = 20000;
const FIT_SHORT_DURATION_MS = 10000;

const FIT_BLOCKS = [
  {
    id: "practice",
    label: "Practice",
    duration: FIT_LONG_DURATION_MS,
    prompts: ["Think about what your ideal work environment would be like"],
  },
  {
    id: "block1a",
    label: "Thinking (reflexive)",
    duration: FIT_LONG_DURATION_MS,
    prompts: [
      "Think about what you would do on an unexpected day off",
      "Think about what your perfect weekend would include",
      "Think about your ideal daily routine",
      "Think about what you would do if you won the lottery",
      "Think about what you plan to do tomorrow",
    ],
  },
  {
    id: "block1b",
    label: "Thinking (factual)",
    duration: FIT_LONG_DURATION_MS,
    prompts: [
      "Think about the weather in the city you live in",
      "Think about things that a five-year-old can do for fun",
      "Think about good oral hygiene habits",
      "Think about the traffic in the city you live in",
      "Think about what people usually do on a beach vacation",
    ],
  },
  {
    id: "block2a",
    label: "General Inner Speaking",
    duration: FIT_LONG_DURATION_MS,
    prompts: [
      "Imagine talking about the cost of living in your area",
      "Imagine talking about popular foods in your area",
      "Imagine talking about activities people typically do on weekends",
      "Imagine talking about useful skills in life",
      "Imagine talking about how technology has changed our lives",
    ],
  },
  {
    id: "block2b",
    label: "General Inner Hearing",
    duration: FIT_LONG_DURATION_MS,
    prompts: [
      "Imagine hearing someone talk about the nutrients the human body needs",
      "Imagine hearing someone talk about the neighborhood you live in",
      "Imagine hearing someone talk about essential preparation for traveling",
      "Imagine hearing someone talk about how people usually spend their mornings",
      "Imagine hearing someone talk about good habits to stay healthy",
    ],
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

const FIT_LIKERT_LABELS = ["Never", "Rarely", "Sometimes", "Often", "Always"];

const FIT_FREQUENCY_QUESTIONS = [
  { prompt: "How often do you think in words that have sound in your mind?", name: "freq_auditory", labels: FIT_LIKERT_LABELS, required: true },
  { prompt: "How often do you think in words that have a written form in your mind?", name: "freq_orthographic", labels: FIT_LIKERT_LABELS, required: true },
  { prompt: "How often do you think in words with imagined movements of your mouth, lips, tongue, or throat?", name: "freq_artic_imagined", labels: FIT_LIKERT_LABELS, required: true },
  { prompt: "How often do you think in words while physically moving your mouth, lips, tongue, or throat?", name: "freq_artic_real", labels: FIT_LIKERT_LABELS, required: true },
  { prompt: "How often do you think in words that you say out loud?", name: "freq_artic_outloud", labels: FIT_LIKERT_LABELS, required: true },
  { prompt: "How often do you think in words without any imagined sound, visual form, or movement?", name: "freq_pure_lexical", labels: FIT_LIKERT_LABELS, required: true },
  { prompt: "How often do you think in visual images?", name: "freq_visual", labels: FIT_LIKERT_LABELS, required: true },
  { prompt: "How often do you think in abstract thoughts and ideas (without any words or images)?", name: "freq_concept", labels: FIT_LIKERT_LABELS, required: true },
];

// Fixed column order for the tidy FIT CSV. Per-prompt rows leave the
// freq_* columns blank; the 8 frequency-summary rows (one per Section B
// item) leave the per-prompt columns blank instead.
const FIT_CSV_COLUMNS = [
  "subjCode", "block", "block_label", "prompt_index", "prompt",
  "lang_english", "lang_other", "visual", "concept", "eyes",
  "auditory", "orthographic", "artic_outloud", "artic_real", "artic_imagined", "pure_lexical",
  "other_experiences", "other_experiences_text",
  "freq_question", "freq_response",
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
// survey, and the DataPipe/local-download save of "<subjCode>_FIT.csv".
// In demo mode, only the practice prompt plus the first prompt of every
// other block are run, so the whole section can be exercised in under a
// minute.
function buildFITTimeline(jsPsych, subjectID, demoMode) {
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
  });

  let globalPromptIndex = 0;
  FIT_BLOCKS.forEach((block) => {
    const prompts = demoMode ? block.prompts.slice(0, 1) : block.prompts;
    prompts.forEach((promptText) => {
      globalPromptIndex += 1;
      timeline.push(
        ...buildFITPromptTrials(jsPsych, promptText, block.duration, block.id, block.label, globalPromptIndex)
      );
    });
  });

  timeline.push({
    type: jsPsychSurveyLikert,
    preamble: `
      <h2>A few final questions</h2>
      <p>Thinking generally about how your mind works (not about the specific prompts above), please answer the following:</p>
    `,
    questions: FIT_FREQUENCY_QUESTIONS,
    data: { fitsave_freq: true, screen: "fit_frequency_survey", subjCode: SUBJECT_ID },
  });

  // One tidy row per prompt (forms + other-experiences answers), plus one
  // row per Section B frequency question, all in a single CSV per subject.
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

    const freqTrial = jsPsych.data.get().filter({ fitsave_freq: true }).last(1).trials[0];
    if (freqTrial) {
      FIT_FREQUENCY_QUESTIONS.forEach((q) => {
        rows.push({
          subjCode: freqTrial.subjCode,
          block: "frequency",
          freq_question: q.prompt,
          freq_response: freqTrial.response[q.name],
        });
      });
    }

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
  const fitFilename = demoMode
    ? `demo_${subjectID}_FIT_${Date.now()}.csv`
    : `${subjectID}_FIT.csv`;

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
        <label class="param-check">
          <input type="checkbox" name="demo">
          Demo mode (short ${DEMO_TRIAL_COUNT}-trial run)
        </label>
        <label class="param-check">
          <input type="checkbox" name="skipCategory">
          Skip category task (go straight to the questionnaire)
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
    form.subjCode.focus();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const subjCode = form.subjCode.value.trim();
      const seed = form.seed.value.trim();
      const yesKey = form.yesKey.value;
      if (!subjCode || !seed || !yesKey) {
        errorEl.textContent = "Please fill in all fields.";
        (!subjCode ? form.subjCode : !seed ? form.seed : form.yesKey).focus();
        return;
      }
      // Create + unlock the feedback-buzz audio while we have a user gesture.
      initFeedbackBuzz();

      overlay.remove();
      resolve({
        subjectID: subjCode,
        seed: seed,
        yesKey: yesKey, // "x" | "m"
        demoMode: form.demo.checked,
        skipCategoryTask: form.skipCategory.checked,
      });
    });
  });
}

async function runExperiment() {
  const urlParams = new URLSearchParams(window.location.search);
  const { subjectID, seed: seedInput, yesKey, demoMode, skipCategoryTask } =
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
      const qualtricsConfigured = QUALTRICS_URL !== "REPLACE_WITH_YOUR_QUALTRICS_LINK";
      if (qualtricsConfigured) {
        const redirectURL = new URL(QUALTRICS_URL);
        redirectURL.searchParams.set("subjCode", subjectID);
        window.location = redirectURL.toString();
      }
    },
  });

  SUBJECT_ID = subjectID;
  jsPsych.data.addProperties({ subject_id: subjectID, key_mapping: keyMappingLabel });

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
    });

    practiceTrials.forEach((trial, i) => {
      timeline.push(...buildTrialSequence(trial, jsPsych, "practice", i + 1));
    });

    // End of practice -> Stage 2. Advanced by the researcher with "q".
    // (This transition is not part of the written instructions doc.)
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <div class="instructions-block">
          <h2>End of practice</h2>
          <p>You have finished the practice phase. You can now take your headphones off for the rest of the task.</p>
          <p><strong>Stage 2, the experimental phase, will begin next.</strong> There will be no more buzzes. Keep answering as accurately and quickly as you can.</p>
          <p>Remember: press <strong>"${KEY_YES}"</strong> for "yes" and <strong>"${KEY_NO}"</strong> for "no", and respond as soon as the word shows on the screen.</p>
          <p>Please let the researcher know when you are ready to begin.</p>
        </div>
      `,
      choices: ["q"],
      data: { screen: "practice_to_test" },
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

  // FIT (Forms of Inner Thinking) questionnaire: always runs, whether or not
  // the category task above was skipped, and saves to its own
  // "<subjCode>_FIT.csv" file separate from the category-task data.
  timeline.push(...buildFITTimeline(jsPsych, subjectID, demoMode));

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
