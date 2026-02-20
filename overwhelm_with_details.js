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
        return ui.notifications.warn("The 'Overwhelm with Details' action was not found on this character.");
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
        { id: "sur", name: "Survival", attr: "spi" },
    ];

    // Fetch the "Lore" modifier object to extract the total modifier once for all buttons
    const loreModObj = actor.system.skills?.lor?.mod;
    let loreMod = 0;

    if (loreModObj !== null && typeof loreModObj === 'object') {
        loreMod = loreModObj.useOverride ? (loreModObj.override ?? 0) : (loreModObj.derived ?? 0);
    } else if (typeof loreModObj === 'number') {
        loreMod = loreModObj;
    }

    // Helper to generate buttons cleanly for both V12 and V13+
    const getButtonHtml = (skill) => {
        if (foundry.utils.isNewerVersion(game.version, 13)) {
            return `<button type="button" class="name skill-btn" data-skill-id="${skill.id}" data-skill-name="${skill.name}">${skill.name} (+${loreMod})</button>`;
        } else {
            return `<button type="button" class="name skill-btn" onclick="game.actors.get('${actor.id}').rollSkill('${skill.id}', { data: { mod: ${loreMod} }, title: 'Overwhelm with Details: ${skill.name} (using Lore)' }); Array.from(foundry.applications?.instances?.values() || []).find(a => a.title === 'Overwhelm with Details')?.close(); Object.values(ui.windows).find(w => w.title === 'Overwhelm with Details')?.close();">${skill.name} (+${loreMod})</button>`;
        }
    };

    // Build the Dual-Column HTML to match Use_Skill.js exactly
    let toHtml = '<div class="flexrow" style="align-items: flex-start; margin-bottom: 5px;">';

    // Cognitive Column
    toHtml += '<div class="flexcol">';
    toHtml += `<h4 style="align-self: center">Cognitive</h4>`;
    for (const skill of skillOptions.filter(s => s.attr === "cog")) {
        toHtml += getButtonHtml(skill);
    }
    toHtml += '</div>';

    // Spiritual Column
    toHtml += '<div class="flexcol">';
    toHtml += `<h4 style="align-self: center">Spiritual</h4>`;
    for (const skill of skillOptions.filter(s => s.attr === "spi")) {
        toHtml += getButtonHtml(skill);
    }
    toHtml += '</div>';

    toHtml += '</div>';
    toHtml += '<p style="text-align: center;"><i>All skills above are using your <b>Lore</b> modifier.</i></p>';

    // Create the DialogV2 object to adopt the system's native look and feel
    let dialogObject = {
        window: { title: "Overwhelm with Details" },
        position: { width: 500 },
        content: toHtml,
        ok: { label: "Done" }
    };

    if (foundry.utils.isNewerVersion(game.version, 13)) {
        dialogObject.render = (_event, app) => {
            const html = app.element;
            html.querySelectorAll("button.skill-btn").forEach(e => {
                e.addEventListener("click", () => {
                    const sid = e.dataset.skillId;
                    const sname = e.dataset.skillName;
                    actor.rollSkill(sid, {
                        data: { mod: loreMod },
                        title: `Overwhelm with Details: ${sname} (using Lore)`
                    });
                    app.close();
                });
            });
        };
    }

    return await foundry.applications.api.DialogV2.prompt(dialogObject);

})();
