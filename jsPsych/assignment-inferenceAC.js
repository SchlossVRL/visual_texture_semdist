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
var jsPsychBarChoice = (function (jspsych) {
  "use strict";

  const info = {
    name: "bar-choice",
    parameters: {
      prompt: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: "Prompt",
        default: null,
      },
      left_height_range: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Left bar height range",
        array: true,
        default: [50, 150],
      },
      right_height_range: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Right bar height range",
        array: true,
        default: [50, 150],
      },
      jitter: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Height jitter",
        default: 5,
      },
      left_color: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Left bar color",
        default: "#3498db",
      },
      right_color: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Right bar color",
        default: "#e74c3c",
      },
      bg_color: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Background color",
        default: "#ffffff",
      },
      choices: {
        type: jspsych.ParameterType.KEYS,
        pretty_name: "Choices",
        default: ["f", "j"],
      },
      correct_side: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Correct side (left/right)",
        default: null,
      },
      trial_duration: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Trial duration",
        default: null,
      },
      response_ends_trial: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Response ends trial",
        default: true,
      },
    },
  };

  class BarChoicePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      // --- Heights with jitter ---
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

      // --- HTML ---
      let new_html = `
        <div style="background:${
          trial.bg_color
        }; width:100%; height:100%; text-align:center;">
          <div style="font-size:32px; margin-bottom:20px;">${
            trial.prompt || ""
          }</div>

          <!-- Container with axes -->
          <div style="
            position:relative;
            width:400px; 
            height:400px; 
            margin:0 auto; 
            display:flex; 
            justify-content:center; 
            align-items:flex-end; 
            gap:100px;
            border-left:2px solid black;   /* y-axis */
            border-bottom:2px solid black; /* x-axis */
          ">
            <!-- Left bar -->
            <div style="position:relative; width:100px; height:100%; background:${
              trial.bg_color
            };">
              <div style="
                position:absolute; 
                bottom:0; 
                width:100%; 
                height:${final_left}px; 
                background:${trial.left_color};
              "></div>
            </div>

            <!-- Right bar -->
            <div style="position:relative; width:100px; height:100%; background:${
              trial.bg_color
            };">
              <div style="
                position:absolute; 
                bottom:0; 
                width:100%; 
                height:${final_right}px; 
                background:${trial.right_color};
              "></div>
            </div>
          </div>
        </div>
      `;

      display_element.innerHTML = new_html;

      // --- Response storage ---
      let response = {
        rt: null,
        key: null,
      };

      // --- End trial function ---
      const end_trial = () => {
        this.jsPsych.pluginAPI.clearAllTimeouts();
        if (typeof keyboardListener !== "undefined") {
          this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
        }

        // Map key → side
        let chosen_side = null;
        if (response.key !== null) {
          if (response.key === trial.choices[0]) chosen_side = "left";
          else if (response.key === trial.choices[1]) chosen_side = "right";
        }

        // Accuracy
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
          left_color: trial.left_color,
          right_color: trial.right_color,
          left_jitter,
          right_jitter,
          prompt: trial.prompt,
        };

        display_element.innerHTML = "";
        this.jsPsych.finishTrial(trial_data);
      };

      // --- Handle response ---
      const after_response = (info) => {
        if (response.key === null) {
          response = info;
        }
        if (trial.response_ends_trial) {
          end_trial();
        }
      };

      // --- Start listener ---
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

  BarChoicePlugin.info = info;
  return BarChoicePlugin;
})(jsPsychModule);
