/**
 * Overwhelm with Details
 * Runs the "Overwhelm with Details" action, then prompts to roll a Cognitive or Spiritual
 * skill utilizing the "Lore" modifier instead of its normal modifier.
 */
(async () => {
    const token = canvas.tokens.controlled[0];
    const actor = token?.actor;

    if (!actor) {
        return ui.notifications.warn("Select a token first!");
    }


    // Attempt to invoke the "Overwhelm with Details" action
    const action = actor.items.find(i => i.name === "Overwhelm with Details");
    if (!action) {
        ui.notifications.warn("The 'Overwhelm with Details' action was not found on this character.");
    } else {
        // Check if actor has at least 2 focus
        const focus = actor.system.resources?.focus?.value ?? actor.system.resources?.foc?.value ?? 0;
        if (focus < 2) {
            return ui.notifications.warn("You do not have enough Focus to use Overwhelm with Details! (Requires 2)");
        }
        await action.use({ actor });
    }

    // List of Cognitive and Spiritual skills
    const skillOptions = [
        { id: "cra", name: "Crafting", attr: "cog" },
        { id: "ded", name: "Deduction", attr: "cog" },
        { id: "dis", name: "Discipline", attr: "cog" },
        { id: "inm", name: "Intimidation", attr: "cog" },
        { id: "med", name: "Medicine", attr: "cog" },
        { id: "dec", name: "Deception", attr: "spi" },
        { id: "ins", name: "Insight", attr: "spi" },
        { id: "lea", name: "Leadership", attr: "spi" },
        { id: "prc", name: "Percetpion", attr: "spi" },
        { id: "prs", name: "Persuasion", attr: "spi" },
        { id: "sur", name: "Survival", attr: "cog" },
    ];

    // Build the dropdown HTML
    let optionsHtml = "";
    for (const skill of skillOptions) {
        optionsHtml += `<option value="${skill.id}">${skill.name}</option>`;
    }

    // Dialog to select the skill
    new Dialog({
        title: "Overwhelm with Details",
        content: `
            <form>
                <div class="form-group">
                    <label>Select a Cognitive or Spiritual Skill to roll:</label>
                    <div style="padding-bottom: 10px;">
                        <select id="skill-choice" name="skill-choice">
                            ${optionsHtml}
                        </select>
                    </div>
                    <p><i>Note: The roll will use your <b>Lore</b> modifier.</i></p>
                </div>
            </form>
        `,
        buttons: {
            roll: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Roll",
                callback: async (html) => {
                    const selectedSkillId = html.find("#skill-choice").val();
                    const selectedSkillName = skillOptions.find(s => s.id === selectedSkillId).name;

                    // Fetch the "Lore" modifier object to extract the total modifier.
                    const loreModObj = actor.system.skills?.lor?.mod;
                    let loreMod = 0;

                    if (loreModObj !== null && typeof loreModObj === 'object') {
                        loreMod = loreModObj.useOverride ? (loreModObj.override ?? 0) : (loreModObj.derived ?? 0);
                    } else if (typeof loreModObj === 'number') {
                        loreMod = loreModObj;
                    }
                    console.log(`Overwhelm with Details - Lore Modifier: ${loreMod}`);

                    // The Cosmere system natively supports passing an options object to rollSkill.
                    // Because they use foundry.utils.mergeObject(baseData, options), we can 
                    // inject our own `data.mod` to forcefully overwrite the skill's regular modifier!
                    actor.rollSkill(selectedSkillId, {
                        data: {
                            mod: loreMod
                        },
                        // Give it a special flavor text so everyone knows it was Overwhelm
                        title: `Overwhelm with Details: ${selectedSkillName} (using Lore)`
                    });
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "roll"
    }).render(true);

})();
