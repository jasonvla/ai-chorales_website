// Timeline building functions for the experiment

// Build welcome screen
function buildWelcomeScreen() {  
  return {  
    type: jsPsychHtmlButtonResponse,  
    choices: ['Start'],  
    stimulus: `<h1>Der musikalische Turing-Test</h1>  
        <img src="ai-composer.png" style="height:400px">  
        <p>Klicke auf <strong>Start</strong>, um zu beginnen.</p>`  
  };  
}

// Build participant info surveys
function buildParticipantSurveys() {
  const surveys = [];

  // Age survey
  surveys.push({
    type: jsPsychSurveyText,
    questions: [
      {prompt: "Wie alt bist du?", name: "age", required: true}
    ],
    button_label: "Weiter"
  });

  // Musical experience
  surveys.push(createLikertSurvey(
    "Wie würdest du deine musikalische Erfahrung einschätzen?",
    "musical_experience"
  ));

  // Instrument, choir, AI usage
  surveys.push({
    type: jsPsychSurveyLikert,
    questions: [
      {prompt: "Spielst du ein Instrument?", labels: likertLabels["plays_instrument"], name: "plays_instrument", required: true},
      {prompt: "Singst du im Chor?", labels: likertLabels["sings_in_choir"], name: "sings_in_choir", required: true},
      {prompt: "Nutzt du KI mehrmals pro Woche?", labels: likertLabels["uses_ai_weekly"], name: "uses_ai_weekly", required: true}
    ],
    button_label: "Weiter"
  });

  // Confidence before
  surveys.push(createLikertSurvey(
    "Wie sicher bist du, dass du KI-Musik von echter Musik unterscheiden kannst?",
    "confidence_before"
  ));

  return surveys;
}

// Build instructions screen
function buildInstructions() {  
  return {  
    type: jsPsychHtmlButtonResponse,  
    choices: ['Weiter'],  
    stimulus: `  
      <h2>Willkommen bei unserem Experiment!</h2>
      <p>Für Handynutzer*innen: Stummschaltung am Gehäuse aufheben, sonst erklingt nichts!</p>  
      <p>Du wirst kurze Musikschnipsel mit Cembaloklang hören.</p>  
      <p>Deine Aufgabe: Entscheide, wer es komponiert hat.</p>  
      <p>Klicke auf <strong>Mensch</strong>, wenn du glaubst, es ist ein echtes Werk.<br>
      Klicke auf <strong>KI</strong>, wenn du glaubst, es wurde generiert.</p>  
      <p>Antworte möglichst spontan.</p>  
      <hr>  
      <p>Zuerst kommt ein kurzer Test zum Kennenlernen.</p>`,  
    post_trial_gap: 500  
  };  
}

// Build training phase
function buildTrainingPhase(training_trials) {
  const timeline = [];

  const training_feedback = {
    type: jsPsychHtmlButtonResponse, // Geändert von Keyboard zu Button
    choices: ['Weiter'],
    stimulus: function() {
      const last_trial = jsPsych.data.get().last(1).values()[0];
      // Wir prüfen hier auf 'm'/'x', da wir die Antwort in on_finish mappen (siehe unten)
      const isCorrect = last_trial.response === last_trial.correct;
      return getTrainingFeedbackHtml(isCorrect);
    },
    post_trial_gap: 500
  };

  training_trials.forEach(trial_info => {
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: `
        <h2>Testphase</h2>
        <div style="margin-bottom: 20px;">
          <button id="playButton" style="
            padding: 10px 20px;
            font-size: 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 20px;
          ">▶ Audio abspielen</button>
          <audio id="audioElement" style="display: none;">
            <source src="${trial_info.file}" type="audio/mp3">
            Dein Browser unterstützt das Audio-Element nicht.
          </audio>
        </div>
        <p>Wer hat das komponiert?</p>
      `,
      choices: ["Mensch", "KI"],
      on_load: function() {
        const playButton = document.getElementById('playButton');
        const audioElement = document.getElementById('audioElement');
        
        playButton.addEventListener('click', function() {
          audioElement.play();
          playButton.style.backgroundColor = '#888';
          playButton.style.cursor = 'default';
          }, {once: true});
      },
      data: { stimulus: trial_info.file, correct: trial_info.label, training: true, timestamp: timestamp },
      on_finish: function(data) {
        // WICHTIG: Button-Index (0, 1) in 'm' oder 'x' umwandeln für Statistik
        data.response = (data.response === 0) ? 'm' : 'x';
        data.stimulus = trial_info.file;
        normalizeResponse(data);
      }
    });
    timeline.push(training_feedback);
  });

  return timeline;
}

