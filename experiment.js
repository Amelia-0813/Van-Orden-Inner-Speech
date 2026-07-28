/* ============================================================
   CATEGORY VERIFICATION EXPERIMENT
   ------------------------------------------------------------
   - Practice trials: practice_trials.csv   (10 trials, with feedback)
   - Main trials:     final_trials_master.csv (300 trials, no feedback)
   - Each trial: category shown -> blank (ISI) -> word shown
                 respond "z" = yes, "/" = no, within a time limit
   - Trial order is shuffled per participant using a seed derived
     from their Prolific / subject ID, so shuffles are different
     across people but reproducible for the same ID.
   - Same-category items are spaced apart so they don't repeat
     back-to-back.
   - Data is saved via DataPipe (fill in your experiment_id below).
   ============================================================ */

// ---------------- CONFIGURABLE SETTINGS ----------------------
// Adjust these to taste; nothing else in the file needs to change.

const CATEGORY_DURATION_MS = 1000;   // how long the category word/phrase stays on screen
const ISI_DURATION_MS       = 500;   // blank/fixation gap between category and target word
const WORD_TIME_LIMIT_MS    = 1200;  // response window for the target word (per your spec)
const FEEDBACK_DURATION_MS  = 1000;  // how long practice feedback is shown
const MIN_CATEGORY_GAP      = 3;     // minimum number of trials between two items from the same category

const KEY_YES = "z";
const KEY_NO  = "/";

// DataPipe experiment ID -- replace with your own, generated at
// https://pipe.jspsych.org/ (or whatever your mentor's lab uses)
const DATAPIPE_EXPERIMENT_ID = "REPLACE_WITH_YOUR_DATAPIPE_ID";

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

  const wordScreen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="word-display">${trial.word}</div>`,
    choices: [KEY_YES, KEY_NO],
    trial_duration: WORD_TIME_LIMIT_MS,
    data: {
      screen: "word",
      phase: isPractice ? "practice" : "test",
      category: trial.category,
      word: trial.word,
      condition: trial.condition,
      correct_answer: trial.correct_answer,
    },
    on_finish: function (data) {
      let given = null;
      if (data.response === KEY_YES) given = "yes";
      else if (data.response === KEY_NO) given = "no";
      data.given_answer = given;
      data.correct = given === trial.correct_answer;
      data.no_response = data.response === null;
    },
  };

  const sequence = [categoryScreen, isiScreen, wordScreen];

  if (isPractice) {
    const feedbackScreen = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: function () {
        const last = jsPsych.data.get().last(1).values()[0];
        if (last.no_response) {
          return `<p style="font-size:28px;color:#b8860b;text-align:center;">Too slow! Please try to respond faster.</p>`;
        }
        if (last.correct) {
          return `<p style="font-size:28px;color:green;text-align:center;">Correct!</p>`;
        }
        return `<p style="font-size:28px;color:red;text-align:center;">Incorrect. The correct answer was "${trial.correct_answer}".</p>`;
      },
      choices: "NO_KEYS",
      trial_duration: FEEDBACK_DURATION_MS,
      data: { screen: "feedback", phase: "practice" },
    };
    sequence.push(feedbackScreen);
  }

  return sequence;
}

// ---------------- MAIN ------------------------------------------

async function runExperiment() {
  // Identify the participant (Prolific, custom URL param, or fallback)
  const urlParams = new URLSearchParams(window.location.search);
  let subjectID =
    urlParams.get("PROLIFIC_PID") ||
    urlParams.get("subject") ||
    urlParams.get("subj");
  if (!subjectID) {
    subjectID = "S" + Math.floor(Math.random() * 1e9);
  }

  const seed = hashStringToSeed(subjectID);
  const rng = mulberry32(seed);

  const jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: true,
    on_finish: function () {
      // Optional: redirect back to Prolific etc. after DataPipe save completes
      // window.location = "https://app.prolific.com/submissions/complete?cc=YOUR_CODE";
    },
  });

  jsPsych.data.addProperties({ subject_id: subjectID });

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

  // ---- Preload (nothing external to preload here, but kept for future images) ----
  timeline.push({
    type: jsPsychPreload,
    images: [],
    audio: [],
    video: [],
  });

  // ---- Instructions (your exact wording, split into pages) ----
  timeline.push({
    type: jsPsychInstructions,
    pages: [
      `<div class="instructions-block">
         <h2>Welcome to the Study</h2>
         <p>In this experiment, you will first see a category and then a word. Your task is to decide if a word belongs to a category or not.</p>
         <p>Click "Next" to see some examples.</p>
       </div>`,
      `<div class="instructions-block">
         <p>For example, you'll see something like this:</p>
         <p>&ldquo;A kind of food&rdquo;. Then a word &ldquo;beef&rdquo; &mdash; yes or no?</p>
         <p>Press "z" if yes, press "/" if no.</p>
         <p>In this case, you should press "yes".</p>
       </div>`,
      `<div class="instructions-block">
         <p>Let's see another example.</p>
         <p>&ldquo;A part of lion's body&rdquo;, &ldquo;pause&rdquo; &mdash; yes or no?</p>
         <p>You should press "/" (no).</p>
       </div>`,
      `<div class="instructions-block">
         <p>The key is to respond as accurately as possible, and as fast as possible. We are looking for right and quick answers.</p>
         <p>If you do not get a chance to press the key, it is okay. We will keep moving.</p>
         <p>You will first have some practice trials and then the real experiment. At the end, we will ask you to complete a questionnaire.</p>
         <p>Remember: press "z" for yes, "/" for no.</p>
         <p>Please let the experimenter know when you are ready to begin.</p>
       </div>`,
    ],
    show_clickable_nav: true,
    key_forward: "ArrowRight",
    key_backward: "ArrowLeft",
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
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="instructions-block">
        <h2>Great job!</h2>
        <p>You have finished the practice trials. Now the real experiment will begin.</p>
        <p>Remember: press "z" for yes, "/" for no. Respond as quickly and accurately as possible.</p>
        <p>Press any key to start.</p>
      </div>`,
  });

  // ---- Main trials (no feedback) ----
  mainTrials.forEach((trial) => {
    timeline.push(...buildTrialSequence(trial, jsPsych, false));
  });

  // ---- Questionnaire (placeholder -- edit questions as needed) ----
  timeline.push({
    type: jsPsychSurveyHtmlForm,
    preamble: `<div class="instructions-block"><h2>Almost done!</h2><p>Please answer a few final questions.</p></div>`,
    html: `
      <p>Age: <input type="number" name="age" required></p>
      <p>Gender:
        <select name="gender" required>
          <option value=""></option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="nonbinary">Non-binary</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </p>
      <p>Native English speaker?
        <select name="native_english" required>
          <option value=""></option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </p>
      <p>Any comments about the study? <br>
        <textarea name="comments" rows="3" cols="50"></textarea>
      </p>
    `,
    data: { screen: "questionnaire" },
  });

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
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="instructions-block"><h2>Thank you!</h2><p>The study is now complete. You may close this window.</p></div>`,
    choices: "NO_KEYS",
  });

  jsPsych.run(timeline);
}

runExperiment();
