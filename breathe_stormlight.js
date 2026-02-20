(async () => {
    const token = canvas.tokens.controlled[0];
    const actor = token?.actor;

    if (!actor) {
        return ui.notifications.warn("Select a token first!");
    }

    // Check for the "Breathe Stormlight" action first
    const action = actor.items.find(i => i.name === "Breathe Stormlight");
    if (!action) {
        return ui.notifications.warn("The 'Breathe Stormlight' action was not found on this character.");
    }

    // Check for infused spheres on selected token
    // For now, only look for "Diamond Mark" spheres
    const sphereName = "Diamond Mark";
    const sphereValue = 1;

    // Find the specific sphere type on the actor
    const sphereItem = actor.items.find(i => i.type === "loot" && i.system.price.currency === "spheres" && i.name === sphereName);

    if (!sphereItem || sphereItem.system.quantity < 1) {
        return ui.notifications.warn(`No infused ${sphereName}s found on this actor!`);
    }

    // Get Current Investiture from actor
    const investiture = actor.system.resources?.inv;

    if (!investiture) {
        return ui.notifications.error("Could not find Investiture resource on actor!");
    }

    const currentInvestiture = investiture.value || 0;
    const maxInvestiture = investiture.max.override || 0;
    const needed = maxInvestiture - currentInvestiture;

    if (needed <= 0) {
        return ui.notifications.info("Investiture is already full!");
    }

    // Calculate how many spheres to drain
    const available = sphereItem.system.quantity;
    const toDrain = Math.min(needed, available);

    const moduleId = "cosmere-advanced-encounters";
    const isModuleActive = game.modules.get(moduleId)?.active;
    const combatant = game.combat?.combatants.find(c => c.actorId === token.actor.id);
    if (isModuleActive && combatant) {
        const flags = combatant.flags["cosmere-advanced-encounters"];
        const actionGroup = flags.actionsAvailableGroups[0];
        if (actionGroup.remaining < 2) {
            return ui.notifications.warn("You don't have enough actions to breathe stormlight!");
        }
    }

    // Invoke the action
    await action.use({ actor: actor });

    // Consume the spheres
    await sphereItem.update({ "system.quantity": available - toDrain });

    // Add "Dun" version
    // Check if Dun version exists
    const dunName = `${sphereName} (Dun)`;
    let dunSphere = actor.items.find(i => i.type === "loot" && i.system.price.currency === "dun" && i.name === dunName);

    if (!dunSphere) {
        // Create it if it doesn't exist
        const sphereData = sphereItem.toObject();
        sphereData.name = dunName;
        sphereData.system.price.currency = "dun";
        sphereData.system.quantity = 0;
        // Should use createEmbeddedDocuments for reliable creation
        const created = await actor.createEmbeddedDocuments("Item", [sphereData]);
        dunSphere = created[0]; // Get the created item document
    }

    // Update Dun quantity
    await dunSphere.update({ "system.quantity": dunSphere.system.quantity + toDrain });

    // Manually override investiture if there were not enough to fill it
    if (needed > available) {
        await actor.update({ "system.resources.inv.value": currentInvestiture + available });
    }

    // --- Update Token Image ---
    const currentImg = token.document.texture.src;
    if (currentImg && !currentImg.includes(".radiating.")) {
        const extIndex = currentImg.lastIndexOf(".");
        if (extIndex !== -1) {
            const baseImg = currentImg.substring(0, extIndex);
            const ext = currentImg.substring(extIndex);
            const investedTokenImage = `${baseImg}.radiating${ext}`;

            try {
                // Check if the radiating variant exists
                const response = await fetch(investedTokenImage, { method: "HEAD" });
                if (response.ok) {
                    await token.document.update({ "texture.src": investedTokenImage });
                }
            } catch (err) {
                // Image doesn't exist or network error, skip updating
                console.error(err);
            }
        }
    }

    // Prepare chat message
    let chatNote = `Breathed in Stormlight from:`;
    chatNote += `<p>${toDrain} ${sphereItem.name}`;
    if (toDrain > 1) { chatNote += "s"; }
    chatNote += `</p>`;

    ChatMessage.create({
        content: chatNote,
        speaker: ChatMessage.getSpeaker({ actor }),
        user: game.user.id,
    });

})();
