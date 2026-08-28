/* ============================================================
   CATEGORY VERIFICATION EXPERIMENT
   ------------------------------------------------------------
   - Practice trials: practice_trials.csv   (10 trials, with feedback)
   - Main trials:     final_trials_master.csv (300 trials, no feedback)
   - Each trial: category shown -> blank (ISI) -> word shown
                 respond "x" = yes, "m" = no, within a time limit
   - Trial order is shuffled per participant using a seed derived
     from their Prolific / subject ID, so shuffles are different
     across people but reproducible for the same ID.
   - Same-category items are spaced apart so they don't repeat
     back-to-back.
   - Data is saved via DataPipe (fill in your experiment_id below).
   ============================================================ */

// ---------------- CONFIGURABLE SETTINGS ----------------------
// Adjust these to taste; nothing else in the file needs to change.

const CATEGORY_DURATION_MS      = 1000;  // how long the category word/phrase stays on screen
const ISI_DURATION_MS           = 500;   // blank/fixation gap between category and target word
const WORD_DURATION_MS          = 500;   // how long the real word is visible before being masked (main trials)
const PRACTICE_WORD_DURATION_MS = 500;   // how long the real word is visible before being masked (practice trials)
const MASK_DURATION_MS          = 300;   // how long the XXXX mask stays on screen after the word
const BLANK_DURATION_MS         = 300;   // how long the screen stays blank after the mask, before the response deadline
const FEEDBACK_DURATION_MS      = 1000;  // how long practice feedback is shown
const MIN_CATEGORY_GAP          = 3;     // minimum number of trials between two items from the same category

// Response keys: assigned per participant for counterbalancing -- see
// the "KEY MAPPING COUNTERBALANCE" block inside runExperiment() below.
// These defaults are just a fallback in case that logic is ever skipped.
let KEY_YES = "x";
let KEY_NO  = "m";

// path to the incorrect-answer feedback buzz
const FEEDBACK_AUDIO = "buzz.wav"; // incorrect-answer feedback sound, practice trials only

// DataPipe experiment ID -- replace with your own, generated at
// https://pipe.jspsych.org/ (or whatever your mentor's lab uses)
const DATAPIPE_EXPERIMENT_ID = "vwMy1envtzkv";

// Qualtrics survey to redirect to after the whole jsPsych experiment ends
// (e.g. demographics / additional scales). Replace with your real link once
// it's ready -- leave as-is and the "Thank you" screen just stays put, no
// redirect happens.
const QUALTRICS_URL = "https://uwmadison.co1.qualtrics.com/jfe/form/SV_1ObEoClNeRgEhNk"; // demographics / final survey

// ---------------- SEEDED RNG UTILITIES ------------------------

// Simple, fast, deterministic PRNG (mulberry32)
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

// Turn a subject ID string into a numeric seed
function hashStringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Fisher-Yates shuffle using a seeded RNG
function seededShuffle(array, rng) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Interleave trials so the same `category` doesn't repeat within
// `minGap` trials of itself. Falls back gracefully if it ever gets stuck.
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
      // constraint relaxation if we painted ourselves into a corner
      available = categories.filter((c) => buckets[c].length > 0);
    }
    // weight choice by how many items remain in each bucket, so
    // categories empty out at roughly the same rate
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

// ---------------- LOAD CSV FILES ------------------------------

