/* 
Assignment inference task: 2 bars for color as perceptual cue

Brief description of task: Participants see one concept word displayed at the top of the screen and two bars in the plot below.
They must make a keyboard response to indicate which bar they believe represents the target concept.

Parameters:
- prompt  = concept to be assigned
- left_height_range = range of heights for left bar
- right_height_range = range of heights for right bar
- left_color = color of left bar
- right_color = color of right bar
- bg_color = background color (this should be the same as the document background color)
- response_ends_trial = if true, trial ends when response is made
- correct_side = "left" or "right", for accuracy coding
- trial_duration = maximum duration of trial in ms (optional)

Data:
- rt = reaction time
- key = key pressed
- chosen_side = "left" or "right"
- correct_side = as above
- accuracy = 1 if correct, 0 if incorrect, null if correct_side is null or no response
- final_left = final height of left bar (with jitter)
- final_right = final height of right bar (with jitter)
- left_color = as above
- right_color = as above
- left_jitter = jitter applied to left bar height
- right_jitter = jitter applied to right bar height
- prompt = as above
*/
var jsPsychBarImageChoice = (function (jspsych) {
  "use strict";

  const info = {
    name: "bar-image-choice",
    parameters: {
      prompt: {
        type: jspsych.ParameterType.HTML_STRING,
        default: null,
      },
      left_image: {
        type: jspsych.ParameterType.IMAGE,
        pretty_name: "Left bar image",
        default: null,
      },
      right_image: {
        type: jspsych.ParameterType.IMAGE,
        pretty_name: "Right bar image",
        default: null,
      },
      left_height_range: {
        type: jspsych.ParameterType.INT,
        array: true,
        default: [50, 150],
      },
      right_height_range: {
        type: jspsych.ParameterType.INT,
        array: true,
        default: [50, 150],
      },
      jitter: {
        type: jspsych.ParameterType.INT,
        default: 5,
      },
      bg_color: {
        type: jspsych.ParameterType.STRING,
        default: "#ffffff",
      },
      choices: {
        type: jspsych.ParameterType.KEYS,
        default: ["f", "j"],
      },
      correct_side: {
        type: jspsych.ParameterType.STRING,
        default: null,
      },
      trial_duration: {
        type: jspsych.ParameterType.INT,
        default: null,
      },
      response_ends_trial: {
        type: jspsych.ParameterType.BOOL,
        default: true,
      },
    },
  };

  class BarImageChoicePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      // --- Randomized heights (used for vertical scaling) ---
      const left_height = this.jsPsych.randomization.randomInt(
        trial.left_height_range[0],
        trial.left_height_range[1]
      );
      const right_height = this.jsPsych.randomization.randomInt(
        trial.right_height_range[0],
        trial.right_height_range[1]
      );

      const left_jitter = Math.round((Math.random() * 2 - 1) * trial.jitter);
      const right_jitter = Math.round((Math.random() * 2 - 1) * trial.jitter);

      const final_left = left_height + left_jitter;
      const final_right = right_height + right_jitter;

      // --- HTML structure ---
      let html = `
        <div style="background:${
          trial.bg_color
        }; width:100%; height:100%; text-align:center;">
          <div style="font-size:32px; margin-bottom:20px;">
            ${trial.prompt || ""}
          </div>

          <!-- Main display area -->
          <div style="
            position:relative;
            width:500px;
            height:400px;
            margin:0 auto;
            display:flex;
            justify-content:center;
            align-items:flex-end;
            gap:100px;
            border-left:2px solid black;   /* y-axis */
            border-bottom:2px solid black; /* x-axis */
          ">
            <!-- Left image -->
<div style="
  position:relative;
  display:flex;
  justify-content:center;
  align-items:flex-end;
  height:100%;
  background:${trial.bg_color};
  overflow:hidden;
">
  <img src="${trial.left_image}"
       style="
         display:block;
         height:auto;
         max-height:100%;
         object-fit:contain;
         position:relative;
         z-index:1;
       ">
  <!-- overlay rectangle -->
  <div style="
    position:absolute;
    bottom:${final_left}px;
    height:calc(100% - ${final_left}px);
    width:100%;
    background:${trial.bg_color};
    z-index:2;
  "></div>
</div>

<!-- Right image -->
<div style="
  position:relative;
  display:flex;
  justify-content:center;
  align-items:flex-end;
  height:100%;
  background:${trial.bg_color};
  overflow:hidden;
">
  <img src="${trial.right_image}"
       style="
         display:block;
         height:auto;
         max-height:100%;
         object-fit:contain;
         position:relative;
         z-index:1;
       ">
  <!-- overlay rectangle -->
  <div style="
    position:absolute;
    bottom:${final_right}px;
    height:calc(100% - ${final_right}px);
    width:100%;
    background:${trial.bg_color};
    z-index:2;
  "></div>
</div>
        </div>
      `;

      display_element.innerHTML = html;

      // --- Response handling ---
      let response = { rt: null, key: null };

      const end_trial = () => {
        this.jsPsych.pluginAPI.clearAllTimeouts();
        if (typeof keyboardListener !== "undefined") {
          this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
        }

        let chosen_side = null;
        if (response.key !== null) {
          if (response.key === trial.choices[0]) chosen_side = "left";
          else if (response.key === trial.choices[1]) chosen_side = "right";
        }

        let accuracy = null;
        if (trial.correct_side !== null && chosen_side !== null) {
          accuracy = chosen_side === trial.correct_side ? 1 : 0;
        }

        const trial_data = {
          rt: response.rt,
          key: response.key,
          prompt: trial.prompt,
          chosen_side,
          correct_side: trial.correct_side,
          accuracy,
          final_left,
          final_right,
          left_image: trial.left_image,
          right_image: trial.right_image,
          left_jitter,
          right_jitter,
        };

        display_element.innerHTML = "";
        this.jsPsych.finishTrial(trial_data);
      };

      const after_response = (info) => {
        if (response.key === null) response = info;
        if (trial.response_ends_trial) end_trial();
      };

      // --- Keyboard listener ---
      if (trial.choices != "NO_KEYS") {
        var keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_response,
          valid_responses: trial.choices,
          rt_method: "performance",
          persist: false,
          allow_held_key: false,
        });
      }

      // --- Trial duration ---
      if (trial.trial_duration !== null) {
        this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
      }
    }
  }

  BarImageChoicePlugin.info = info;
  return BarImageChoicePlugin;
})(jsPsychModule);
