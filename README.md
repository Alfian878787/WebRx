[![Build Status](https://travis-ci.org/oliverw/WebRx.png)](https://travis-ci.org/oliverw/WebRx)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)


# WebRx

WebRx integrates concepts of [KnockoutJS](http://knockoutjs.com/) and [AngularJS](https://angularjs.org/) with [ReactiveX for Javascript (rxjs)](http://reactivex.io) (rxjs) into a MVC framework that enables developers to create responsive, structured and testable Web-Applications that run in any **modern** browser.

#### Features

- Compatible with IE9+, Firefox 5+, Chrome 5+, Safari 5+
- Comprehensive [online documentation](http://webrxjs.org/docs)
- Extensible data-binding with many built-in operators
- Supports modules for partitioning larger projects into managable units
- Supports components for organizing UI code into self-contained, reusable chunks
- Integrated state-based routing engine inspired by Angular's [UI-Router](https://github.com/angular-ui/ui-router)
- No dependencies besides RxJS-Lite
- Compact (~20Kb minified & compressed)
- First class TypeScript support

#### Installation

- Installation via NuGet
```bash
PM> Install-Package WebRx
```
- or download the [latest release as zip](http://webrxjs.org/downloads/web.rx.zip)

Make sure to include script-references to rx.lite.js and rx.lite.extras.js *before* web.rx.js when integrating WebRx into your projects.

#### Documentation

WebRx's documentation can be found on [here](http://webrxjs.org/docs)
.
#### Todo

- Replace RTTI implementation with Typescript 1.5's meta-data once it is released

### License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
