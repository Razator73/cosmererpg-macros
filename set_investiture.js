/**
 * This script will set the selected actor's Investiture to a specific value.
 * Helpful for testing or resetting state.
 */
(async () => {
    const actor = canvas.tokens.controlled[0]?.actor;

    if (!actor) {
        return ui.notifications.warn("Select a token first!");
    }

    // Define the value you want to set here, or prompt for it
    // For now, I'll prompt with a Dialog
    const currentVal = actor.system.resources?.inv?.value || 0;
    const maxVal = actor.system.resources?.inv?.max?.override || 0;

    new Dialog({
        title: "Set Investiture",
        content: `
        <form>
            <div class="form-group">
                <label>Investiture Value (Max: ${maxVal})</label>
                <input type="number" name="value" value="${currentVal}" autofocus>
            </div>
        </form>
        `,
        buttons: {
            update: {
                label: "Update",
                callback: async (html) => {
                    const newValue = Number(html.find('[name="value"]').val());
                    await actor.update({ "system.resources.inv.value": newValue });
                    ui.notifications.info(`Updated Investiture to ${newValue}.`);
                }
            }
        },
        default: "update"
    }).render(true);

})();