async function loadCSV(path) {
  const response = await fetch(path);
  const text = await response.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

// ---------------- BUILD A SINGLE TRIAL SEQUENCE ----------------
// Returns an array of jsPsych trial objects: [category, ISI, word, (feedback)]

function buildTrialSequence(trial, jsPsych, isPractice) {
  const categoryScreen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="category-display">${trial.category}</div>`,
    choices: "NO_KEYS",
    trial_duration: CATEGORY_DURATION_MS,
    data: { screen: "category", phase: isPractice ? "practice" : "test" },
  };

  const isiScreen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="fixation">+</div>`,
    choices: "NO_KEYS",
    trial_duration: ISI_DURATION_MS,
    data: { screen: "isi", phase: isPractice ? "practice" : "test" },
  };

  // track correctness in closure for the conditional audio-feedback trial below
  let responseCorrect = null;

  // Pattern masking + blank: the word is visible for wordDurationForThisTrial
  // ms, then immediately replaced (same position, same trial) by a string of
  // "X" the same length as the word. The mask stays on screen for
  // MASK_DURATION_MS ms, then the screen goes blank for BLANK_DURATION_MS ms.
  // The trial ends when the blank period ends -- that's the hard response
  // deadline, whether or not the participant has answered yet.
  const wordDurationForThisTrial = isPractice
    ? PRACTICE_WORD_DURATION_MS
    : WORD_DURATION_MS;
  const maskOnsetMs = wordDurationForThisTrial;
  const blankOnsetMs = wordDurationForThisTrial + MASK_DURATION_MS;
  const totalTrialDurationMs = wordDurationForThisTrial + MASK_DURATION_MS + BLANK_DURATION_MS;

  const wordScreen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="word-display" id="word-stim">${trial.word}</div>`,
    choices: [KEY_YES, KEY_NO],
    trial_duration: totalTrialDurationMs,
    data: {
      screen: "word",
      phase: isPractice ? "practice" : "test",
      category: trial.category,
      word: trial.word,
      condition: trial.condition,
      correct_answer: trial.correct_answer,
      word_duration_ms: wordDurationForThisTrial,
      mask_duration_ms: MASK_DURATION_MS,
      blank_duration_ms: BLANK_DURATION_MS,
    },
    on_load: function () {
      const maskString = "X".repeat(trial.word.length);
      const el = document.getElementById("word-stim");
      setTimeout(() => {
        if (el) el.innerHTML = maskString;
      }, maskOnsetMs);
      setTimeout(() => {
        if (el) el.innerHTML = "";
      }, blankOnsetMs);
    },
    on_finish: function (data) {
      let given = null;
      if (data.response === KEY_YES) given = "yes";
      else if (data.response === KEY_NO) given = "no";
      data.given_answer = given;
      data.correct = given === trial.correct_answer;
      data.no_response = data.response === null;
      // NOTE: a no-response is treated as incorrect per spec, so this
      // will also trigger the buzz -- matches "If you do not respond
      // within the time window, your answer will be counted as incorrect."
      responseCorrect = data.correct;
    },
  };

  const sequence = [categoryScreen, isiScreen, wordScreen];

  if (isPractice) {
    // Audio-only feedback that plays ONLY on incorrect answers.
    // Wrapped in a timeline node so conditional_function works
    // correctly in jsPsych v7, and the audio trial is skipped
    // entirely (not just rushed) when the answer is correct.
    sequence.push({
      timeline: [{
        type: jsPsychAudioKeyboardResponse,
        stimulus: FEEDBACK_AUDIO,
        choices: "NO_KEYS",
        trial_ends_after_audio: true,
        response_allowed_while_playing: false,
        data: { screen: "feedback", phase: "practice" },
      }],
      conditional_function: () => responseCorrect === false,
    });
  }

  return sequence;
}

// ---------------- MAIN ------------------------------------------

async function runExperiment() {
  // Identify the participant (Prolific, custom URL param, or fallback)
  const urlParams = new URLSearchParams(window.location.search);
  let subjectID =
    urlParams.get("subjCode") ||
    urlParams.get("PROLIFIC_PID") ||
    urlParams.get("subject") ||
    urlParams.get("subj");
  if (!subjectID) {
    subjectID = "S" + Math.floor(Math.random() * 1e9);
  }

  const seed = hashStringToSeed(subjectID);
  const rng = mulberry32(seed);

  // ---- KEY MAPPING COUNTERBALANCE ----
  // Derived from the last run of digits in subjCode (e.g. "VIS_02" -> 2).
  //   odd  -> mapping A: x = yes, m = no
  //   even -> mapping B: m = yes, x = no
  const digitMatch = subjectID.match(/(\d+)(?!.*\d)/); // last run of digits
  const subjectNumber = digitMatch ? parseInt(digitMatch[1], 10) : 0;
  const useMappingA = subjectNumber % 2 === 1; // odd -> A, even -> B
  KEY_YES = useMappingA ? "x" : "m";
  KEY_NO  = useMappingA ? "m" : "x";
  const keyMappingLabel = useMappingA ? "A" : "B";

  const jsPsych = initJsPsych({
    on_finish: function () {
      // Redirect to the Qualtrics survey once it's configured, carrying the
      // subjCode along as a URL param so responses there can be linked back
      // to this participant's jsPsych data. Until QUALTRICS_URL is set to a
      // real link, this just does nothing and the "Thank you" screen stays put.
      const qualtricsConfigured = QUALTRICS_URL !== "REPLACE_WITH_YOUR_QUALTRICS_LINK";
      if (qualtricsConfigured) {
        window.location = `${QUALTRICS_URL}?subjCode=${encodeURIComponent(subjectID)}`;
      }
    },
  });

  jsPsych.data.addProperties({ subject_id: subjectID, key_mapping: keyMappingLabel });

  // Load and shuffle stimuli
  const [practiceRaw, mainRaw] = await Promise.all([
    loadCSV("practice_trials.csv"),
    loadCSV("final_trials_master.csv"),
  ]);

  const practiceTrials = seededShuffle(practiceRaw, rng);
  const mainTrials = seededInterleaveByCategory(mainRaw, rng, MIN_CATEGORY_GAP);

  const timeline = [];

  // ---- Consent form ----
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="consent-block">
        <h2>Consent to Participate in Research</h2>
        <p>The task you are about to do is sponsored by University of Wisconsin-Madison. It is part of a protocol titled "What are we learning from language?"</p>
        <p>The task you are asked to do involves deciding whether a word belongs to a given category. You will be shown a category and a word, and you will indicate whether the word is a member of that category. More detailed instructions for this specific task will be provided on the next screen.</p>
        <p>This task has no direct benefits. We do not anticipate any psychosocial risks. There is a risk of a confidentiality breach. Participants may become fatigued or frustrated due to the length of the study.</p>
        <p>The responses you submit as part of this task will be stored on a sercure server and accessible only to researchers who have been approved by UW-Madison. Processed data with all identifiers removed could be used for future research studies or distributed to another investigator for future research studies without additional informed consent from the subject or the legally authorized representative.</p>
        <p>You are free to decline to participate, to end participation at any time for any reason, or to refuse to answer any individual question without penalty or loss of earned compensation. We will not retain data from partial responses. If you would like to withdraw your data after participating, you may send an email lupyan@wisc.edu or complete this form which will allow you to make a request anonymously.</p>
        <p>If you have any questions or concerns about this task please contact the principal investigator: Prof. Gary Lupyan at lupyan@wisc.edu.</p>
        <p>If you are not satisfied with response of the research team, have more questions, or want to talk with someone about your rights as a research participant, you should contact University of Wisconsin's Education Research and Social &amp; Behavioral Science IRB Office at 608-263-2320.</p>
        <p><strong>By clicking the box below, I consent to participate in this task and affirm that I am at least 18 years old.</strong></p>
      </div>
    `,
    choices: ["I Agree", "I Do Not Agree"],
    data: { screen: "consent" },
    on_finish: function (data) {
      // response index 0 = "I Agree", 1 = "I Do Not Agree"
      data.consent_given = data.response === 0;
      if (data.response === 1) {
        jsPsych.abortExperiment(
          `<div class="instructions-block"><p>You have chosen not to participate. Thank you for your time. You may close this window.</p></div>`
        );
      }
    },
  });

  // ---- Preload ----
  timeline.push({
    type: jsPsychPreload,
    images: [],
    audio: [FEEDBACK_AUDIO],
    video: [],
  });

  // ---- Instructions ----
  // Small reusable style block for the boxed trial-sequence preview used in
  // the two examples below. Uses the SAME classes (category-display,
  // fixation, word-display) as the real trials, so the preview always
  // matches whatever the real experiment's CSS looks like -- just arranged
  // horizontally inside a bordered box instead of stacked vertically.
  const EXAMPLE_BOX_STYLE = `
    <style>
      .example-trial-box {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
        border: 2px solid #333;
        border-radius: 8px;
        padding: 28px 20px;
        margin: 20px auto;
        max-width: 560px;
      }
      .example-trial-box .example-divider {
        width: 0;
        align-self: stretch;
        border-left: 2px dashed #888;
      }
    </style>
  `;

  timeline.push({
    type: jsPsychInstructions,
    pages: [
      `<div class="instructions-block">
         <h2>Welcome to the Study</h2>
         <p>In this experiment, you will first see <strong>a category</strong> and then <strong>a word</strong>. Your task is to decide <strong>if the word belongs to a category or not</strong>.</p>
         <p>Click "Next" to see some examples.</p>
       </div>`,
      // Example 1: category -> ISI -> word, condensed into one boxed preview
      `<div class="instructions-block">
         ${EXAMPLE_BOX_STYLE}
         <p>You will first see a category and then a word. Your task is to decide if the word belongs to a category or not.</p>
         <p>For example, you'll see something like this:</p>
         <div class="example-trial-box">
           <div class="category-display">A kind of food</div>
           <div class="example-divider"></div>
           <div class="word-display">beef</div>
         </div>
         <p>You should press <strong>"${KEY_YES}"</strong> to indicate <strong>"yes"</strong>.</p>
       </div>`,
      // Example 2: same format
      `<div class="instructions-block">
         ${EXAMPLE_BOX_STYLE}
         <p>You will first see a category and then a word. Your task is to decide if the word belongs to a category or not.</p>
         <p>Let's see another example.</p>
         <div class="example-trial-box">
           <div class="category-display">A part of lion's body</div>
           <div class="example-divider"></div>
           <div class="word-display">pause</div>
         </div>
         <p>You should press <strong>"${KEY_NO}"</strong> to indicate <strong>"no"</strong>.</p>
       </div>`,
    ],
    show_clickable_nav: true,
    key_forward: "ArrowRight",
    key_backward: "ArrowLeft",
  });

  // ---- Final reminder page: any key to proceed ----
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="instructions-block">
        <p><strong>Respond as accurately and quickly as possible!</strong></p>
        <p>There is a limited time to respond. So make sure you click your answer quickly.</p>
        <p>If you do not respond within the time window, your answer will be counted as incorrect.</p>
        <p>You will start with some <strong>practice trials</strong>. Then you will move into the <strong>experiment</strong>. Finally, you will complete a <strong>questionnaire</strong>.</p>
        <p><strong>Remember! Press "${KEY_YES}" if the word IS a member of the category and "${KEY_NO}" if it is NOT.</strong></p>
        <p>Please let the experimenter know when you are ready to begin.</p>
      </div>`,
    data: { screen: "instructions_final" },
  });

  // ---- Practice block ----
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="instructions-block"><h2>Practice</h2><p>Press any key to begin the practice trials.</p></div>`,
  });

  practiceTrials.forEach((trial) => {
    timeline.push(...buildTrialSequence(trial, jsPsych, true));
  });

  // ---- Transition to real experiment ----
  // Silently gated on "q" so the experimenter (not the participant) controls
  // when the main block starts -- the key isn't mentioned in the on-screen text.
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="instructions-block">
        <h2>Great job!</h2>
        <p>You have finished the practice trials. Now the real experiment will begin.</p>
        <p><strong>Remember: press "${KEY_YES}" for yes, "${KEY_NO}" for no.</strong><br><strong>Respond as quickly and accurately as possible.</strong></p>
        <p>Please let the experimenter know when you are ready to begin.</p>
      </div>`,
    choices: ["q"],
  });

  // ---- Main trials (no feedback) ----
  mainTrials.forEach((trial) => {
    timeline.push(...buildTrialSequence(trial, jsPsych, false));
  });

  // Demographics/comments are now collected in the separate Qualtrics
  // survey (see QUALTRICS_URL redirect below), so the inline
  // jsPsychSurveyHtmlForm questionnaire that used to be here was removed.

  // ---- Save data via DataPipe (or local download if not yet configured) ----
  const datapipeConfigured = DATAPIPE_EXPERIMENT_ID !== "REPLACE_WITH_YOUR_DATAPIPE_ID";

  if (datapipeConfigured) {
    timeline.push({
      type: jsPsychPipe,
      action: "save",
      experiment_id: DATAPIPE_EXPERIMENT_ID,
      filename: `${subjectID}.csv`,
      data_string: () => jsPsych.data.get().csv(),
    });
  } else {
    // No DataPipe ID set yet -- just trigger a local file download so you can
    // still test the full experiment and inspect the data.
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="instructions-block"><p>(DataPipe is not configured yet — saving a local copy of the data to your downloads folder instead.)</p></div>`,
      choices: "NO_KEYS",
      trial_duration: 1500,
      on_start: function () {
        jsPsych.data.get().localSave("csv", `${subjectID}.csv`);
      },
    });
  }

  // ---- End screen ----
  // If the Qualtrics link is configured, this screen auto-advances after a
  // couple seconds so the timeline actually finishes and the on_finish
  // redirect above fires. If it's not configured yet, it behaves like
  // before -- stays on screen indefinitely (useful while testing).
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
