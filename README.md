[![Build Status](https://ci.appveyor.com/api/projects/status/hm6sojygo41lbiln?svg=true)](https://ci.appveyor.com/project/webrxjs/webrx)
[![Bower version](https://img.shields.io/bower/v/WebRx.svg)](https://github.com/WebRxJS/WebRx)
[![NPM version](https://img.shields.io/npm/v/webrx.svg)](https://www.npmjs.com/package/webrx)
[![NuGet version](https://img.shields.io/nuget/v/WebRx.svg)](https://www.nuget.org/packages/WebRx/)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

# <img src="http://webrxjs.org/images/Logo.png" height="32" /> WebRx

WebRx is a Client-Side MVVM-Framework that combines functional-reactive programming with declarative Data-Binding, Templating and Client-Side Routing.

The framework is written in [Typescript](http://www.typescriptlang.org/) and built on top of [ReactiveX for Javascript (RxJs)](http://reactivex.io) which is a powerful set of libraries for processing and querying asynchronous data-streams that can originate from diverse sources such as Http-Requests, Input-Events, Timers and much more.

#### Features

- Tested with IE9+, Firefox 5+, Chrome 5+, Safari 5+, Android Browser 4.0+, iOS Safari 5.0+
- [Documentation](http://webrxjs.org/docs)
- Developed in [TypeScript](http://www.typescriptlang.org/) (just like Angular 2.0)
- Declarative One-way and Two-way data-binding with many built-in operators
- Supports self-contained, reusable *Components* modelled after the upcoming Web-Components standard
- Out-of-the box support for *Modules* to facilitate code-reuse and separation of concerns
- Integrated state-based routing engine inspired by Angular's [UI-Router](https://github.com/angular-ui/ui-router)
- No dependencies besides [RxJS](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/libraries/rx.complete.md)
- Compact (~25Kb minified & compressed)

#### Installation

- NuGet Installation
```bash
PM> Install-Package WebRx
```
- Bower Installation
```bash
bower install WebRx
```
- NPM Installation
```bash
npm install webrx
```
- or download the [latest release as zip](http://webrxjs.org/downloads/web.rx.zip)

Make sure to include script-references to rx.all.js **before** web.rx.js when integrating WebRx into your projects.

#### Documentation

WebRx's documentation can be found on [here](http://webrxjs.org/docs).

#### Support 

Post your questions to [Stackoverflow](https://stackoverflow.com/questions/tagged/webrx) tagged with <code>webrx</code>.

#### Contributing

There are many ways to [contribute](https://github.com/oliverw/WebRx/blob/master/CONTRIBUTING.md) to WebRx.

* [Submit bugs](https://github.com/oliverw/WebRx/issues) and help us verify fixes as they are checked in.
* Review the [source code changes](https://github.com/oliverw/WebRx/pulls).
* Engage with other WebRx users and developers on [StackOverflow](http://stackoverflow.com/questions/tagged/webrx). 
* Join the [#webrx](http://twitter.com/#!/search/realtime/%23webrx) discussion on Twitter.
* [Contribute bug fixes](https://github.com/oliverw/WebRx/blob/master/CONTRIBUTING.md).
* Cast your vote at [AlternativeTo](http://alternativeto.net/software/webrx/)


### License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
