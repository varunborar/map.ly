chrome.omnibox.onInputEntered.addListener((input) => {
    // Split input on "/" assuming format: key/var1/var2/...
    const segments = input.split('/');
    if (segments.length < 1) {
        console.error("No key provided.");
        return;
    }

    // Use lowercase to ensure consistency (e.g., "Options" or "options")
    const key = segments[0].toLowerCase().trim();

    // If the user types "options", open the options page
    if (key === "options") {
        chrome.runtime.openOptionsPage();
        return;
    }

    const params = segments.slice(1);

    // Retrieve the mapping object from chrome storage
    chrome.storage.sync.get(["urlMappings"], (result) => {
        const mappings = result.urlMappings || {};
        const template = mappings[key];

        if (template) {
            // Replace each '%s' placeholder with the corresponding parameter
            let i = 0;
            const formattedUrl = template.replace(/%s/g, () => params[i++] || '');

            // Redirect the current tab to the formatted URL
            chrome.tabs.update({ url: formattedUrl });
        } else {
            console.error(`No mapping found for key: ${key}`);
        }
    });
});

chrome.omnibox.setDefaultSuggestion({
    description: 'mp [key]/[var]/[var]... - Open a mapped URL'
});

