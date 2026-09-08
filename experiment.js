const CATEGORY_DURATION_MS      = 1000;
const ISI_DURATION_MS           = 250;
const WORD_DURATION_MS          = 100;
const PRACTICE_WORD_DURATION_MS = 100;

const MASK_DURATION_MS          = 300;

const FEEDBACK_DURATION_MS      = 1000;
const POST_RESPONSE_DELAY_MS    = 500;
const NEXT_TRIAL_FIXATION_MS    = 500;
const MIN_CATEGORY_GAP          = 3;

let KEY_YES = "x";
let KEY_NO  = "m";
let SUBJECT_ID = "";

const FEEDBACK_AUDIO = "buzz.wav";

const DATAPIPE_EXPERIMENT_ID = "vwMy1envtzkv";

const QUALTRICS_URL = "https://uwmadison.co1.qualtrics.com/jfe/form/SV_cBmgrOhfT6CscD4";

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

function buildTrialSequence(trial, jsPsych, isPractice, trialNum) {
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

  let responseCorrect = null;

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
      trialsave: true,
      screen: "word",
      phase: isPractice ? "practice" : "test",
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

      responseCorrect = data.correct === 1;
    },
  };

  const sequence = [categoryScreen, isiScreen, wordScreen];

  if (isPractice) {
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

  sequence.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="word-display"></div>`,
    choices: "NO_KEYS",
    trial_duration: POST_RESPONSE_DELAY_MS,
    data: { screen: "post_response_blank", phase: isPractice ? "practice" : "test" },
  });

  sequence.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="fixation">+</div>`,
    choices: "NO_KEYS",
    trial_duration: NEXT_TRIAL_FIXATION_MS,
    data: { screen: "next_trial_fixation", phase: isPractice ? "practice" : "test" },
  });

  return sequence;
}

async function runExperiment() {
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

  const yesKeyParam = (urlParams.get("yes_key") || "").trim().toLowerCase();
  let useMappingA;
  if (yesKeyParam === "x" || yesKeyParam === "m") {
    useMappingA = yesKeyParam === "x";
  } else {
    console.warn(
      `"yes_key" URL parameter missing or invalid (got "${urlParams.get("yes_key")}"). ` +
      `Falling back to subject-ID-based counterbalancing. Add ?yes_key=x or ?yes_key=m to the URL to set it explicitly.`
    );
    const digitMatch = subjectID.match(/(\d+)(?!.*\d)/);
    const subjectNumber = digitMatch ? parseInt(digitMatch[1], 10) : 0;
    useMappingA = subjectNumber % 2 === 1;
  }
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

  const [practiceRaw, mainRaw] = await Promise.all([
    loadCSV("practice_trials.csv"),
    loadCSV("final_trials_master.csv"),
  ]);

  const practiceTrials = seededShuffle(practiceRaw, rng);
  const mainTrials = seededInterleaveByCategory(mainRaw, rng, MIN_CATEGORY_GAP);

  const timeline = [];

  timeline.push({
    type: jsPsychPreload,
    images: [],
    audio: [FEEDBACK_AUDIO],
    video: [],
  });

  const EXAMPLE_BOX_STYLE = `
    <style>
      .example-trial-stack {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin: 20px auto;
        max-width: 400px;
      }
      .example-trial-stack .example-box {
        width: 100%;
        box-sizing: border-box;
        border: 2px solid #333;
        border-radius: 8px;
        padding: 24px 20px;
        text-align: center;
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

      `<div class="instructions-block">
         ${EXAMPLE_BOX_STYLE}
         <p>You will first see a category and then a word. Your task is to decide if the word belongs to a category or not.</p>
         <p>For example, you will first see a category like this:</p>
         <div class="example-trial-stack">
           <div class="example-box category-display">A kind of food</div>
         </div>
         <p>and then you will see a word:</p>
         <div class="example-trial-stack">
           <div class="example-box word-display">beef</div>
         </div>
         <p>You should press <strong>"${KEY_YES}"</strong> to indicate <strong>"yes"</strong>.</p>
       </div>`,

      `<div class="instructions-block">
         ${EXAMPLE_BOX_STYLE}
         <p>You will first see a category and then a word. Your task is to decide if the word belongs to a category or not.</p>
         <p>Let's see another example.</p>
         <div class="example-trial-stack">
           <div class="example-box category-display">A part of lion's body</div>
           <div class="example-box word-display">pause</div>
         </div>
         <p>You should press <strong>"${KEY_NO}"</strong> to indicate <strong>"no"</strong>.</p>
       </div>`,
    ],
    show_clickable_nav: true,
    key_forward: "ArrowRight",
    key_backward: "ArrowLeft",
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="instructions-block">
        <p><strong>Respond as accurately and quickly as possible!</strong></p>
        <p>There is a limited time to respond. So make sure you click your answer quickly.</p>
        <p>If you do not respond within the time window, your answer will be counted as incorrect.</p>
        <p>Please place your <strong>left index finger</strong> on the <strong>"x"</strong> key and your <strong>right index finger</strong> on the <strong>"m"</strong> key for the whole experiment.</p>
        <p>You will start with some <strong>practice trials</strong>. Then you will move into the <strong>experiment</strong>. Finally, you will complete a <strong>questionnaire</strong>.</p>
        <p><strong>Remember! Press "${KEY_YES}" if the word IS a member of the category and "${KEY_NO}" if it is NOT.</strong></p>
        <p>Please let the experimenter know when you are ready to begin.</p>
      </div>`,
    data: { screen: "instructions_final" },
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="instructions-block"><h2>Practice</h2><p>During these practice trials, you will hear a sound whenever you answer incorrectly. This feedback sound will <strong>not</strong> occur during the real experiment.</p><p>Press any key to begin the practice trials.</p></div>`,
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="fixation">+</div>`,
    choices: "NO_KEYS",
    trial_duration: NEXT_TRIAL_FIXATION_MS,
    data: { screen: "next_trial_fixation", phase: "practice" },
  });

  practiceTrials.forEach((trial, i) => {
    timeline.push(...buildTrialSequence(trial, jsPsych, true, i + 1));
  });

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

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="fixation">+</div>`,
    choices: "NO_KEYS",
    trial_duration: NEXT_TRIAL_FIXATION_MS,
    data: { screen: "next_trial_fixation", phase: "test" },
  });

  mainTrials.forEach((trial, i) => {
    timeline.push(...buildTrialSequence(trial, jsPsych, false, i + 1));
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
        category: t.category,
        word: t.word,
        condition: t.condition,
        yes_key: t.yes_key,
        response: t.response,          // raw key pressed ("x" / "m")
        correct_response: t.correct_response,
        correct: t.correct,            // 1 = matched correct_response, 0 = did not
        rt: t.rt,                      // ms from target-word onset to keypress
      }));
    return Papa.unparse(rows);
  }

  const datapipeConfigured = DATAPIPE_EXPERIMENT_ID !== "REPLACE_WITH_YOUR_DATAPIPE_ID";

  if (datapipeConfigured) {
    timeline.push({
      type: jsPsychPipe,
      action: "save",
      experiment_id: DATAPIPE_EXPERIMENT_ID,
      filename: `${subjectID}.csv`,
      data_string: () => buildCleanCSV(),
    });
  } else {
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="instructions-block"><p>(DataPipe is not configured yet — saving a local copy of the data to your downloads folder instead.)</p></div>`,
      choices: "NO_KEYS",
      trial_duration: 1500,
      on_start: function () {
        const csv = buildCleanCSV();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${subjectID}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
    });
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
