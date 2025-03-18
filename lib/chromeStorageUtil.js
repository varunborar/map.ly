// lib/chromeStorageUtil.js

/**
 * Retrieves the stored URL mappings from local storage.
 * @returns {Promise<Object>} A promise that resolves with the mappings object.
 */
export const getMappings = async () =>
  new Promise((resolve) => {
    chrome.storage.local.get(['urlMappings'], (result) => {
      resolve(result.urlMappings || {});
    });
  });

/**
 * Updates the stored URL mappings in local storage.
 * @param {Object} newMappings - The new mappings object.
 * @returns {Promise<void>} A promise that resolves once the mappings are updated.
 */
export const updateMappings = async (newMappings) =>
  new Promise((resolve) => {
    chrome.storage.local.set({ urlMappings: newMappings }, () => {
      resolve();
    });
  });

/**
 * Adds a new mapping or updates an existing mapping in local storage.
 * @param {string} key - The mapping key.
 * @param {string} template - The URL template.
 * @returns {Promise<void>} A promise that resolves once the mapping is added/updated.
 */
export const addOrUpdateMapping = async (key, template) => {
  const mappings = await getMappings();
  mappings[key] = template;
  await updateMappings(mappings);
};

/**
 * Deletes a mapping by key from local storage.
 * @param {string} key - The mapping key to delete.
 * @returns {Promise<void>} A promise that resolves once the mapping is deleted.
 */
export const deleteMapping = async (key) => {
  const mappings = await getMappings();
  if (mappings[key]) {
    delete mappings[key];
    await updateMappings(mappings);
  }
};

/**
 * Retrieves the stored preferences from local storage.
 * @returns {Promise<Object>} A promise that resolves with the preferences object.
 */
export const getPreferences = async () =>
  new Promise((resolve) => {
    chrome.storage.local.get(['preferences'], (result) => {
      resolve(result.preferences || {});
    });
  });

/**
 * Updates the stored preferences in local storage.
 * @param {Object} preferences - The new preferences object.
 * @returns {Promise<void>} A promise that resolves once the preferences are updated.
 */
export const updatePreferences = async (preferences) =>
  new Promise((resolve) => {
    chrome.storage.local.set({ preferences }, () => {
      resolve();
    });
  });
