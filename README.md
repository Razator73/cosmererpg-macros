# Cosmere RPG Macros

This repository contains a collection of personal macros for use with the [Cosmere RPG](https://www.brotherwisegames.com/the-stormlight-archive-rpg) system on Foundry VTT.

## Macros

### Breathe Stormlight (`breathe_stormlight.js`)
Automates the process of breathing in Stormlight for a character.
- Checks the actor's current Investiture level.
- Finds "Diamond Mark" spheres in the actor's inventory.
- Drains the necessary number of spheres to fill the Investiture track.
- Converts depleted spheres into "Diamond Mark (Dun)" items.
- Posts a chat message summarizing the action.

### Inspect Actor (`inspect_actor.js`)
A utility script for development and debugging.
- Logs the selected token's actor object and system data to the browser console (F12).
- Useful for finding attribute paths and resource names.

### Set Investiture (`set_investiture.js`)
A helper macro for testing or GM adjustments.
- Opens a dialog box to manually set the Investiture value for the selected actor.

## Usage
1. Open the `.js` file for the macro you want to use.
2. Copy the entire content of the file.
3. In Foundry VTT, create a new Macro (Type: Script).
4. Paste the code into the macro editor.
5. Save and run the macro with a token selected.
