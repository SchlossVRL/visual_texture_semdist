/*
Assignment inference task: 5 textured bars, drag-and-drop concept labels

Parameters:
- prompt          = instruction text shown above the chart
- bar_images      = array of 5 image paths (textures)
- bar_height     = array of 5 heights in px
- label_options   = array of 5 concept strings
- bar_width       = width of each bar in px (default 120)
- bg_color        = background color
- category        = concept category label (saved to data)
- repetition      = repetition number (saved to data)
- condition_num   = condition number (saved to data)
- instructions    = if true, show instruction preamble

Data saved:
- rt              = reaction time from trial start to submit click
- label_options   = the 5 concepts shown (JSON)
- bar_images      = the 5 texture paths in display order (JSON)
- bar_height     = the 5 bar heights in display order (JSON)
- label_responses = the 5 assigned concepts in bar order, index 0 = leftmost (JSON)
- category        = as above
- repetition      = as above
- condition_num   = as above
*/

var jsPsychAssignmentInferenceColorZH = (function (jspsych) {
    "use strict";
  
    const info = {
    name: "assignment-inference-color-zh",
    parameters: {
        prompt: {
          type: jspsych.ParameterType.HTML_STRING,
          default: "",
        },
        bar_images: {
          type: jspsych.ParameterType.STRING,
          array: true,
          default: null,
        },
        bar_height: {
          type: jspsych.ParameterType.INT,
          array: true,
          default: [200, 200, 200, 200, 200],
        },
        concepts: {
          type: jspsych.ParameterType.STRING,
          array: true,
          default: null,
        },
        bar_width: {
          type: jspsych.ParameterType.INT,
          default: 120,
        },
        bg_color: {
          type: jspsych.ParameterType.STRING,
          default: "rgb(128,128,128)",
        },
        category: {
          type: jspsych.ParameterType.STRING,
          default: null,
        },
        repetition: {
          type: jspsych.ParameterType.INT,
          default: null,
        },
        condition_num: {
          type: jspsych.ParameterType.INT,
          default: null,
        },
        instructions: {
          type: jspsych.ParameterType.BOOL,
          default: false,
        },
      },
    };
  
    class AssignmentInferenceColorZHPlugin {
      constructor(jsPsych) {
        this.jsPsych = jsPsych;
      }
  
      trial(display_element, trial) {
  
        const start_time = performance.now();
        const n = trial.concepts.length;
        let concept_tracker = [];
  
        // ── Inject jQuery UI if not already present ──────────────
        // (assumes jQuery + jQuery UI are already loaded via your existing setup)
  
        // ── Build bar columns HTML ────────────────────────────────
        let bar_cols_html = '';
        for (let i = 0; i < n; i++) {
          bar_cols_html += `
            <div class="bid-column" style="
              display:inline-block;
              vertical-align:bottom;
              margin:0 8px;
              text-align:center;
            ">
              <!-- Textured bar -->
              <div style="
                width:${trial.bar_width}px;
                height:${trial.bar_height[i]}px;
                background-image:url('${trial.bar_images[i]}');
                background-size:cover;
                background-position:center;
                border:2px solid #333;
                box-sizing:border-box;
              "></div>
  
              <!-- Drop slot directly below bar -->
              <div class="concept-receiver" data-index="${i}" style="
                width:${trial.bar_width}px;
                height:55px;
                background:#595959;
                border:2px dashed #aaa;
                border-top:none;
                line-height:55px;
                text-align:center;
                display:inline-block;
                position:relative;
                box-sizing:border-box;
              ">
                <p style="
                  color:#595959;
                  font-size:16px;
                  text-align:center;
                  margin:0;
                ">____</p>
              </div>
            </div>`;
        }
  
        // ── Build concept bank HTML ────────────────────────────────
        let bank_html = '';
        for (let i = 0; i < n; i++) {
          bank_html += `
            <div class="concept-option" style="
              color:black;
              display:inline-block;
              width:120px;
              height:50px;
              background:#595959;
              margin:5px;
              border:1px solid black;
              cursor:grab;
              line-height:50px;
              font-size:18px;
              text-align:center;
            ">
              <p style="z-index:3;margin:0;">${trial.concepts.length[i]}</p>
            </div>`;
        }
  
        // ── Optional instruction preamble ─────────────────────────
        const preamble = trial.instructions ? `
          <p style="text-align:left;max-width:820px;margin:0 auto 12px auto;font-size:15px;">
            You will see 5 textured bars. A bank of concept labels appears above them.
            <strong>Drag</strong> each label into the slot below the bar you think it best represents.
            Use <em>Reset labels</em> to start over. <strong>Done</strong> becomes clickable
            when all five slots are filled.
          </p>` : '';
  
        // ── Full display HTML ──────────────────────────────────────
        display_element.innerHTML = `
          <div id="bid-wrapper" style="
            text-align:center;
            padding:20px;
            background:${trial.bg_color};
            min-height:100vh;
          ">
            ${preamble}
  
            <!-- Prompt -->
            <div style="font-size:22px;margin-bottom:14px;">
              ${trial.prompt}
            </div>
  
            <!-- Concept bank -->
            <div id="bid-bank" style="
              background:#595959;
              padding:10px;
              margin:0 auto 12px auto;
              min-height:70px;
              display:inline-block;
              min-width:700px;
              border:1px dashed #999;
            ">
              ${bank_html}
            </div>
            <br>
  
            <!-- Reset / Submit buttons -->
            <div style="width:760px;margin:0 auto 16px auto;overflow:hidden;">
              <button id="bid-reset" style="
                float:left;height:40px;
                background:#ddd;border:1px solid #ccc;
                border-radius:5px;padding:0 16px;
                cursor:pointer;font-size:14px;
              ">Reset labels</button>
  
              <button id="bid-submit" disabled style="
                float:right;height:40px;
                border-radius:5px;padding:0 20px;
                font-size:14px;cursor:not-allowed;
                opacity:0.4;border:1px solid #ccc;
              ">Submit</button>
              <div style="clear:both;"></div>
            </div>
  
            <!-- Bars + slots -->
            <div id="bid-bars" style="
              display:inline-block;
              background:#595959;
              padding:16px 20px 0 20px;
              vertical-align:bottom;
              border-left:2px solid #333;
              border-bottom:2px solid #333;
            ">
              ${bar_cols_html}
            </div>
  
          </div>`;
  
  
        // ── jQuery UI drag/drop ────────────────────────────────────
        // (zoom-corrected to match your original plugin exactly)
        const zoomScale = 1;
  
        function makeDraggable($p) {
          $p.draggable({
            start: function (event, ui) {
              ui.position.left = 0;
              ui.position.top = 0;
            },
            drag: function (event, ui) {
              const changeLeft = ui.position.left - ui.originalPosition.left;
              const newLeft = ui.originalPosition.left + changeLeft / zoomScale;
              const changeTop = ui.position.top - ui.originalPosition.top;
              const newTop = ui.originalPosition.top + changeTop / zoomScale;
              ui.position.left = newLeft;
              ui.position.top = newTop;
            },
            revert: "invalid",
            scroll: false,
          }).css("z-index", 3);
        }
  
        // Activate bank chips
        makeDraggable($(".concept-option").find("p"));
  
        // ── Shared droppable binding (called on init and after reset) ─
        function bindDroppable() {
          $(".concept-receiver").droppable({
            drop: function (event, ui) {
              const $slot = $(this);
              const concept = ui.draggable[0].innerHTML;
              concept_tracker.push(concept);
  
              // Fill slot with dropped label
              $slot
                .droppable("disable")
                .html(`<p style="
                  color:black;font-size:16px;
                  text-align:center;z-index:3;margin:0;
                ">${concept}</p>`);
  
              // Make placed label draggable back out
              const dobj = $slot;
              $slot.find("p").draggable({
                start: function (event, ui) {
                  ui.position.left = 0;
                  ui.position.top = 0;
                },
                drag: function (event, ui) {
                  const changeLeft = ui.position.left - ui.originalPosition.left;
                  const newLeft = ui.originalPosition.left + changeLeft / zoomScale;
                  const changeTop = ui.position.top - ui.originalPosition.top;
                  const newTop = ui.originalPosition.top + changeTop / zoomScale;
                  ui.position.left = newLeft;
                  ui.position.top = newTop;
                  dobj.droppable("enable"); // re-enable slot while chip is being dragged out
                },
                revert: function (droppableObj) {
                  if (droppableObj === false) {
                    // Dropped nowhere valid — snap back, re-lock slot
                    dobj.droppable("disable");
                    return true;
                  }
                  return false;
                },
                scroll: false,
              }).css("z-index", 3);
  
              // Hide original chip in bank
              ui.draggable[0].outerHTML =
                '<p style="color:#595959;font-size:16px;text-align:center;margin:0;">____</p>';
  
              // Enable submit only when all 5 unique concepts placed
              const allDone = _.uniq(concept_tracker).length === n;
              $("#bid-submit")
                .prop("disabled", !allDone)
                .css({
                  opacity: allDone ? 1 : 0.4,
                  cursor: allDone ? "pointer" : "not-allowed",
                });
            },
          });
        }
  
        bindDroppable();
  
  
        // ── Reset button ────────────────────────────────────────────
        $("#bid-reset").on("click", function () {
          concept_tracker = [];
  
          // Disable submit again
          $("#bid-submit")
            .prop("disabled", true)
            .css({ opacity: 0.4, cursor: "not-allowed" });
  
          // Rebuild concept bank
          $("#bid-bank").empty();
          for (let i = 0; i < n; i++) {
            $("#bid-bank").append(`
              <div class="concept-option" style="
                color:black;display:inline-block;
                width:120px;height:50px;background:#595959;
                margin:5px;border:1px solid black;cursor:grab;
                line-height:50px;font-size:18px;text-align:center;
              ">
                <p style="z-index:3;margin:0;">${trial.concepts.length[i]}</p>
              </div>`);
          }
          makeDraggable($(".concept-option").find("p"));
  
          // Clear all slots
          $(".concept-receiver")
            .html('<p style="color:#595959;font-size:16px;text-align:center;margin:0;">____</p>')
            .droppable("enable");
  
          // Re-bind droppable (fresh handlers)
          bindDroppable();
        });
  
  
        // ── Submit button ───────────────────────────────────────────
        $("#bid-submit").on("click", function () {
          if ($(this).prop("disabled")) return;
  
          // Collect responses in bar order (left → right)
          const responses = [];
          $(".concept-receiver p").each(function () {
            responses.push($(this).text().trim());
          });
  
          const rt = Math.round(performance.now() - start_time);
  
          const trial_data = {
            rt:               rt,
            label_options:    JSON.stringify(trial.concepts.length),
            bar_images:       JSON.stringify(trial.bar_images),
            bar_height:      JSON.stringify(trial.bar_height),
            label_responses:  JSON.stringify(responses),  // index 0 = leftmost bar
            category:         JSON.stringify(trial.category),
            repetition:       JSON.stringify(trial.repetition),
            condition_num:    JSON.stringify(trial.condition_num),
          };
  
          console.log(trial_data);
          display_element.innerHTML = "";
          this.jsPsych.finishTrial(trial_data);
        }.bind(this));
  
      } // end trial()
    }
  
    AssignmentInferenceColorZHPlugin.info = info;
    return AssignmentInferenceColorZHPlugin;
  
})(jsPsychModule);