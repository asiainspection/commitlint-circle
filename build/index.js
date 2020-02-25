"use strict";
var _this = this;
exports.__esModule = true;
var tslib_1 = require("tslib");
var rest_1 = tslib_1.__importDefault(require("@octokit/rest"));
var execa_1 = tslib_1.__importDefault(require("execa"));
var NotFound = new Error();
var git = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return execa_1["default"].stdout('git', args);
};
var checkCommit = function () {
    var refs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        refs[_i] = arguments[_i];
    }
    return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, Promise.all(refs.map(function (ref) {
                    return git('cat-file', '-e', ref);
                }))];
        });
    });
};
var matchGithub = function (url, prop) {
    if (!url) {
        throw NotFound;
    }
    var match = url.match(new RegExp("github\\.com/(.+)/(.+)/" + prop + "/(.+)"));
    if (!match) {
        throw NotFound;
    }
    var _ = match[0], owner = match[1], repo = match[2], data = match[3];
    return { owner: owner, repo: repo, data: data };
};
var getRangeFromPr = function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var _a, owner, repo, pull, github, _b, base, head;
    return tslib_1.__generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = matchGithub(process.env['CIRCLE_PULL_REQUEST'], 'pull'), owner = _a.owner, repo = _a.repo, pull = _a.data;
                github = new rest_1["default"]();
                github.authenticate({ type: 'token', token: process.env.GITHUB_TOKEN || '' });
                console.log('📡   Looking up PR #%s...', pull);
                return [4 /*yield*/, github.pullRequests.get({ owner: owner, repo: repo, number: +pull })];
            case 1:
                _b = (_c.sent()).data, base = _b.base, head = _b.head;
                return [4 /*yield*/, checkCommit(base.sha, head.sha)];
            case 2:
                _c.sent();
                console.log('🔀   Linting PR #%s', pull);
                return [2 /*return*/, [base.sha, head.sha]];
        }
    });
}); };
var getRangeFromCompare = function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var _a, from, to;
    return tslib_1.__generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = matchGithub(process.env['CIRCLE_COMPARE_URL'], 'compare').data.split('...'), from = _a[0], to = _a[1];
                return [4 /*yield*/, checkCommit(from, to)];
            case 1:
                _b.sent();
                console.log('🎏   Linting using comparison URL %s...%s', from, to);
                return [2 /*return*/, [from, to]];
        }
    });
}); };
var getRangeFromSha = function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var sha;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                sha = process.env['CIRCLE_SHA1'];
                if (!sha) {
                    throw new Error('Cannot find CIRCLE_SHA1 environment variable');
                }
                return [4 /*yield*/, checkCommit(sha)];
            case 1:
                _a.sent();
                console.log('⚙️   Linting using CIRCLE_SHA1 (%s)', sha);
                return [2 /*return*/, ['origin/master', sha]];
        }
    });
}); };
var getRangeFromGit = function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var head;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, git('rev-parse', '--verify', 'HEAD')];
            case 1:
                head = _a.sent();
                return [4 /*yield*/, checkCommit(head)];
            case 2:
                _a.sent();
                console.log('⚙️   Linting using git HEAD (%s)', head);
                return [2 /*return*/, ['origin/master', head]];
        }
    });
}); };
var lint = function (_a) {
    var from = _a[0], to = _a[1];
    return execa_1["default"]('node', [require('@commitlint/cli'), '--from', from, '--to', to], { stdio: 'inherit' });
};
exports.run = function () {
    return getRangeFromPr()["catch"](getRangeFromCompare)["catch"](getRangeFromSha)["catch"](getRangeFromGit)
        .then(lint);
};
//# sourceMappingURL=index.js.map