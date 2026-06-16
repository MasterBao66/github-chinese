const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const localeFiles = [
    'locals.js',
    'locals(greasyfork).js',
    'locals_zh-TW.js',
];

const protectedReactMutationSelectors = [
    'header.GlobalNav',
    '#__primerPortalRoot__',
];

const protectedReactTraversalSelectors = [
    '[class*="Search-module__"]',
    'qbsearch-input',
    '#__primerPortalRoot__',
];

function loadConfig(fileName) {
    const filePath = path.join(__dirname, '..', fileName);
    const context = vm.createContext({});

    vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, {
        filename: filePath,
    });

    return context.I18N.conf;
}

for (const fileName of localeFiles) {
    test(`${fileName} skips React global navigation only during mutation translation`, () => {
        const config = loadConfig(fileName);
        const mutationSelectors = config.ignoreMutationSelectorPage['*'];
        const traversalSelectors = config.ignoreSelectorPage['*'];

        for (const selector of protectedReactMutationSelectors) {
            assert.ok(
                mutationSelectors.includes(selector),
                `${selector} must be ignored by MutationObserver translation`,
            );
        }

        for (const selector of protectedReactTraversalSelectors) {
            assert.ok(
                traversalSelectors.includes(selector),
                `${selector} must be ignored during the initial DOM traversal`,
            );
        }

        assert.equal(
            traversalSelectors.includes('header.GlobalNav'),
            false,
            'Initial and URL-triggered traversal should still translate stable navigation labels',
        );
    });

    test(`${fileName} keeps old traversal available for stable GlobalNav labels`, () => {
        const config = loadConfig(fileName);

        assert.equal(
            config.reIgnoreClass.test('GlobalNav styles-module__appHeader__YzYWk'),
            false,
            'Legacy traversal should not skip the whole React global navigation',
        );
        assert.equal(
            config.reIgnoreClass.test('Search-module__searchButton__aiE0a'),
            true,
            'React search button class should be ignored by the legacy traversal',
        );
        assert.ok(
            config.reIgnoreTag.includes('QBSEARCH-INPUT'),
            'Legacy traversal should skip the hidden search custom element subtree',
        );
        assert.equal(
            config.reIgnoreId.test('__primerPortalRoot__'),
            true,
            'Legacy traversal should skip Primer portal roots',
        );
    });
}

test('main(greasyfork).user.js skips GlobalNav mutation updates for the legacy script', () => {
    const script = fs.readFileSync(path.join(__dirname, '..', 'main(greasyfork).user.js'), 'utf8');

    assert.match(script, /function shouldIgnoreMutation/);
    assert.match(script, /ignoreMutationSelectorPage/);
    assert.match(script, /closest\?\.\(ignoreMutationSelectors\)/);
});
