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
        // Optional: store variable assignments (if needed)
        const variableAssignments = {};
        // Replace placeholders in the template.
        // This regex matches '%s' optionally followed by '{{variableName}}'
        const formattedUrl = template.replace(/%s(?:\{\{(.*?)\}\})?/g, (match, varName) => {
            const paramValue = params[i++] || '';
            if (varName) {
                variableAssignments[varName] = paramValue;
            }
            return paramValue;
        });

        // (Optional) Log the assignments
        console.log('Variable assignments:', variableAssignments);
        // Redirect the current tab to the formatted URL
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
    let inputKey = text.split('/')[0];
    const inputVariables = text.split('/').slice(1);
    if (inputVariables.length > 0 && inputVariables[0] === '') {
        inputKey = inputKey + '/';
    }
    const suggestions = Object.keys(mappings)
      .filter((key) => key.includes(inputKey) || `${key}/`.includes(inputKey))
      .map((key) => {
        const mappingTemplate = mappings[key];
        const regex = /%s(?:\{\{(.*?)\}\})?/g;
        let placeholders = [];
        let match;
        while ((match = regex.exec(mappingTemplate)) !== null) {
          // If a variable name is specified, use it; otherwise, use a default placeholder.
          if (inputVariables.length > 0 && inputVariables[0] !== '') {
            placeholders.push(inputVariables.shift());
          } else {
            placeholders.push(match[1] ? `[${match[1]}]` : `[value]`);
          }
        }
        // Construct the suggestion text: key followed by placeholders if available.
        const suggestionText = placeholders.length ? `${key}/${placeholders.join("/")}` : key;
        return {
          content: suggestionText,
          description: suggestionText
        };
      });
    console.log(suggestions);
    suggest(suggestions);
  });