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

const protectedReactSelectors = [
    'header.GlobalNav',
    '#__primerPortalRoot__',
];

const expectedNavLabels = {
    'locals.js': {
        code: '代码',
        pullRequests: '拉取请求',
    },
    'locals(greasyfork).js': {
        code: '代码',
        pullRequests: '拉取请求',
    },
    'locals_zh-TW.js': {
        code: '程式碼',
        pullRequests: '拉取請求',
    },
};

function loadConfig(fileName) {
    const filePath = path.join(__dirname, '..', fileName);
    const context = vm.createContext({});

    vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, {
        filename: filePath,
    });

    return context.I18N.conf;
}

for (const fileName of localeFiles) {
    test(`${fileName} protects React global navigation from DOM translation`, () => {
        const config = loadConfig(fileName);
        const mutationSelectors = config.ignoreMutationSelectorPage['*'];
        const traversalSelectors = config.ignoreSelectorPage['*'];

        for (const selector of protectedReactSelectors) {
            assert.ok(
                mutationSelectors.includes(selector),
                `${selector} must be ignored by MutationObserver translation`,
            );
            assert.ok(
                traversalSelectors.includes(selector),
                `${selector} must be ignored during the initial DOM traversal`,
            );
        }
    });

    test(`${fileName} keeps old traversal ignores scoped to React navigation widgets`, () => {
        const config = loadConfig(fileName);

        assert.equal(
            config.reIgnoreClass.test('GlobalNav styles-module__appHeader__YzYWk'),
            true,
            'React global navigation class should be skipped by the legacy traversal',
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

    test(`${fileName} renders React global navigation labels without changing DOM text`, () => {
        const config = loadConfig(fileName);
        const labels = expectedNavLabels[fileName];

        assert.match(config.reactGlobalNavStyle, /header\.GlobalNav/);
        assert.match(config.reactGlobalNavStyle, /\[data-component="text"\]\[data-content="Code"\]/);
        assert.match(config.reactGlobalNavStyle, /\[data-component="text"\]\[data-content="Pull requests"\]/);
        assert.ok(
            config.reactGlobalNavStyle.includes(`content: "${labels.code}"`),
            'CSS overlay should translate the Code tab label',
        );
        assert.ok(
            config.reactGlobalNavStyle.includes(`content: "${labels.pullRequests}"`),
            'CSS overlay should translate the Pull requests tab label',
        );
    });
}
