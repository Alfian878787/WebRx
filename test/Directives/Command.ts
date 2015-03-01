﻿/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/xircular.d.ts" />

function createCommandModel(commandAction: (any) => void) {
    var canExecute = xi.property(false);

    return {
        cmd: xi.command(commandAction, canExecute.changed),
        canExecute: canExecute
    }
};

describe('Directives', () => {
    describe('Command', () => {
        it('binding to non-command source should throw', () => {
            loadFixtures('templates/Directives/Command.html');

            var el = document.querySelector("#command-invalid-binding-target");
            var model = createCommandModel((_) => {});

            expect(() => xi.applyDirectives(model, el)).toThrowError(/Reactive Command/);
        });

        function commandBindingSmokeTestImpl(sel: string) {
            var executed = false;
            var el = <HTMLElement> document.querySelector(sel);
            var model = createCommandModel((_) => executed = true);

            // canExecute tests
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            expect(el.disabled).toBeTruthy();
            model.canExecute(true);
            expect(el.disabled).toBeFalsy();

            // execute test
            el.click();
            expect(executed).toBeTruthy();

            // disposed tests
            xi.cleanNode(el);
            executed = false;
            model.canExecute(false);
            expect(el.disabled).toBeFalsy();
            $(el).click();
            expect(executed).toBeFalsy();
        }

        it('button smoke-test - bound to options', () => {
            loadFixtures('templates/Directives/Command.html');

            commandBindingSmokeTestImpl("#command-button-options");
        });

        it('hyperlink smoke-test - bound to options', () => {
            loadFixtures('templates/Directives/Command.html');

            commandBindingSmokeTestImpl("#command-link-options");
        });

        it('button smoke-test - bound to command', () => {
            loadFixtures('templates/Directives/Command.html');

            commandBindingSmokeTestImpl("#command-button");
        });

        it('hyperlink smoke-test - bound to command', () => {
            loadFixtures('templates/Directives/Command.html');

            commandBindingSmokeTestImpl("#command-link");
        });
    });
});