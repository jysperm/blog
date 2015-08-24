---
title: Coffee Script 单元测试与覆盖率报告
permalink: 1909
tags:
  - Node.js
date: 2014-10-19
---

在调研了几个库之后，我选用了 coffee-coverage 和 mocha 这个两个库。

    "devDependencies": {
      "mocha": "^1.21.5",
      "chai": "^1.9.2",
      "coffee-coverage": "^0.4.2"
    }

在 `test/support/env.coffee` 引入 coffee-coverage:

    if process.env.COV_TEST == 'true'
      require('coffee-coverage').register
        path: 'relative'
        basePath: "#{__dirname}/../.."
        exclude: ['test', 'node_modules', '.git', 'sample', 'static']
        initAll: true

coffee-coverage 的文档上写的 exlude 示例是 `exclude: ['/test', '/node_modules', '/.git']`, 但我在被坑了一个半小时之后才发现前面不能加斜杠.....  
我发了个 [Pull Request](https://github.com/benbria/coffee-coverage/pull/21), 目前还没被处理。

在 `test/app.coffee` 里写第一个测试，

    describe 'app', ->
      it 'should can startup', ->
        # 在我的机器上启动需要差不多 15 秒时间.....
        @timeout 20000
        require '../../app'

mocha 默认的测试报告只会显示测试的通过情况，不会显示测试覆盖率，因此我们要拓展一下 mocha 默认的测试报告，在 `test/support/reporter-cov-summary.js`,

    var fs = require('fs');
    var util = require ('util');
    var Spec = require('mocha/lib/reporters/spec');

    exports = module.exports = CovSummary;

    function CovSummary(runner) {
      Spec.call(this, runner);
      runner.on('end', report);
    }

    function report() {
      var cov = global._$jscoverage || {};
      var files = Object.keys(cov);

      var covered_lines = 0;
      var total_lines = 0;

      files.forEach(function(file) {
        cov[file].forEach(function(line) {
          if(line !== undefined) {
            total_lines ++;

            if (line !== 0) {
              covered_lines ++;
            }
          }
        });
      });

      var covered = (covered_lines / total_lines * 100).toFixed(1);
      console.log(util.format('Coverage Summary: %s lines of %s lines, %s% covered \n', covered_lines, total_lines, covered));
    }

    CovSummary.prototype.__proto__ = Spec.prototype;

这个文件是用 JavaScript 写的，我实在没搞清楚 mocha 怎么直接用 Coffee 的测试报告；它会在测试运行结束后输出一个覆盖率概要，类似于：

> Coverage Summary: 305 lines of 2056 lines, 14.8% covered

在 `package.json` 中加上 scripts:

    "scripts": {
      "start": "./node_modules/.bin/coffee app.coffee",
      "test": "COV_TEST=true ./node_modules/.bin/mocha --compilers coffee:coffee-script/register --require test/support/env --reporter test/support/reporter-cov-summary.js -- test",
      "test-only": "./node_modules/.bin/mocha --compilers coffee:coffee-script/register --require test/support/env -- test",
      "test-cov-html": "COV_TEST=true ./node_modules/.bin/mocha --compilers coffee:coffee-script/register --require test/support/env --reporter html-cov -- test > coverage-reporter.html"
    },

`start` 是启动应用，`test` 是运行测试和覆盖率报告，`test-only` 只运行测试，`test-cov-html` 会生成 HTML 格式的测试覆盖率报告。

然后还要改一下 `.gitinore`, 加上 `/coverage-reporter.html`.

最后是 `.travis.yaml`,

    language: node_js

    node_js:
      - "0.10"

差不多就是这样。
