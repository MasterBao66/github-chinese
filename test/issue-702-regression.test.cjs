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

const protectedReactGlobalNavSelectors = [
    'header.GlobalNav',
    '#__primerPortalRoot__',
];

const protectedReactTraversalSelectors = [
    '[class*="Search-module__"]',
    'qbsearch-input',
    '#__primerPortalRoot__',
];

const expectedReactNavLabels = {
    'locals.js': {
        labels: {
            "Overview": "概况",
            "Repositories": "仓库",
            "Code": "代码",
            "Issues": "议题",
            "Pull requests": "拉取请求",
            "Discussions": "讨论",
            "Actions": "操作",
            "Projects": "项目",
            "Wiki": "Wiki",
            "Security": "安全",
            "Security and quality": "安全和质量",
            "Insights": "洞察",
            "Settings": "设置",
            "Packages": "软件包",
            "Releases": "发行版",
            "Stars": "星标",
            "Agents": "智能体",
            "Models": "模型",
            "People": "成员",
            "Teams": "团队",
            "Sponsoring": "赞助",
            "Followers": "关注者",
            "Following": "正在关注",
            "Activity": "活动",
            "Branches": "分支",
            "Tags": "标签",
            "Codespaces": "代码空间",
            "Dashboard": "仪表板",
            "Explore": "探索",
            "Marketplace": "市场",
            "Sponsors": "赞助者",
            "Organizations": "组织",
            "Enterprises": "企业版",
            "Billing": "账单",
            "Copilot": "GitHub Copilot",
        },
    },
    'locals(greasyfork).js': {
        labels: {
            "Overview": "概况",
            "Repositories": "仓库",
            "Code": "代码",
            "Issues": "议题",
            "Pull requests": "拉取请求",
            "Discussions": "讨论",
            "Actions": "操作",
            "Projects": "项目",
            "Wiki": "Wiki",
            "Security": "安全",
            "Security and quality": "安全和质量",
            "Insights": "洞察",
            "Settings": "设置",
            "Packages": "软件包",
            "Releases": "发行版",
            "Stars": "星标",
            "Agents": "智能体",
            "Models": "模型",
            "People": "成员",
            "Teams": "团队",
            "Sponsoring": "赞助",
            "Followers": "关注者",
            "Following": "正在关注",
            "Activity": "活动",
            "Branches": "分支",
            "Tags": "标签",
            "Codespaces": "代码空间",
            "Dashboard": "仪表板",
            "Explore": "探索",
            "Marketplace": "市场",
            "Sponsors": "赞助者",
            "Organizations": "组织",
            "Enterprises": "企业版",
            "Billing": "账单",
            "Copilot": "GitHub Copilot",
        },
    },
    'locals_zh-TW.js': {
        labels: {
            "Overview": "概況",
            "Repositories": "儲存庫",
            "Code": "程式碼",
            "Issues": "議題",
            "Pull requests": "拉取請求",
            "Discussions": "討論",
            "Actions": "操作",
            "Projects": "專案",
            "Wiki": "Wiki",
            "Security": "安全",
            "Security and quality": "安全和品質",
            "Insights": "洞察",
            "Settings": "設定",
            "Packages": "軟體包",
            "Releases": "發行版",
            "Stars": "星號",
            "Agents": "智能體",
            "Models": "模型",
            "People": "成員",
            "Teams": "團隊",
            "Sponsoring": "贊助",
            "Followers": "追蹤者",
            "Following": "正在追蹤",
            "Activity": "活動",
            "Branches": "分支",
            "Tags": "標籤",
            "Codespaces": "程式碼空間",
            "Dashboard": "儀表板",
            "Explore": "探索",
            "Marketplace": "市場",
            "Sponsors": "贊助者",
            "Organizations": "組織",
            "Enterprises": "企業版",
            "Billing": "帳單",
            "Copilot": "GitHub Copilot",
        },
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
    test(`${fileName} keeps React global navigation out of generic DOM traversal`, () => {
        const config = loadConfig(fileName);
        const mutationSelectors = config.ignoreMutationSelectorPage['*'];
        const traversalSelectors = config.ignoreSelectorPage['*'];

        for (const selector of protectedReactGlobalNavSelectors) {
            assert.ok(
                mutationSelectors.includes(selector),
                `${selector} must be ignored by MutationObserver translation`,
            );
            assert.ok(
                traversalSelectors.includes(selector),
                `${selector} must be ignored during the initial DOM traversal`,
            );
        }

        for (const selector of protectedReactTraversalSelectors) {
            assert.ok(
                traversalSelectors.includes(selector),
                `${selector} must be ignored during the initial DOM traversal`,
            );
        }

        assert.equal(config.reactGlobalNavStyle, undefined);
    });

    test(`${fileName} keeps old traversal away from React GlobalNav internals`, () => {
        const config = loadConfig(fileName);

        assert.equal(
            config.reIgnoreClass.test('GlobalNav styles-module__appHeader__YzYWk'),
            true,
            'Legacy traversal should skip the React global navigation before it is hydrated',
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

for (const fileName of localeFiles) {
    test(`${fileName} translates React GlobalNav labels without CSS pseudo-elements`, () => {
        const source = fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');
        const { labels } = expectedReactNavLabels[fileName];

        assert.match(source, /function translateReactGlobalNavLabels/);
        assert.match(source, /function resolveReactGlobalNavLabel/);
        assert.match(source, /function findStaticGlobalNavLabel/);
        assert.match(source, /textContent = label/);

        for (const [sourceLabel, targetLabel] of Object.entries(labels)) {
            assert.ok(
                source.includes(`"${sourceLabel}": "${targetLabel}"`),
                `${fileName} should include ${sourceLabel} -> ${targetLabel}`,
            );
        }

        assert.doesNotMatch(source, /::after/);
        assert.doesNotMatch(source, /github-chinese-react-global-nav-style/);
    });
}
