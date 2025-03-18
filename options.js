import { getMappings, updateMappings, addOrUpdateMapping, deleteMapping, getPreferences, updatePreferences } from './lib/chromeStorageUtil.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadMappings();
    await loadPreferences();

    document.getElementById('exportBtn').addEventListener('click', exportMappings);
    document.getElementById('importBtn').addEventListener('click', () =>
        document.getElementById('importFile').click()
    );
    document.getElementById('importFile').addEventListener('change', importMappings);
    document.getElementById('saveAllDataBtn').addEventListener('click', saveAllData);

    const mappingForm = document.getElementById('mappingForm');
    mappingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const keyInput = document.getElementById('key');
        const templateInput = document.getElementById('template');
        const key = keyInput.value.trim();
        const template = templateInput.value.trim();
        if (!key || !template) return;
        await addOrUpdateMapping(key, template);
        await loadMappings();
        keyInput.value = '';
        templateInput.value = '';
    });

    const preferencesForm = document.getElementById('preferencesForm');
    const suggestBookmarksCheckbox = document.getElementById('suggestBookmarks');
    suggestBookmarksCheckbox.addEventListener('change', (e) => {
        const bookmarkShortcutRow = document.getElementById('bookmarkShortcutRow');
        const rootBookmarkNodeRow = document.getElementById('rootBookmarkNodeRow');
        if (e.target.checked) {
            bookmarkShortcutRow.classList.remove('hidden');
            rootBookmarkNodeRow.classList.remove('hidden');
        } else {
            bookmarkShortcutRow.classList.add('hidden');
            rootBookmarkNodeRow.classList.add('hidden');
        }
    });
    preferencesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const customShortcutInput = document.getElementById('customShortcut');
        const suggestBookmarksCheckbox = document.getElementById('suggestBookmarks');
        const bookmarkShortcutInput = document.getElementById('bookmarkShortcut');
        const customShortcut = customShortcutInput.value.trim();
        const suggestBookmarks = suggestBookmarksCheckbox.checked;
        let bookmarkShortcut = bookmarkShortcutInput.value.trim();
        let rootBookmarkNode = document.getElementById('rootBookmarkNode').value.trim();

        if (suggestBookmarks && !bookmarkShortcut) {
            bookmarkShortcutInput.value = 'bm:';
            bookmarkShortcut = 'bm:';
        }
        // Save preferences including the custom shortcut and bookmark suggestion toggle.
        await updatePreferences({ customShortcut, suggestBookmarks, bookmarkShortcut, rootBookmarkNode });
        alert('Preferences saved.');
    });
});

const loadMappings = async () => {
    const mappings = await getMappings();
    const tbody = document.getElementById('mappingsTable');
    tbody.innerHTML = '';
    for (const key in mappings) {
        const tr = document.createElement('tr');
        const keyTd = document.createElement('td');
        keyTd.textContent = key;
        const templateTd = document.createElement('td');
        templateTd.textContent = mappings[key];
        const actionsTd = document.createElement('td');
        actionsTd.className = 'actions';
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', async () => {
            await deleteMapping(key);
            await loadMappings();
        });
        actionsTd.appendChild(deleteBtn);
        tr.appendChild(keyTd);
        tr.appendChild(templateTd);
        tr.appendChild(actionsTd);
        tbody.appendChild(tr);
    }
};

const exportMappings = async () => {
    const mappings = await getMappings();
    const dataStr = JSON.stringify(mappings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'mappings.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
};

const importMappings = async (event) => {
    const fileInput = event.target;
    if (fileInput.files.length === 0) {
        alert('Please select a JSON file to import.');
        return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
        let importedData;
        try {
            importedData = JSON.parse(e.target.result);
        } catch (error) {
            alert('Error parsing JSON file. Please ensure it is valid JSON.');
            return;
        }
        if (typeof importedData !== 'object' || importedData === null) {
            alert('Imported data is not a valid mapping object.');
            return;
        }
        const currentMappings = await getMappings();
        const updatedMappings = { ...currentMappings, ...importedData };
        await updateMappings(updatedMappings);
        await loadMappings();
        fileInput.value = '';
        alert('Mappings imported and updated successfully.');
    };
    reader.readAsText(file);
};

const saveAllData = async () => {
    const mappings = await getMappings();
    const preferences = await getPreferences();
    const data = { mappings, preferences };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'data.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

const loadPreferences = async () => {
    const preferences = await getPreferences();
    const customShortcutInput = document.getElementById('customShortcut');
    const suggestBookmarksCheckbox = document.getElementById('suggestBookmarks');
    const bookmarkShortcutInput = document.getElementById('bookmarkShortcut');
    const rootBookmarkNodeInput = document.getElementById('rootBookmarkNode');
    const rootBookmarkNodeRow = document.getElementById('rootBookmarkNodeRow');
    if (preferences.customShortcut) {
        customShortcutInput.value = preferences.customShortcut;
    }
    if (preferences.suggestBookmarks !== undefined) {
        suggestBookmarksCheckbox.checked = preferences.suggestBookmarks;
    } else {
        const bookmarkShortcutRow = document.getElementById('bookmarkShortcutRow');
        bookmarkShortcutRow.classList.add('hidden');
        rootBookmarkNodeRow.classList.add('hidden');
    }
    if (preferences.bookmarkShortcut) {
        bookmarkShortcutInput.value = preferences.bookmarkShortcut;
    }
    if (preferences.rootBookmarkNode) {
        rootBookmarkNodeInput.value = preferences.rootBookmarkNode;
    }
};
