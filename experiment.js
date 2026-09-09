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

// Plays the preloaded feedback buzz immediately, from inside the keypress
// handler, so there is no audible gap between the wrong key and the sound.
function playFeedbackBuzz(jsPsych, buffer) {
  try {
    const ctx = jsPsych.pluginAPI.audioContext();
    if (ctx && buffer && typeof AudioBuffer !== "undefined" && buffer instanceof AudioBuffer) {
      if (ctx.state === "suspended") ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start();
    } else if (buffer && typeof buffer.play === "function") {
      buffer.currentTime = 0;
      buffer.play();
    }
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

      // Grab the already-preloaded buzz buffer now so a wrong-answer sound can
      // be fired synchronously from the keypress handler during practice.
      let buzzBuffer = null;
      if (isPractice) {
        jsPsych.pluginAPI
          .getAudioBuffer(FEEDBACK_AUDIO)
          .then((buf) => { buzzBuffer = buf; })
          .catch(() => {});
      }

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
            playFeedbackBuzz(jsPsych, buzzBuffer);
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
    const prefillYes = (urlParams.get("yes_key") || "").trim().toLowerCase();
    const prefillDemo = /^(1|true|yes)$/i.test((urlParams.get("demo") || "").trim());

    const overlay = document.createElement("div");
    overlay.id = "param-overlay";
    overlay.innerHTML = `
      <form class="param-box" autocomplete="off">
        <h2>Experiment setup</h2>
        <label>Subject code
          <input type="text" name="subjCode" required>
        </label>
        <label>Response mapping
          <select name="yesKey">
            <option value="auto">Auto (counterbalance by subject number)</option>
            <option value="x">x = YES / m = NO</option>
            <option value="m">m = YES / x = NO</option>
          </select>
        </label>
        <label class="param-check">
          <input type="checkbox" name="demo">
          Demo mode (short ${DEMO_TRIAL_COUNT}-trial run)
        </label>
        <div class="param-error"></div>
        <button type="submit">Start</button>
      </form>
    `;
    document.body.appendChild(overlay);

    const form = overlay.querySelector("form");
    const errorEl = overlay.querySelector(".param-error");
    form.subjCode.value = prefillSubj;
    if (prefillYes === "x" || prefillYes === "m") form.yesKey.value = prefillYes;
    form.demo.checked = prefillDemo;
    form.subjCode.focus();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const subjCode = form.subjCode.value.trim();
      if (!subjCode) {
        errorEl.textContent = "Please enter a subject code.";
        form.subjCode.focus();
        return;
      }
      overlay.remove();
      resolve({
        subjectID: subjCode,
        yesKey: form.yesKey.value, // "auto" | "x" | "m"
        demoMode: form.demo.checked,
      });
    });
  });
}

async function runExperiment() {
  const urlParams = new URLSearchParams(window.location.search);
  const { subjectID, yesKey, demoMode } = await promptForParameters(urlParams);

  if (demoMode) {
    const banner = document.createElement("div");
    banner.textContent = `DEMO MODE — ${DEMO_TRIAL_COUNT}-trial run`;
    banner.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:9999;background:#b30000;color:#fff;" +
      "font:14px/1.4 Arial,Helvetica,sans-serif;text-align:center;padding:4px 8px;";
    document.body.appendChild(banner);
  }

  const seed = hashStringToSeed(subjectID);
  const rng = mulberry32(seed);

  let useMappingA;
  if (yesKey === "x" || yesKey === "m") {
    useMappingA = yesKey === "x";
  } else {
    // "auto": counterbalance by the trailing number in the subject code.
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
  let mainTrials = seededInterleaveByCategory(mainRaw, rng, MIN_CATEGORY_GAP);

  if (demoMode) {
    // A random subset of the main trials, kept category-spaced.
    const demoSubset = new Set(
      seededShuffle(mainRaw, rng).slice(0, DEMO_TRIAL_COUNT)
    );
    mainTrials = mainTrials.filter((t) => demoSubset.has(t));
  }

  const timeline = [];

  timeline.push({
    type: jsPsychPreload,
    images: [],
    audio: [FEEDBACK_AUDIO],
    video: [],
  });

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
        <p><strong>Stage 1: Practice phase</strong> so you can get used to doing the task. You will wear the headphones for this phase, and if you answer incorrectly you will hear a small buzz. If you are hearing lots of buzzes, slow down just a little.</p>
        <p><strong>Stage 2: Experimental phase.</strong> You will not hear any more buzzes during this phase, but focus on answering as accurately and quickly as you can.</p>
        <p><strong>Stage 3: Questionnaires.</strong> The final phase will take you to some questionnaires. Take your time and answer thoughtfully.</p>
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
