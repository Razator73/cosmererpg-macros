(async () => {
    const actor = canvas.tokens.controlled[0]?.actor;

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

    // Use the action first to ensure it's not blocked or cancelled
    // Since action.use() returns null regardless, we'll listen for the chat message creation to confirm success.
    // We create a promise to wait for the hook because action.use might be async but not return the result we want.
    // However, if we await action.use(), and it blocks until dialog close, the hook should have fired by then.

    let actionSuccess = false;
    const hookId = Hooks.once("createChatMessage", (doc) => {
        // Check if the message is from our actor.
        if (doc.speaker.actor === actor.id) {
            actionSuccess = true;
        }
    });

    // Invoke the action
    await action.use({ actor: actor });

    // If the hook didn't fire (e.g. cancelled dialog), unregister it and return
    // We assume that if action.use returned, the dialog is closed.
    if (!actionSuccess) {
        Hooks.off("createChatMessage", hookId);
        return;
    }

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
