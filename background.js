import { getMappings, getPreferences } from './lib/chromeStorageUtil.js';

chrome.omnibox.onInputEntered.addListener(async (input) => {
    // Split input on "/" assuming format: key/var1/var2/...
    const segments = input.split('/');
    if (segments.length < 1) {
        console.error("No key provided.");
        return;
    }

    // Use lowercase to ensure consistency (e.g., "Options" or "options")
    const key = segments[0].toLowerCase().trim();

    // If the user types "options", open the options page

    const preferences = await getPreferences();
    if (preferences && preferences.customShortcut && preferences.customShortcut !== "") {
        if (key === preferences.customShortcut) {
            chrome.runtime.openOptionsPage();
            return;
        }
    } else if (key === "options") {
        chrome.runtime.openOptionsPage();
        return;
    }

    const params = segments.slice(1);

    // Retrieve the mapping object from chrome storage using our helper function
    const mappings = await getMappings();
    const template = mappings[key];

    if (template) {
        let i = 0;
        const formattedUrl = template.replace(/%s/g, () => params[i++] || '');
        chrome.tabs.update({ url: formattedUrl });
    } else {
        console.error(`No mapping found for key: ${key}`);
    }
});

chrome.omnibox.setDefaultSuggestion({
    description: 'mp [key] - Open a mapped URL'
});

chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
    const mappings = await getMappings();
    const suggestions = Object.keys(mappings).filter((key) => key.includes(text)).map((key) => (
        {
            content: key,
            description: ``
        }
    ));
    console.log(suggestions);
    suggest(suggestions);
});