/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-ajax.d.ts" />

/// <reference path="../../node_modules/rx/ts/rx.lite.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.testing.d.ts" />

describe("HttpClient", () => {
    beforeEach(function() {
      jasmine.Ajax.install();
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    it("get() with just a request url", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';
        let responseData = 42;

        client.get(requestUrl).then(response=> {
            expect(response).toEqual(responseData);
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData.toString()
        });
    });

    it("get() with error response", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';
        let responseData = 42;

        client.get(requestUrl).then(response=> {
            fail("Promise should have signalled failure");
            done();
        }, (reason)=> {
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 400,
        });
    });

    it("get() with raw response", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';
        let responseData = "bar";

        client.get(requestUrl, null, { raw: true }).then(response=> {
            expect(response).toEqual(responseData);
            done();
        }, (reason)=> {
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData
        });
    });

    it("get() with params", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';
        let requestParams = { 'id': 42 };
        let responseData = 42;

        client.get(requestUrl, requestParams).then(response=> {
            expect(response).toEqual(responseData);
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl+"?id=42");

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData.toString()
        });
    });

    it("get() with params and options", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';
        let requestParams = { 'id': 42 };
        let responseData = 42;
        let options: wx.IHttpClientOptions = {
            params: { 'bar': 'baz' },
            headers: { 'foo': 'bar' },
        }

        client.get(requestUrl, requestParams, options).then(response=> {
            expect(response).toEqual(responseData);
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl+"?bar=baz"); // params from options overide params argument
        expect(jasmine.Ajax.requests.mostRecent().requestHeaders['foo']).toEqual('bar');

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData.toString()
        });
    });

    it("get() with params and existing query parameters", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url?foo=bar';
        let requestParams = { 'id': 42 };
        let responseData = 42;

        client.get(requestUrl, requestParams).then(response=> {
            expect(response).toEqual(responseData);
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl+"&id=42");

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData.toString()
        });
    });

    it("post()", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';
        let requestData = { 'foo': 'bar'};

        client.post(requestUrl, requestData).then(response=> {
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("POST");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);
        expect(jasmine.Ajax.requests.mostRecent().data().foo).toEqual(requestData.foo);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
        });
    });

    it("put()", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';
        let requestData = { 'foo': 'bar'};

        client.put(requestUrl, requestData).then(response=> {
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("PUT");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);
        expect(jasmine.Ajax.requests.mostRecent().data().foo).toEqual(requestData.foo);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
        });
    });

    it("delete()", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';

        client.delete(requestUrl).then(response=> {
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("DELETE");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
        });
    });

    it("options()", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';

        client.options(requestUrl).then(response=> {
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("OPTIONS");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
        });
    });

    it("utilizes locally configured dump() function", () => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';
        let requestData = { 'foo': 'bar'};

        let options: wx.IHttpClientOptions = {
            dump: (data: any)=> {
                return JSON.stringify(requestData);
            }
        };

        client.configure(options);

        client.post(requestUrl, { 'foo': 'baz'})

        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);
        expect(jasmine.Ajax.requests.mostRecent().data().foo).toEqual(requestData.foo);
    });

    it("utilizes locally configured load() function", (done) => {
        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        let requestUrl = '/some/cool/url';
        let responseData = 'bar';

        let options: wx.IHttpClientOptions = {
            load: (data: string)=> {
                return "foo_" + data;
            }
        };

        client.configure(options);

        client.get(requestUrl).then(response=> {
            expect(response).toEqual("foo_bar");
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData
        });
    });

    it("utilizes globally configured dump() function", () => {
        let requestUrl = '/some/cool/url';
        let requestData = { 'foo': 'bar'};

        let options = wx.getHttpClientDefaultConfig();
        options.dump = (data: any)=> {
            return JSON.stringify(requestData);
        };

        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);

        client.post(requestUrl, { 'foo': 'baz'})

        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);
        expect(jasmine.Ajax.requests.mostRecent().data().foo).toEqual(requestData.foo);
    });

    it("utilizes globally configured load() function", (done) => {
        let requestUrl = '/some/cool/url';
        let responseData = 'bar';

        let options = wx.getHttpClientDefaultConfig();
        options.load = (data: string)=> {
            return "foo_" + data;
        };

        let client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);

        client.get(requestUrl).then(response=> {
            expect(response).toEqual("foo_bar");
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData
        });
    });
});
