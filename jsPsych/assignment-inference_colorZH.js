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
- rt              = reaction time from trial start to submit click (NO)
- label_options   = the 5 concepts shown (JSON) (YES)
- bar_images      = the 5 texture paths in display order (JSON) (YES)
- bar_height     = the 5 bar heights in display order (JSON) (YES)
- label_responses = the 5 assigned concepts in bar order, index 0 = leftmost (JSON) (YES)
- category        = as above
- repetition      = as above
- condition_num   = as above
*/

var jsPsychAssignmentInferenceColorZH = (function (jspsych) {
    "use strict";

    // -- Plugin info block --
    //defines all parameters that can be passed to the experiment file.
    const info = {
        name: "assignment-inference-color-zh",
        parameters: {

            //text shown above the bar chart
            prompt: {
                type: jspsych.ParameterType.HTML_STRING,
                default: "",
            },

            //array of image paths I had to do complex for updated JsPsych
            bar_images: {
                type: jspsych.ParameterType.COMPLEX,
                array: true,
                default: undefined,
            },

            //array of concept to assign (they are strings)
            concepts: {
                type: jspsych.ParameterType.COMPLEX,
                array: true,
                default: undefined,
            },

            //width of each bar in pixels
            bar_width: {
                type: jspsych.ParameterType.INT,
                default: 80,
            },

            //background color of the whole trial screen
            bg_color: {
                type: jspsych.ParameterType.STRING,
                default: "rgb(128,128,128)",
            },

            //show or don't show instruction preamble
            instructions: {
                type: jspsych.ParameterType.BOOL,
                default: false,
            },

        },
    };


    // -- Plugin class --
    class AssignmentInferenceColorZHPlugin {

        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {

            // -- Trial setup --

            const start_time = performance.now();

            //mumber of bars/concepts (should be 5 for now)
            const n = trial.concepts.length;

            //bar heights: shuffle [200,225,250,275,300] then apply + or - 5px jitter
            const bar_heights = [200, 225, 250, 275, 300]
                .sort(() => Math.random() - 0.5)
                .map(h => h + Math.floor(Math.random() * 11) - 5);

            //tracks which concepts have been placed in slots (used for submit)
            let concept_tracker = [];

            //zoom scale for drag position correction (1 = no zoom)
            const zoomScale = 1;


            // -- Build bar columns HTML --
            //each column is a texture iage on the x-axis
            let bar_cols_html = '';
            for (let i = 0; i < n; i++) {
                bar_cols_html += `
                    <div class="bid-column" style="
                        display:inline-block;
                        vertical-align:bottom;
                        margin:0 8px;
                        text-align:center;
                    ">
                        <div style="
                            width:${trial.bar_width}px;
                            height:${bar_heights[i]}px;
                            background-image:url('${trial.bar_images[i]}');
                            background-size:cover;
                            background-position:center;
                            border:2px solid #333;
                            box-sizing:border-box;
                        "></div>
                    </div>`;
            }


            // -- Build concept bank HTML --
            //vertical stack of concept labels that Pp drags
            let bank_html = '';
            for (let i = 0; i < n; i++) {
                bank_html += `
                    <div class="concept-option" style="
                        color:black;
                        display:block;
                        width:120px;
                        height:50px;
                        background:#808080;
                        margin:5px auto;
                        border:1px solid black;
                        cursor:grab;
                        line-height:50px;
                        font-size:18px;
                        text-align:center;
                    ">
                        <p style="z-index:3;margin:0;">${trial.concepts[i]}</p>
                    </div>`;
            }


            // -- Build drop slots HTML --
            //one slot per bar, placement is below x axis
            const slots_html = Array.from({length: n}, (_, i) => `
                <div style="
                    display:inline-block;
                    margin:0 8px;
                    text-align:center;
                ">
                    <div class="concept-receiver" data-index="${i}" style="
                        width:${trial.bar_width}px;
                        height:55px;
                        background:#808080;
                        border:2px dashed #aaa;
                        line-height:55px;
                        text-align:center;
                        display:inline-block;
                        position:relative;
                        box-sizing:border-box;
                    ">
                        <p style="
                            color:#808080;
                            font-size:16px;
                            text-align:center;
                            margin:0;
                        ">____</p>
                    </div>
                </div>`
            ).join('');


            // -- Assemble full trial display --
            display_element.innerHTML = `
                <div id="bid-wrapper" style="
                    text-align:center;
                    padding:20px;
                    background:${trial.bg_color};
                    min-height:100vh;
                ">

                    <!-- prompt text -->
                    <div style="font-size:22px; margin-bottom:14px;">
                        ${trial.prompt}
                    </div>

                    <!-- concept bank -->
                    <div id="bid-bank" style="
                        background:#808080;
                        padding:10px;
                        margin:0 auto 12px auto;
                        min-height:70px;
                        display:inline-block;
                        width:140px;
                        border:1px dashed #999;
                        vertical-align:top;
                    ">
                        ${bank_html}
                    </div>
                    <br>

                    <!-- reset and submit buttons -->
                    <div style="width:760px; margin:0 auto 16px auto; overflow:hidden;">

                        <button id="bid-reset" style="
                            float:left; height:40px;
                            background:#ddd; border:1px solid #ccc;
                            border-radius:5px; padding:0 16px;
                            cursor:pointer; font-size:14px;
                        ">Reset labels</button>

                        <!-- submit is disabled until all slots are filled -->
                        <button id="bid-submit" disabled style="
                            float:right; height:40px;
                            border-radius:5px; padding:0 20px;
                            font-size:14px; cursor:not-allowed;
                            opacity:0.4; border:1px solid #ccc;
                        ">Submit</button>

                        <div style="clear:both;"></div>
                    </div>

                    <!-- bar chart and drop slots, wrapped together so they stay aligned -->
                    <div style="display:inline-block; text-align:center;">

                        <!-- bars on x axis (left border = y axis) -->
                        <div id="bid-bars" style="
                            display:inline-flex;
                            align-items:flex-end;
                            background:#808080;
                            padding:16px 20px 0 20px;
                            border-left:2px solid #333;
                            border-bottom:2px solid #333;
                        ">
                            ${bar_cols_html}
                        </div>

                        <!-- drop slots below the x axis -->
                        <div id="bid-slots" style="
                            display:flex;
                            justify-content:center;
                            margin-top:16px;
                            padding:0 20px;
                        ">
                            ${slots_html}
                        </div>

                    </div>

                </div>`;


            // -- drag helper function --
            //makes a jQuery element draggable with zoom-corrected positioning.
            //revert:"invalid" means the chip snaps back if dropped outside a slot.
            function makeDraggable($p) {
                $p.draggable({
                    start: function (event, ui) {
                        ui.position.left = 0;
                        ui.position.top  = 0;
                    },
                    drag: function (event, ui) {
                        const changeLeft = ui.position.left - ui.originalPosition.left;
                        const newLeft    = ui.originalPosition.left + changeLeft / zoomScale;
                        const changeTop  = ui.position.top  - ui.originalPosition.top;
                        const newTop     = ui.originalPosition.top  + changeTop  / zoomScale;
                        ui.position.left = newLeft;
                        ui.position.top  = newTop;
                    },
                    revert: "invalid",
                    scroll: false,
                }).css("z-index", 3);
            }

            //activate all concepts in the concept bank (would probably do it here if I need only 1 to activate)
            makeDraggable($(".concept-option").find("p"));


            // -- droppable binding function --
            //called on init and after reset to rebind drop handlers on all slots.
            function bindDroppable() {
                $(".concept-receiver").droppable({
                    drop: function (event, ui) {
                        const $slot  = $(this);
                        const concept = ui.draggable[0].innerHTML;

                        //track this placement
                        concept_tracker.push(concept);

                        //fill the slot with the dropped concept label
                        $slot
                            .droppable("disable") //prevent double-drops
                            .html(`<p style="
                                color:black; font-size:16px;
                                text-align:center; z-index:3; margin:0;
                            ">${concept}</p>`);

                        //make the placed label draggable back out of the slot
                        const dobj = $slot;
                        $slot.find("p").draggable({
                            start: function (event, ui) {
                                ui.position.left = 0;
                                ui.position.top  = 0;
                            },
                            drag: function (event, ui) {
                                const changeLeft = ui.position.left - ui.originalPosition.left;
                                const newLeft    = ui.originalPosition.left + changeLeft / zoomScale;
                                const changeTop  = ui.position.top  - ui.originalPosition.top;
                                const newTop     = ui.originalPosition.top  + changeTop  / zoomScale;
                                ui.position.left = newLeft;
                                ui.position.top  = newTop;
                                //re-enable the slot so it can accept a new drop
                                dobj.droppable("enable");
                            },
                            revert: function (droppableObj) {
                                if (droppableObj === false) {
                                    //dropped nowhere valid — snap back and re-lock in slot
                                    dobj.droppable("disable");
                                    return true;
                                }
                                return false;
                            },
                            scroll: false,
                        }).css("z-index", 3);

                        //remove the original concept from the bank
                        ui.draggable[0].outerHTML =
                            '<p style="color:#808080;font-size:16px;text-align:center;margin:0;">____</p>';

                        //enable submit button only when all of the concepts are placed
                        const allDone = _.uniq(concept_tracker).length === n;
                        $("#bid-submit")
                            .prop("disabled", !allDone)
                            .css({
                                opacity: allDone ? 1 : 0.4,
                                cursor:  allDone ? "pointer" : "not-allowed",
                            });
                    },
                });
            }

            //initial droppable binding
            bindDroppable();


            // -- Reset button --
            //clears all slots and rebuilds the concept bank from scratch
            $("#bid-reset").on("click", function () {

                //reset concept number tracker and disable submit
                concept_tracker = [];
                $("#bid-submit")
                    .prop("disabled", true)
                    .css({ opacity: 0.4, cursor: "not-allowed" });

                //rebuild concept bank with all original labels
                $("#bid-bank").empty();
                for (let i = 0; i < n; i++) {
                    $("#bid-bank").append(`
                        <div class="concept-option" style="
                            color:black; display:block;
                            width:120px; height:50px; background:#808080;
                            margin:5px auto; border:1px solid black; cursor:grab;
                            line-height:50px; font-size:18px; text-align:center;
                        ">
                            <p style="z-index:3;margin:0;">${trial.concepts[i]}</p>
                        </div>`);
                }
                makeDraggable($(".concept-option").find("p"));

                //clear all slot contents and re-enable dropping
                $(".concept-receiver")
                    .html('<p style="color:#808080;font-size:16px;text-align:center;margin:0;">____</p>')
                    .droppable("enable");

                //rebind droppable handlers
                bindDroppable();
            });


            // -- Submit button --
            //collects responses in left-to-right bar order and ends the trial
            $("#bid-submit").on("click", function () {
                if ($(this).prop("disabled")) return;

                //collect concept label from each slot in order (index 0 = leftmost bar)
                const responses = [];
                $(".concept-receiver p").each(function () {
                    responses.push($(this).text().trim());
                });

                const rt = Math.round(performance.now() - start_time);

                //save trial data to jsPsych
                const trial_data = {
                    rt:              rt,
                    label_options:   JSON.stringify(trial.concepts),   // concepts shown
                    bar_images:      JSON.stringify(trial.bar_images),  // textures shown
                    bar_heights:     JSON.stringify(bar_heights),       // heights used (after jitter)
                    label_responses: JSON.stringify(responses),         // participant's assignments
                };

                console.log("Trial data saved:", trial_data);
                display_element.innerHTML = "";
                this.jsPsych.finishTrial(trial_data);

            }.bind(this));

        } //end trial()

    } //end class


    AssignmentInferenceColorZHPlugin.info = info;
    return AssignmentInferenceColorZHPlugin;

})(jsPsychModule);