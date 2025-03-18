import { getMappings, getPreferences } from './lib/chromeStorageUtil.js';
import { getSuggestions } from './lib/autocompleteUtil.js';

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

  if (preferences && preferences.bookmarkShortcut && preferences.bookmarkShortcut !== "") {
    if (key.startsWith(preferences.bookmarkShortcut)) {
      const url = input.replace(preferences.bookmarkShortcut, '');
      console.log(`Opening bookmark: ${url}`);
      chrome.tabs.update({ url });
      return;
    }
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
  let suggestions = []
  try {
    suggestions = await getSuggestions(text);
    console.log(suggestions);
  } catch (e) {
    console.error(e);
  }
  suggest(suggestions);
});