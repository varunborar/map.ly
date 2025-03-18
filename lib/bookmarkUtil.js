/**
 * Wraps chrome.bookmarks.getTree in a promise and returns the entire bookmark tree.
 * @returns {Promise<Array>} An array of bookmark suggestions.
 */
export const getBookmarkTree = async () =>
    new Promise((resolve) => {
        chrome.bookmarks.getTree((results) => {
            resolve(results);
        });
    });

/**
 * Simplify the bookmark tree by removing unnecessary properties.
 * @param {Array} tree The bookmark tree.
 * @returns {Array} The simplified bookmark tree.
 */
export const simplifyBookmarkTree = (tree) => {
    const simplifiedTree = tree.map((node) => {
        const { title, url, children } = node;
        if (children) {
            return { title, children: simplifyBookmarkTree(children) };
        }
        return { title, url };
    });
    return simplifiedTree;
}
/**
 * Find a node in the simplified bookmark tree.
 * @param {Array} simplifiedTree The simplified bookmark tree.
 * @returns {Object} The node that matches the query.
 */
export const findNode = (simplifiedTree, nodePath) => {
    let current = simplifiedTree[0].children;
    for (let i = 0; i < nodePath.length; i++) {
        current = current.filter((folder) =>
            folder.title === nodePath[i]
        )
        current = current[0].children || [];
    }
    return current;
}