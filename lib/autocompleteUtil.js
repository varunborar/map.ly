import { getMappings, getPreferences } from "./chromeStorageUtil.js"
import { getBookmarkTree, simplifyBookmarkTree, findNode } from "./bookmarkUtil.js"

const getMappingsSuggestions = async (query) => {
    const mappings = await getMappings();
    let inputKey = query.split('/')[0];
    const inputVariables = query.split('/').slice(1);
    if (inputVariables.length > 0 && inputVariables[0] === '') {
        inputKey = inputKey + '/';
    }
    let suggestions = Object.keys(mappings)
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
    return suggestions;
}

const getBookmarkSuggestions = async (query) => {
    const preferences = await getPreferences();
    if (!preferences.suggestBookmarks) return [];
    const bookmarkShortcut = preferences.bookmarkShortcut;
    let tree = await getBookmarkTree();
    tree = simplifyBookmarkTree(tree);
    let current = [];
    if (preferences.rootBookmarkNode) {
        const nodePath = preferences.rootBookmarkNode.split('/');
        current = findNode(tree, nodePath);
    } else {
        current = tree[0].children;
    }
    let suggestions = [];
    // expecting query in format folder1/folder2/.../folderN/bookmark
    // for folders return the content as path
    // for bookmarks return `${bookmarkShortcut}${bookmarkurl}`
    const folders = query.split('/');
    let currentPath = [];

    // console.log(`current: ${JSON.stringify(current)}`);

    for (let i = 0; i < folders.length - 1; i++) {
        current = current.filter((folder) =>
            folder.title === folders[i]
        )
        current = current[0].children || [];
        currentPath.push(folders[i]);
        // console.log(`Changing current folder: ${JSON.stringify(current)}`);
    }

    for (const currentFolder of current) {
        if (currentFolder.title.includes(folders[folders.length - 1]) && !currentFolder.url) {
            suggestions.push({
                content: `${currentPath.join('/')}${currentPath.length > 0 ? '/': ''}${currentFolder.title}`,
                description: `${currentFolder.title}`
            });
        }
        else if (currentFolder.title.includes(folders[folders.length - 1]) && currentFolder.url) {
            suggestions.push({
                content: `${bookmarkShortcut}${currentFolder.url}`,
                description: `${currentFolder.title} - (${currentFolder.url})`
            });
        }
    }

    // console.log(`bookmarks: ${suggestions}`);
    return suggestions;
}

export const getSuggestions = async (query) => {
    try {
        const mappingsSuggestions = await getMappingsSuggestions(query);
        const bookmarkSuggestions = await getBookmarkSuggestions(query);
        return mappingsSuggestions.concat(bookmarkSuggestions);
    }
    catch (error) {
        console.error(error);
        return [];
    }

}