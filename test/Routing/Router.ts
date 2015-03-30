﻿/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../typings/l2o.d.ts" />
/// <reference path="../typings/ix.d.ts" />

describe('Routing',() => {
    beforeEach(() => {
        wx.router.reset();
        wx.app.history.reset();
    });

    afterEach(() => {
        wx.cleanNode(document.body);
    });

    describe('Router',() => {
        it('throws on attempt to register invalid state-path',() => {
            expect(()=> wx.router.state({
                name: "fo$o"
            })).toThrowError(/invalid state-path/);
        });

        it('inferes route from state-name if not specified',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.go("foo");
            expect(wx.router.current().uri).toEqual("/foo");

            wx.router.reset();

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar");
            expect(wx.router.current().uri).toEqual("/foo/bar");
        });

        it('child states can override views of parent',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo");
            expect(wx.router.current().views['main']).toEqual("foo");

            wx.router.go("foo.bar");
            expect(wx.router.current().views['main']).toEqual("bar");
        });

        it('child states can override current.uri',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                route: "/baz/:id",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { id: 5 });
            expect(wx.router.current().uri).toEqual("/baz/5");
        });

        it('current.uri reflects state-hierarchy',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo");
            expect(wx.router.current().uri).toEqual("/foo");

            wx.router.go("foo.bar");
            expect(wx.router.current().uri).toEqual("/foo/bar");

            wx.router.reset();

            wx.router.state({
                name: "foo",
                route: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 });
            expect(wx.router.current().uri).toEqual("/foo/3/bar/5");
        });

        it('go() with history = true pushes a history record',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            var fireCount = 0;
            wx.app.history.onPushState.subscribe(x => {
                fireCount++;
            });

            wx.router.go("foo", {}, { location: true });
            expect(wx.router.current().uri).toEqual("/foo");
            expect(fireCount).toEqual(1);
        });

        it('activating current state again only notifies if forced',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            var fireCount = 0;
            wx.app.history.onPushState.subscribe(x => {
                fireCount++;
            });

            wx.router.go("foo", {}, { location: true });
            expect(fireCount).toEqual(1);

            wx.router.go("foo", {}, { location: true });
            expect(fireCount).toEqual(1);

            wx.router.go("foo", {}, { location: true, force: true });
            expect(fireCount).toEqual(2);
        });

        it('transitions to the the correct state on history.popstate event',() => {
            wx.router.state({
                name: "foo",
                route: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.current().name).toEqual("foo.bar");
            expect(wx.app.history.length).toEqual(1);

            wx.router.go("foo", { fooId: 3 }, { location: true });
            expect(wx.router.current().name).toEqual("foo");
            expect(wx.app.history.length).toEqual(2);

            wx.app.history.back();
            expect(wx.router.current().name).toEqual("foo.bar");
            expect(wx.app.history.length).toEqual(2);

            wx.app.history.forward();
            expect(wx.router.current().name).toEqual("foo");
            expect(wx.app.history.length).toEqual(2);
        });

        it('correctly maps parent path if parent is registered',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.current().name).toEqual("foo.bar");

            // now go "up"
            wx.router.go("^");
            expect(wx.router.current().name).toEqual("foo");
        });

        it('correctly maps parent path to root if parent is _not_ registered',() => {
            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.current().name).toEqual("foo.bar");

            // now go "up"
            wx.router.go("^");
            expect(wx.router.current().name).toEqual("$");
        });

        it('correctly maps sibling-path if both sibling and parent are registered',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.state({
                name: "foo.baz",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.current().name).toEqual("foo.bar");

            // now go "up"
            wx.router.go("^.baz");
            expect(wx.router.current().name).toEqual("foo.baz");
        });

        it('correctly maps sibling-path if sibling is registered and parent is not',() => {
            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.state({
                name: "foo.baz",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.current().name).toEqual("foo.bar");

            // now go "up"
            wx.router.go("^.baz");
            expect(wx.router.current().name).toEqual("foo.baz");
        });

        it('correctly maps child-path if child is registered',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo");
            expect(wx.router.current().name).toEqual("foo");

            // now go "down"
            wx.router.go(".bar");
            expect(wx.router.current().name).toEqual("foo.bar");
        });

        it('invokes enter- and leave-callbacks',() => {
            var fooEntered = false;
            var fooLeft = false;

            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                },
                onEnter: () => fooEntered = true,
                onLeave: () => fooLeft = true
            });

            wx.router.state({
                name: "bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo");
            expect(fooEntered).toBeTruthy();
            expect(fooLeft).toBeFalsy();

            wx.router.go("bar");
            expect(fooLeft).toBeTruthy();
        });
    });
});
