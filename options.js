document.addEventListener('DOMContentLoaded', () => {
    loadMappings();
    document.getElementById('exportBtn').addEventListener('click', exportMappings);
    document.getElementById('importBtn').addEventListener('click', () => {
        // Trigger the hidden file input when the import button is clicked.
        document.getElementById('importFile').click();
    });
    // When a file is chosen, process the import.
    document.getElementById('importFile').addEventListener('change', importMappings);
});

const mappingForm = document.getElementById('mappingForm');
mappingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const keyInput = document.getElementById('key');
    const templateInput = document.getElementById('template');

    const key = keyInput.value.trim();
    const template = templateInput.value.trim();

    if (!key || !template) {
        return;
    }

    // Retrieve current mappings, add/update the mapping, then save them
    chrome.storage.sync.get(['urlMappings'], function (result) {
        const mappings = result.urlMappings || {};
        mappings[key] = template;
        chrome.storage.sync.set({ urlMappings: mappings }, function () {
            loadMappings();
            keyInput.value = '';
            templateInput.value = '';
        });
    });
});

function loadMappings() {
    chrome.storage.sync.get(['urlMappings'], function (result) {
        const mappings = result.urlMappings || {};
        const tbody = document.getElementById('mappingsTable');
        tbody.innerHTML = '';

        for (let key in mappings) {
            const tr = document.createElement('tr');

            const keyTd = document.createElement('td');
            keyTd.textContent = key;

            const templateTd = document.createElement('td');
            templateTd.textContent = mappings[key];

            const actionsTd = document.createElement('td');
            actionsTd.className = 'actions';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', function () {
                deleteMapping(key);
            });
            actionsTd.appendChild(deleteBtn);

            tr.appendChild(keyTd);
            tr.appendChild(templateTd);
            tr.appendChild(actionsTd);
            tbody.appendChild(tr);
        }
    });
}

function deleteMapping(key) {
    chrome.storage.sync.get(['urlMappings'], function (result) {
        const mappings = result.urlMappings || {};
        if (mappings[key]) {
            delete mappings[key];
            chrome.storage.sync.set({ urlMappings: mappings }, loadMappings);
        }
    });
}

function exportMappings() {
    chrome.storage.sync.get(['urlMappings'], function (result) {
        const mappings = result.urlMappings || {};
        const dataStr = JSON.stringify(mappings, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = "mappings.json";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    });
}

function importMappings(event) {
    const fileInput = event.target;
    if (fileInput.files.length === 0) {
        alert("Please select a JSON file to import.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        let importedData;
        try {
            importedData = JSON.parse(e.target.result);
        } catch (error) {
            alert("Error parsing JSON file. Please ensure it is valid JSON.");
            return;
        }

        // Validate that importedData is an object
        if (typeof importedData !== 'object' || importedData === null) {
            alert('Imported data is not a valid mapping object.');
            return;
        }

        // Merge the imported mappings into the current mappings
        chrome.storage.sync.get(['urlMappings'], function (result) {
            const currentMappings = result.urlMappings || {};
            const updatedMappings = { ...currentMappings, ...importedData };
            chrome.storage.sync.set({ urlMappings: updatedMappings }, function () {
                loadMappings();
                fileInput.value = '';
                alert('Mappings imported and updated successfully.');
            });
        });
    };

    reader.readAsText(file);
}
