/**
 * This script will log the selected actor's entire data object to the console.
 * You can then expand the object in the console (F12) to see all available attributes.
 */
const actor = canvas.tokens.controlled[0]?.actor;

if (!actor) {
    ui.notifications.warn("Select a token first!");
} else {
    console.log("-----------------------------------------");
    console.log(`Inspecting Actor: ${actor.name}`);
    console.log("Actor Object:", actor);
    console.log("Actor System Data (attributes/resources):", actor.system);
    console.log("-----------------------------------------");

    ui.notifications.info(`Logged data for ${actor.name} to the console (F12).`);
}
