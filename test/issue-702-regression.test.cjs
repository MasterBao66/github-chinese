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

const protectedReactSearchSelectors = [
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
    test(`${fileName} protects only the React search boundary from translation`, () => {
        const config = loadConfig(fileName);
        const mutationSelectors = config.ignoreMutationSelectorPage['*'];
        const traversalSelectors = config.ignoreSelectorPage['*'];

        for (const selector of protectedReactSearchSelectors) {
            assert.ok(
                mutationSelectors.includes(selector),
                `${selector} must be ignored by MutationObserver translation`,
            );
            assert.ok(
                traversalSelectors.includes(selector),
                `${selector} must be ignored during the initial DOM traversal`,
            );
        }

        assert.ok(
            !mutationSelectors.includes('header.GlobalNav'),
            'React global navigation should not be ignored wholesale by MutationObserver translation',
        );
        assert.ok(
            !traversalSelectors.includes('header.GlobalNav'),
            'React global navigation should not be ignored wholesale during initial DOM traversal',
        );
    });

    test(`${fileName} keeps old traversal ignores scoped to search widgets`, () => {
        const config = loadConfig(fileName);

        assert.equal(
            config.reIgnoreClass.test('GlobalNav styles-module__appHeader__YzYWk'),
            false,
            'React global navigation class should remain translatable',
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