// Build audio trials
function buildAudioTrials(shuffled_files) {
  const timeline = [];

  for (let i = 0; i < shuffled_files.length; i++) {
    let trial_info = shuffled_files[i];
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: `
        <div style="margin-bottom: 20px;">
          <button id="playButton" style="
            padding: 10px 20px;
            font-size: 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 20px;
          ">▶ Audio abspielen</button>
          <audio id="audioElement" style="display: none;">
            <source src="${trial_info.file}" type="audio/mp3">
            Dein Browser unterstützt das Audio-Element nicht.
          </audio>
        </div>
        <p>Wer hat das komponiert?</p>
        <p>🧑‍🦰 ❔ 💻</p>
        <p style="margin-top:10px; font-weight:bold;">Versuch ${i+1} von ${shuffled_files.length}</p>
      `,
      choices: ["Mensch", "KI"],
      on_load: function() {
        const playButton = document.getElementById('playButton');
        const audioElement = document.getElementById('audioElement');
        
        playButton.addEventListener('click', function() {
          audioElement.play();
          playButton.style.backgroundColor = '#888';
          playButton.style.cursor = 'default';
        }, {once: true});
      },
      data: function() {
        return {
          stimulus: trial_info.file,
          correct: trial_info.label,
          timestamp: timestamp,
          training: false
        };
      },
      on_finish: function(data) {
        // Index wieder zu Label mappen
        data.response = (data.response === 0) ? 'm' : 'x';
        data.stimulus = trial_info.file;
        normalizeResponse(data);
      },
      post_trial_gap: 500
    });
  }

  return timeline;
}
// Build feedback surveys
function buildFeedbackSurveys() {
  const surveys = [];

  // Free text feedback
  surveys.push({
    type: jsPsychSurveyText,
    questions: [{
      prompt: `<h2>Bevor wir zum Ergebnis kommen...</h2>
        <p>Wie fandest du die Aufgabe? Hast du Feedback für uns?</p>`,
      placeholder: "Deine Antwort…",
      rows: 5,
      columns: 80,
      required: true,
      name: "free_feedback"
    }],
    button_label: "Weiter"
  });

  // Difficulty
  surveys.push(createLikertSurvey(
    "Wie schwer fandest du das Experiment?",
    "difficulty"
  ));

  // Confidence after
  surveys.push(createLikertSurvey(
    "Wie sicher bist du, dass du KI-Musik von echter Musik unterscheiden kannst?",
    "confidence_after"
  ));

  return surveys;
}

// Build final screen
function buildFinalScreen() {
  return {
    type: jsPsychHtmlKeyboardResponse,
    choices: "NO_KEYS",
    stimulus: function() {
      const trials = jsPsych.data.get()
        .filter({ trial_type: 'html-button-response', training: false })
        .values();
      return getResultsHtml(trials);
    },
    on_load: function() {
      const allData = jsPsych.data.get().values();
      const participant_data = extractParticipantData(allData);
      const audioTrials = allData.filter(t =>
        t.trial_type === 'html-button-response' && t.training === false
      );

      const csv = generateCSV(audioTrials, participant_data);
      // downloadCSV(csv, `results_${participant_id}.csv`);
      sendToGoogleAppsScript(csv, `results_${participant_id}.csv`);
    }
  };
}

// Main function to build the complete timeline
function buildTimeline(shuffled_files, training_trials) {
  const timeline = [];

  timeline.push(buildWelcomeScreen());
  timeline.push(...buildParticipantSurveys());
  timeline.push(buildInstructions());
  timeline.push(...buildTrainingPhase(training_trials));
  timeline.push(...buildAudioTrials(shuffled_files));
  timeline.push(...buildFeedbackSurveys());
  timeline.push(buildFinalScreen());

  return timeline;
}
