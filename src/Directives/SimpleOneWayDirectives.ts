﻿///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    class SingleOneWayChangeDirectiveBase implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 
 
      ////////////////////
        // IDirective

        public apply(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("directive only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("invalid options for directive!");

            var el = <HTMLElement> node;
            var self = this;
            var exp = this.domService.compileDirectiveOptions(options);
            var obs = this.domService.expressionToObservable(exp, ctx);

            // subscribe
            state.cleanup.add(obs.subscribe(x => {
                self.applyValue(el, x);
            }));

            // release closure references to GC 
            state.cleanup.add(Rx.Disposable.create(() => {
                // nullify args
                node = null;
                options = null;
                ctx = null;
                state = null;

                // nullify common locals
                el = null;
                obs = null;
                self = null;
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 0;

        ////////////////////
        // Implementation

        protected domService: IDomService;

        protected applyValue(el: HTMLElement, value: any): void {
            internal.throwError("you need to override this method!");
        }
    }

    ////////////////////
    // Bindings

    class TextDirective extends SingleOneWayChangeDirectiveBase {
        constructor(domService: IDomService) {
            super(domService);
        } 

        protected applyValue(el: HTMLElement, value: any): void {
            if ((value === null) || (value === undefined))
                value = "";

            el.textContent = value;
        }
    }

    export interface IVisibleDirectiveOptions {
        useCssClass: boolean;   // instruct the handler to hide/show elements using the supplied css class rather than modifying the elements style property
        hiddenClass: string;    // the css class to apply when the object is hidden
    }

    class VisibleDirective extends SingleOneWayChangeDirectiveBase {
        constructor(domService: IDomService) {
            super(domService);

            this.inverse = false;
        }

        public configure(_options): void {
            var options = <IVisibleDirectiveOptions> _options;

            VisibleDirective.useCssClass = options.useCssClass;
            VisibleDirective.hiddenClass = options.hiddenClass;
        }

        ////////////////////
        // implementation

        protected applyValue(el: HTMLElement, value: any): void {
            value = this.inverse ? !value : value;

            if (!VisibleDirective.useCssClass) {
                if (!value) {
                    el.style.display = "none";
                } else {
                    el.style.display = "";
                }
            } else {
                utils.toggleCssClass(el, !value, VisibleDirective.hiddenClass);
            }
        }

        protected inverse: boolean = false;
        private static useCssClass: boolean;   // instruct the handler to hide/show elements using the supplied css classes rather than modifying the elements style property
        private static hiddenClass: string;    // the css class to apply when the object is hidden
    }

    class HiddenDirective extends VisibleDirective {
        constructor(domService: IDomService) {
            super(domService);

            this.inverse = true;
        } 
    }

    class HtmlDirective extends SingleOneWayChangeDirectiveBase {
        constructor(domService: IDomService) {
            super(domService);
        } 

        protected applyValue(el: HTMLElement, value: any): void {
            if ((value === null) || (value === undefined))
                value = "";

            el.innerHTML = value;
        }
    }

    class DisableDirective extends SingleOneWayChangeDirectiveBase {
        constructor(domService: IDomService) {
            super(domService);

            this.inverse = false;
        }

        ////////////////////
        // implementation

        protected applyValue(el: HTMLElement, value: any): void {
            value = this.inverse ? !value : value;

            el.disabled = value;
        }

        protected inverse: boolean = false;
    }

    class EnableDirective extends DisableDirective {
        constructor(domService: IDomService) {
            super(domService);

            this.inverse = true;
        }
    }

    export module internal {
        export var textDirectiveConstructor = <any> TextDirective;
        export var htmlDirectiveConstructor = <any> HtmlDirective;
        export var visibleDirectiveConstructor = <any> VisibleDirective;
        export var hiddenDirectiveConstructor = <any> HiddenDirective;
        export var disableDirectiveConstructor = <any> DisableDirective;
        export var enableDirectiveConstructor = <any> EnableDirective;
    }
}
