
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/static/Header.svelte generated by Svelte v3.48.0 */
    const file$b = "src/static/Header.svelte";

    // (47:33) 
    function create_if_block_2$1(ctx) {
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = /*user*/ ctx[0].cargo == 'admin' && create_if_block_3$1(ctx);

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Listar reservas";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Listar eventos";
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(span0, "class", "svelte-15ekvoq");
    			add_location(span0, file$b, 47, 6, 1445);
    			attr_dev(span1, "class", "svelte-15ekvoq");
    			add_location(span1, file$b, 48, 6, 1533);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", /*click_handler_6*/ ctx[8], false, false, false),
    					listen_dev(span1, "click", /*click_handler_7*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*user*/ ctx[0].cargo == 'admin') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(47:33) ",
    		ctx
    	});

    	return block;
    }

    // (43:34) 
    function create_if_block_1$2(ctx) {
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Minhas reservas";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Meus eventos";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "Sair";
    			attr_dev(span0, "class", "svelte-15ekvoq");
    			add_location(span0, file$b, 43, 6, 1140);
    			attr_dev(span1, "class", "svelte-15ekvoq");
    			add_location(span1, file$b, 44, 6, 1225);
    			set_style(span2, "color", "var(--main-color)");
    			attr_dev(span2, "class", "svelte-15ekvoq");
    			add_location(span2, file$b, 45, 6, 1308);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", /*click_handler_3*/ ctx[5], false, false, false),
    					listen_dev(span1, "click", /*click_handler_4*/ ctx[6], false, false, false),
    					listen_dev(span2, "click", /*click_handler_5*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(43:34) ",
    		ctx
    	});

    	return block;
    }

    // (38:4) {#if !user}
    function create_if_block$6(ctx) {
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Início";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Eventos";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "Login";
    			attr_dev(span0, "class", "svelte-15ekvoq");
    			add_location(span0, file$b, 38, 6, 756);
    			attr_dev(span1, "class", "svelte-15ekvoq");
    			add_location(span1, file$b, 40, 6, 926);
    			set_style(span2, "color", "var(--main-color)");
    			attr_dev(span2, "class", "svelte-15ekvoq");
    			add_location(span2, file$b, 41, 6, 1002);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(span1, "click", /*click_handler_1*/ ctx[3], false, false, false),
    					listen_dev(span2, "click", /*click_handler_2*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(38:4) {#if !user}",
    		ctx
    	});

    	return block;
    }

    // (50:6) {#if user.cargo == 'admin'}
    function create_if_block_3$1(ctx) {
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let t5;
    	let span3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Listar clientes";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Listar funcionários";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "Listar Quadras";
    			t5 = space();
    			span3 = element("span");
    			span3.textContent = "Sair";
    			attr_dev(span0, "class", "svelte-15ekvoq");
    			add_location(span0, file$b, 50, 8, 1655);
    			attr_dev(span1, "class", "svelte-15ekvoq");
    			add_location(span1, file$b, 51, 8, 1745);
    			attr_dev(span2, "class", "svelte-15ekvoq");
    			add_location(span2, file$b, 52, 8, 1839);
    			set_style(span3, "color", "var(--main-color)");
    			attr_dev(span3, "class", "svelte-15ekvoq");
    			add_location(span3, file$b, 53, 8, 1927);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span3, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", /*click_handler_8*/ ctx[10], false, false, false),
    					listen_dev(span1, "click", /*click_handler_9*/ ctx[11], false, false, false),
    					listen_dev(span2, "click", /*click_handler_10*/ ctx[12], false, false, false),
    					listen_dev(span3, "click", /*click_handler_11*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(50:6) {#if user.cargo == 'admin'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let nav;
    	let img;
    	let img_src_value;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (!/*user*/ ctx[0]) return create_if_block$6;
    		if (/*user*/ ctx[0] && !/*user*/ ctx[0].cargo) return create_if_block_1$2;
    		if (/*user*/ ctx[0] && /*user*/ ctx[0].cargo) return create_if_block_2$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			nav = element("nav");
    			img = element("img");
    			t = space();
    			if (if_block) if_block.c();
    			if (!src_url_equal(img.src, img_src_value = "images/logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "class", "img svelte-15ekvoq");
    			add_location(img, file$b, 36, 4, 682);
    			attr_dev(nav, "class", "svelte-15ekvoq");
    			add_location(nav, file$b, 35, 2, 672);
    			attr_dev(div, "class", "header flex-row flex-expand svelte-15ekvoq");
    			add_location(div, file$b, 34, 0, 628);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, nav);
    			append_dev(nav, img);
    			append_dev(nav, t);
    			if (if_block) if_block.m(nav, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(nav, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const dispatch = createEventDispatcher();
    	let { user } = $$props;
    	const writable_props = ['user'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch('handleEvents', 'about');
    	const click_handler_1 = () => dispatch('handleEvents', 'events');
    	const click_handler_2 = () => dispatch('handleLogin', true);
    	const click_handler_3 = () => dispatch('handleEvents', 'booking');
    	const click_handler_4 = () => dispatch('handleEvents', 'myevents');
    	const click_handler_5 = () => dispatch('handleLogout', null);
    	const click_handler_6 = () => dispatch('handleEvents', 'seeBooking');
    	const click_handler_7 = () => dispatch('handleEvents', 'seeEvents');
    	const click_handler_8 = () => dispatch('handleEvents', 'seeClients');
    	const click_handler_9 = () => dispatch('handleEvents', 'seeWorkers');
    	const click_handler_10 = () => dispatch('handleEvents', 'seeFields');
    	const click_handler_11 = () => dispatch('handleLogout', null);

    	$$self.$$set = $$props => {
    		if ('user' in $$props) $$invalidate(0, user = $$props.user);
    	};

    	$$self.$capture_state = () => ({ createEventDispatcher, dispatch, user });

    	$$self.$inject_state = $$props => {
    		if ('user' in $$props) $$invalidate(0, user = $$props.user);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		user,
    		dispatch,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { user: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*user*/ ctx[0] === undefined && !('user' in props)) {
    			console.warn("<Header> was created without expected prop 'user'");
    		}
    	}

    	get user() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set user(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    async function get(table,obj){
      let response = await fetch(`/${table}?${new URLSearchParams(obj)}`);
      return response.ok? await response.json() : null;
    }

    async function getByParams(params){
      let response = await fetch(params);
      return response.ok? await response.json() : null;
    }

    async function post(table,obj){
      let response = await fetch (`/${table}`,{
        method:'post',
        body:JSON.stringify(obj),
        headers:{
          'content-type':'application/json'
        }
      });
      return response.ok? await response.json() : null;
    }
    async function del(params){
      let response = await fetch(params,{
        method:'delete',
        headers:{
          'content-type':'application/json'
        }
      });
      return response.ok? await response.json() : null;
    }

    async function put(table,obj){
      let response = await fetch(`/${table}`,{
        method:'put',
        body:JSON.stringify(obj),
        headers:{
          'content-type':'application/json'
        }
      });
      return response.ok? await response.json() : null;
    }

    var DataStorage = {
      get,
      getByParams,
      post,
      del,
      put
    };

    /* src/Pages/Field.svelte generated by Svelte v3.48.0 */
    const file$a = "src/Pages/Field.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (47:10) {#each availableSports as sport }
    function create_each_block$8(ctx) {
    	let option;
    	let t_value = /*sport*/ ctx[9] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*sport*/ ctx[9];
    			option.value = option.__value;
    			add_location(option, file$a, 47, 12, 1170);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(47:10) {#each availableSports as sport }",
    		ctx
    	});

    	return block;
    }

    // (60:6) {:else}
    function create_else_block$8(ctx) {
    	let table;

    	const block = {
    		c: function create() {
    			table = element("table");
    			add_location(table, file$a, 60, 8, 1742);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$8.name,
    		type: "else",
    		source: "(60:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (58:38) 
    function create_if_block_1$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Não foi possível encontrar nenhuma quadra disponível nas condições escolhidas.";
    			set_style(p, "margin-top", "70px");
    			set_style(p, "font-size", "24px");
    			set_style(p, "color", "#ff6000");
    			add_location(p, file$a, 58, 8, 1580);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(58:38) ",
    		ctx
    	});

    	return block;
    }

    // (56:6) {#if !search}
    function create_if_block$5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Encontre o momento perfeito para o esporte!";
    			set_style(p, "margin-top", "70px");
    			set_style(p, "font-size", "24px");
    			set_style(p, "text-align", "center");
    			add_location(p, file$a, 56, 8, 1424);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(56:6) {#if !search}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div2;
    	let h2;
    	let t1;
    	let div1;
    	let form;
    	let label0;
    	let h10;
    	let t3;
    	let input0;
    	let t4;
    	let label1;
    	let h11;
    	let t6;
    	let input1;
    	let t7;
    	let label2;
    	let h12;
    	let t9;
    	let select;
    	let t10;
    	let button;
    	let t12;
    	let div0;
    	let mounted;
    	let dispose;
    	let each_value = /*availableSports*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (!/*search*/ ctx[3]) return create_if_block$5;
    		if (/*search*/ ctx[3] == 'no-return') return create_if_block_1$1;
    		return create_else_block$8;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Encontre sua Quadra";
    			t1 = space();
    			div1 = element("div");
    			form = element("form");
    			label0 = element("label");
    			h10 = element("h1");
    			h10.textContent = "DATA";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			h11 = element("h1");
    			h11.textContent = "HORÁRIO";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			label2 = element("label");
    			h12 = element("h1");
    			h12.textContent = "ESPORTE";
    			t9 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			button = element("button");
    			button.textContent = "BUSCAR";
    			t12 = space();
    			div0 = element("div");
    			if_block.c();
    			attr_dev(h2, "class", "title center svelte-16ie5so");
    			add_location(h2, file$a, 32, 2, 519);
    			add_location(h10, file$a, 36, 8, 755);
    			attr_dev(input0, "type", "date");
    			input0.required = true;
    			add_location(input0, file$a, 37, 8, 777);
    			attr_dev(label0, "class", "finput");
    			set_style(label0, "width", "250px");
    			add_location(label0, file$a, 35, 6, 704);
    			add_location(h11, file$a, 40, 8, 898);
    			attr_dev(input1, "type", "time");
    			input1.required = true;
    			add_location(input1, file$a, 41, 8, 923);
    			attr_dev(label1, "class", "finput");
    			set_style(label1, "width", "250px");
    			add_location(label1, file$a, 39, 6, 847);
    			add_location(h12, file$a, 44, 8, 1044);
    			select.required = true;
    			if (/*selectedSport*/ ctx[2] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[8].call(select));
    			add_location(select, file$a, 45, 8, 1069);
    			attr_dev(label2, "class", "finput");
    			set_style(label2, "width", "250px");
    			add_location(label2, file$a, 43, 6, 993);
    			attr_dev(button, "class", "custom-button");
    			attr_dev(button, "type", "submit");
    			add_location(button, file$a, 51, 6, 1266);
    			attr_dev(form, "class", "field-form flex-column svelte-16ie5so");
    			add_location(form, file$a, 34, 4, 621);
    			attr_dev(div0, "style", "width: 250px;margin-left:200px;display");
    			add_location(div0, file$a, 54, 4, 1343);
    			attr_dev(div1, "class", "flex-row");
    			set_style(div1, "padding", "25px");
    			add_location(div1, file$a, 33, 2, 571);
    			attr_dev(div2, "class", "available svelte-16ie5so");
    			add_location(div2, file$a, 31, 0, 493);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h2);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, form);
    			append_dev(form, label0);
    			append_dev(label0, h10);
    			append_dev(label0, t3);
    			append_dev(label0, input0);
    			set_input_value(input0, /*date*/ ctx[0]);
    			append_dev(form, t4);
    			append_dev(form, label1);
    			append_dev(label1, h11);
    			append_dev(label1, t6);
    			append_dev(label1, input1);
    			set_input_value(input1, /*time*/ ctx[1]);
    			append_dev(form, t7);
    			append_dev(form, label2);
    			append_dev(label2, h12);
    			append_dev(label2, t9);
    			append_dev(label2, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedSport*/ ctx[2]);
    			append_dev(form, t10);
    			append_dev(form, button);
    			append_dev(div1, t12);
    			append_dev(div1, div0);
    			if_block.m(div0, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[7]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[8]),
    					listen_dev(form, "submit", prevent_default(/*searchField*/ ctx[5]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*date*/ 1) {
    				set_input_value(input0, /*date*/ ctx[0]);
    			}

    			if (dirty & /*time*/ 2) {
    				set_input_value(input1, /*time*/ ctx[1]);
    			}

    			if (dirty & /*availableSports*/ 16) {
    				each_value = /*availableSports*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selectedSport, availableSports*/ 20) {
    				select_option(select, /*selectedSport*/ ctx[2]);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Field', slots, []);
    	let availableSports = ['Futebol', 'Volei', 'Handebol', 'Basquete'];
    	let date;
    	let time;
    	let selectedSport;
    	let search;

    	function searchField() {
    		//DataStorage.get()...
    		$$invalidate(3, search = 'no-return');

    		return availableFields;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Field> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		date = this.value;
    		$$invalidate(0, date);
    	}

    	function input1_input_handler() {
    		time = this.value;
    		$$invalidate(1, time);
    	}

    	function select_change_handler() {
    		selectedSport = select_value(this);
    		$$invalidate(2, selectedSport);
    		$$invalidate(4, availableSports);
    	}

    	$$self.$capture_state = () => ({
    		DataStorage,
    		availableSports,
    		date,
    		time,
    		selectedSport,
    		search,
    		searchField
    	});

    	$$self.$inject_state = $$props => {
    		if ('availableSports' in $$props) $$invalidate(4, availableSports = $$props.availableSports);
    		if ('date' in $$props) $$invalidate(0, date = $$props.date);
    		if ('time' in $$props) $$invalidate(1, time = $$props.time);
    		if ('selectedSport' in $$props) $$invalidate(2, selectedSport = $$props.selectedSport);
    		if ('search' in $$props) $$invalidate(3, search = $$props.search);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		date,
    		time,
    		selectedSport,
    		search,
    		availableSports,
    		searchField,
    		input0_input_handler,
    		input1_input_handler,
    		select_change_handler
    	];
    }

    class Field extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Field",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/Pages/About.svelte generated by Svelte v3.48.0 */
    const file$9 = "src/Pages/About.svelte";

    function create_fragment$9(ctx) {
    	let div2;
    	let div0;
    	let h10;
    	let t1;
    	let h11;
    	let t3;
    	let p;
    	let t5;
    	let a0;
    	let t7;
    	let a1;
    	let t9;
    	let div1;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Reserva sua quadra";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "sem sair de casa";
    			t3 = space();
    			p = element("p");
    			p.textContent = "Acesse o sistema de Login para solicitar um agendamento e nossos funcionários confirmarão sua reserva\n      sem que você precise se deslocar até o local.";
    			t5 = space();
    			a0 = element("a");
    			a0.textContent = "Acesse o Login";
    			t7 = space();
    			a1 = element("a");
    			a1.textContent = "Cadastre-se";
    			t9 = space();
    			div1 = element("div");
    			img = element("img");
    			attr_dev(h10, "class", "svelte-v5wwzz");
    			add_location(h10, file$9, 47, 4, 857);
    			attr_dev(h11, "class", "svelte-v5wwzz");
    			add_location(h11, file$9, 48, 4, 889);
    			attr_dev(p, "class", "svelte-v5wwzz");
    			add_location(p, file$9, 49, 4, 919);
    			attr_dev(a0, "class", "button svelte-v5wwzz");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$9, 53, 6, 1098);
    			attr_dev(a1, "class", "button svelte-v5wwzz");
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$9, 54, 6, 1235);
    			attr_dev(div0, "id", "about");
    			attr_dev(div0, "class", "svelte-v5wwzz");
    			add_location(div0, file$9, 46, 2, 836);
    			if (!src_url_equal(img.src, img_src_value = "https://i2.wp.com/direcionalescolas.com.br/wp-content/uploads/2018/10/quadras-poliesportivas.jpg?fit=750%2C406&ssl=1")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "quadra");
    			set_style(img, "height", "315px");
    			set_style(img, "width", "510px");
    			add_location(img, file$9, 57, 4, 1386);
    			add_location(div1, file$9, 56, 2, 1376);
    			attr_dev(div2, "class", "about flex-container svelte-v5wwzz");
    			add_location(div2, file$9, 45, 0, 799);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t1);
    			append_dev(div0, h11);
    			append_dev(div0, t3);
    			append_dev(div0, p);
    			append_dev(div0, t5);
    			append_dev(div0, a0);
    			append_dev(div0, t7);
    			append_dev(div0, a1);
    			append_dev(div2, t9);
    			append_dev(div2, div1);
    			append_dev(div1, img);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", prevent_default(/*click_handler*/ ctx[1]), false, true, false),
    					listen_dev(a1, "click", prevent_default(/*click_handler_1*/ ctx[2]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const dispatch = createEventDispatcher();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch('handleLogin', { 'status': true, 'type': 'login' });
    	const click_handler_1 = () => dispatch('handleLogin', { 'status': true, 'type': 'sign-up' });
    	$$self.$capture_state = () => ({ createEventDispatcher, dispatch });
    	return [dispatch, click_handler, click_handler_1];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/Pages/Events.svelte generated by Svelte v3.48.0 */
    const file$8 = "src/Pages/Events.svelte";

    function create_fragment$8(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let p0;
    	let t2;
    	let p1;
    	let t4;
    	let p2;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Planejando inventar um campeonato?";
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Sonha em colocar um troféu no seu quarto?";
    			t4 = space();
    			p2 = element("p");
    			p2.textContent = "Prepare-se para uma imersão esportiva 100%";
    			t6 = space();
    			button = element("button");
    			button.textContent = "FAÇA O LOGIN";
    			if (!src_url_equal(img.src, img_src_value = "images/event.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "event");
    			attr_dev(img, "class", "img svelte-19bnc4o");
    			add_location(img, file$8, 23, 4, 375);
    			add_location(div0, file$8, 22, 2, 365);
    			add_location(p0, file$8, 26, 4, 490);
    			add_location(p1, file$8, 27, 4, 536);
    			add_location(p2, file$8, 28, 4, 589);
    			attr_dev(button, "class", "custom-button");
    			set_style(button, "margin-top", "30px ");
    			add_location(button, file$8, 29, 4, 643);
    			attr_dev(div1, "class", "flex-column description svelte-19bnc4o");
    			attr_dev(div1, "style", "");
    			add_location(div1, file$8, 25, 2, 439);
    			attr_dev(div2, "class", "flex-row");
    			add_location(div2, file$8, 21, 0, 340);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t2);
    			append_dev(div1, p1);
    			append_dev(div1, t4);
    			append_dev(div1, p2);
    			append_dev(div1, t6);
    			append_dev(div1, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", prevent_default(/*click_handler*/ ctx[1]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Events', slots, []);
    	const dispatch = createEventDispatcher();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Events> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch('handleLogin', { 'status': true, 'type': 'login' });
    	$$self.$capture_state = () => ({ createEventDispatcher, dispatch });
    	return [dispatch, click_handler];
    }

    class Events extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Events",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/clientPages/Booking.svelte generated by Svelte v3.48.0 */
    const file$7 = "src/clientPages/Booking.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_catch_block_2$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_2$1.name,
    		type: "catch",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (73:43)          {#each booking as booked}
    function create_then_block_2$1(ctx) {
    	let each_1_anchor;
    	let each_value_2 = /*booking*/ ctx[24];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_1_else = null;

    	if (!each_value_2.length) {
    		each_1_else = create_else_block_1(ctx);
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();

    			if (each_1_else) {
    				each_1_else.c();
    			}
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deleteBooking, bookingsPromise*/ 65) {
    				each_value_2 = /*booking*/ ctx[24];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;

    				if (!each_value_2.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value_2.length) {
    					each_1_else = create_else_block_1(ctx);
    					each_1_else.c();
    					each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_2$1.name,
    		type: "then",
    		source: "(73:43)          {#each booking as booked}",
    		ctx
    	});

    	return block;
    }

    // (84:10) {:else}
    function create_else_block_1(ctx) {
    	let tr;
    	let td;
    	let t1;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			td.textContent = "Nenhuma reserva disponível";
    			t1 = space();
    			attr_dev(td, "colspan", "8");
    			set_style(td, "text-align", "center");
    			add_location(td, file$7, 85, 12, 2468);
    			add_location(tr, file$7, 84, 10, 2451);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(tr, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(84:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:8) {#each booking as booked}
    function create_each_block_2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*booked*/ ctx[25].data.replace('T', ' ').replace('Z', '').substr(0, 10) + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*booked*/ ctx[25].horario + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*booked*/ ctx[25].modalidade + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*booked*/ ctx[25].nome + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = (/*booked*/ ctx[25].recorrente == false ? 'Não' : 'Sim') + "";
    	let t8;
    	let t9;
    	let td5;

    	let t10_value = (/*booked*/ ctx[25].status == 'approved'
    	? 'Aprovado'
    	: 'Pendente') + "";

    	let t10;
    	let t11;
    	let td6;
    	let button;
    	let t13;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*booked*/ ctx[25]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td6 = element("td");
    			button = element("button");
    			button.textContent = "EXCLUIR";
    			t13 = space();
    			add_location(td0, file$7, 75, 12, 1998);
    			add_location(td1, file$7, 76, 12, 2079);
    			add_location(td2, file$7, 77, 12, 2117);
    			add_location(td3, file$7, 78, 12, 2158);
    			add_location(td4, file$7, 79, 12, 2193);
    			add_location(td5, file$7, 80, 12, 2259);
    			add_location(button, file$7, 81, 16, 2340);
    			add_location(td6, file$7, 81, 12, 2336);
    			add_location(tr, file$7, 74, 10, 1981);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td6);
    			append_dev(td6, button);
    			append_dev(tr, t13);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*bookingsPromise*/ 1 && t0_value !== (t0_value = /*booked*/ ctx[25].data.replace('T', ' ').replace('Z', '').substr(0, 10) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*bookingsPromise*/ 1 && t2_value !== (t2_value = /*booked*/ ctx[25].horario + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*bookingsPromise*/ 1 && t4_value !== (t4_value = /*booked*/ ctx[25].modalidade + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*bookingsPromise*/ 1 && t6_value !== (t6_value = /*booked*/ ctx[25].nome + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*bookingsPromise*/ 1 && t8_value !== (t8_value = (/*booked*/ ctx[25].recorrente == false ? 'Não' : 'Sim') + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*bookingsPromise*/ 1 && t10_value !== (t10_value = (/*booked*/ ctx[25].status == 'approved'
    			? 'Aprovado'
    			: 'Pendente') + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(74:8) {#each booking as booked}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_pending_block_2$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_2$1.name,
    		type: "pending",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (95:0) {#if bookingStart == true}
    function create_if_block$4(ctx) {
    	let div5;
    	let div4;
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let i;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let form;
    	let label0;
    	let h10;
    	let t6;
    	let input0;
    	let t7;
    	let label1;
    	let h11;
    	let t9;
    	let input1;
    	let t10;
    	let label2;
    	let h12;
    	let t12;
    	let select0;
    	let t13;
    	let label3;
    	let h13;
    	let t15;
    	let select1;
    	let option0;
    	let option1;
    	let t18;
    	let label4;
    	let h14;
    	let t20;
    	let select2;
    	let t21;
    	let button;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_1$1,
    		then: create_then_block_1$1,
    		catch: create_catch_block_1$1,
    		value: 20
    	};

    	handle_promise(/*fieldsPromise*/ ctx[4], info);

    	let info_1 = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$6,
    		then: create_then_block$6,
    		catch: create_catch_block$6,
    		value: 16
    	};

    	handle_promise(/*eventsPromise*/ ctx[3], info_1);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "RESERVAR";
    			t1 = space();
    			i = element("i");
    			i.textContent = "highlight_off";
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			form = element("form");
    			label0 = element("label");
    			h10 = element("h1");
    			h10.textContent = "DATA";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			label1 = element("label");
    			h11 = element("h1");
    			h11.textContent = "HORÁRIO";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			label2 = element("label");
    			h12 = element("h1");
    			h12.textContent = "ESPORTE";
    			t12 = space();
    			select0 = element("select");
    			info.block.c();
    			t13 = space();
    			label3 = element("label");
    			h13 = element("h1");
    			h13.textContent = "RECORRENTE";
    			t15 = space();
    			select1 = element("select");
    			option0 = element("option");
    			option0.textContent = "SIM";
    			option1 = element("option");
    			option1.textContent = "NÃO";
    			t18 = space();
    			label4 = element("label");
    			h14 = element("h1");
    			h14.textContent = "EVENTO";
    			t20 = space();
    			select2 = element("select");
    			info_1.block.c();
    			t21 = space();
    			button = element("button");
    			button.textContent = "RESERVAR";
    			set_style(span, "color", "var(--main-color)");
    			set_style(span, "font-weight", "bold");
    			set_style(span, "font-size", "18px");
    			add_location(span, file$7, 98, 28, 2970);
    			attr_dev(div0, "class", "left");
    			add_location(div0, file$7, 98, 10, 2952);
    			attr_dev(i, "class", "material-icons right clickable");
    			add_location(i, file$7, 99, 10, 3072);
    			attr_dev(div1, "class", "dialog-section");
    			add_location(div1, file$7, 97, 6, 2913);
    			attr_dev(div2, "class", "hr");
    			add_location(div2, file$7, 101, 6, 3189);
    			add_location(h10, file$7, 105, 12, 3469);
    			attr_dev(input0, "type", "date");
    			attr_dev(input0, "placeholder", "000.000.000-00");
    			input0.required = true;
    			add_location(input0, file$7, 106, 12, 3495);
    			attr_dev(label0, "class", "finput");
    			set_style(label0, "width", "350px");
    			add_location(label0, file$7, 104, 10, 3414);
    			add_location(h11, file$7, 109, 12, 3668);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "HH:MM:SS  ");
    			input1.required = true;
    			add_location(input1, file$7, 110, 12, 3697);
    			attr_dev(label1, "class", "finput");
    			set_style(label1, "width", "350px");
    			add_location(label1, file$7, 108, 10, 3613);
    			add_location(h12, file$7, 113, 12, 3869);
    			select0.required = true;
    			if (/*newBooking*/ ctx[1].idQuadra === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[13].call(select0));
    			add_location(select0, file$7, 114, 12, 3898);
    			attr_dev(label2, "class", "finput");
    			set_style(label2, "width", "350px");
    			add_location(label2, file$7, 112, 10, 3814);
    			add_location(h13, file$7, 125, 12, 4362);
    			option0.__value = true;
    			option0.value = option0.__value;
    			add_location(option0, file$7, 127, 18, 4465);
    			option1.__value = false;
    			option1.value = option1.__value;
    			add_location(option1, file$7, 128, 18, 4517);
    			select1.required = true;
    			if (/*newBooking*/ ctx[1].recorrente === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[14].call(select1));
    			add_location(select1, file$7, 126, 12, 4394);
    			attr_dev(label3, "class", "finput");
    			set_style(label3, "width", "350px");
    			add_location(label3, file$7, 124, 10, 4307);
    			add_location(h14, file$7, 132, 12, 4658);
    			select2.required = true;
    			if (/*newBooking*/ ctx[1].idEvento === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[15].call(select2));
    			add_location(select2, file$7, 133, 12, 4686);
    			attr_dev(label4, "class", "finput");
    			set_style(label4, "width", "350px");
    			add_location(label4, file$7, 131, 10, 4603);
    			attr_dev(button, "class", "custom-button");
    			set_style(button, "margin-top", "30px");
    			attr_dev(button, "type", "submit");
    			add_location(button, file$7, 142, 10, 5042);
    			attr_dev(form, "class", "field-form flex-column");
    			add_location(form, file$7, 103, 8, 3325);
    			attr_dev(div3, "class", "flex-column");
    			set_style(div3, "justify-content", "center");
    			set_style(div3, "align-items", "center");
    			set_style(div3, "padding", "60px 0 80px 0");
    			add_location(div3, file$7, 102, 6, 3218);
    			attr_dev(div4, "class", "dialog-container");
    			set_style(div4, "min-width", "1200px");
    			add_location(div4, file$7, 96, 2, 2849);
    			attr_dev(div5, "id", "login");
    			attr_dev(div5, "class", "fullscreen-faded");
    			set_style(div5, "z-index", "2 ");
    			add_location(div5, file$7, 95, 0, 2785);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div1, t1);
    			append_dev(div1, i);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, form);
    			append_dev(form, label0);
    			append_dev(label0, h10);
    			append_dev(label0, t6);
    			append_dev(label0, input0);
    			set_input_value(input0, /*newBooking*/ ctx[1].data);
    			append_dev(form, t7);
    			append_dev(form, label1);
    			append_dev(label1, h11);
    			append_dev(label1, t9);
    			append_dev(label1, input1);
    			set_input_value(input1, /*newBooking*/ ctx[1].horario);
    			append_dev(form, t10);
    			append_dev(form, label2);
    			append_dev(label2, h12);
    			append_dev(label2, t12);
    			append_dev(label2, select0);
    			info.block.m(select0, info.anchor = null);
    			info.mount = () => select0;
    			info.anchor = null;
    			select_option(select0, /*newBooking*/ ctx[1].idQuadra);
    			append_dev(form, t13);
    			append_dev(form, label3);
    			append_dev(label3, h13);
    			append_dev(label3, t15);
    			append_dev(label3, select1);
    			append_dev(select1, option0);
    			append_dev(select1, option1);
    			select_option(select1, /*newBooking*/ ctx[1].recorrente);
    			append_dev(form, t18);
    			append_dev(form, label4);
    			append_dev(label4, h14);
    			append_dev(label4, t20);
    			append_dev(label4, select2);
    			info_1.block.m(select2, info_1.anchor = null);
    			info_1.mount = () => select2;
    			info_1.anchor = null;
    			select_option(select2, /*newBooking*/ ctx[1].idEvento);
    			append_dev(form, t21);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(i, "click", /*click_handler_2*/ ctx[10], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[12]),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[13]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[14]),
    					listen_dev(select2, "change", /*select2_change_handler*/ ctx[15]),
    					listen_dev(form, "submit", prevent_default(/*handleBooking*/ ctx[5]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*newBooking, fieldsPromise*/ 18) {
    				set_input_value(input0, /*newBooking*/ ctx[1].data);
    			}

    			if (dirty & /*newBooking, fieldsPromise*/ 18 && input1.value !== /*newBooking*/ ctx[1].horario) {
    				set_input_value(input1, /*newBooking*/ ctx[1].horario);
    			}

    			update_await_block_branch(info, ctx, dirty);

    			if (dirty & /*newBooking, fieldsPromise*/ 18) {
    				select_option(select0, /*newBooking*/ ctx[1].idQuadra);
    			}

    			if (dirty & /*newBooking, fieldsPromise*/ 18) {
    				select_option(select1, /*newBooking*/ ctx[1].recorrente);
    			}

    			update_await_block_branch(info_1, ctx, dirty);

    			if (dirty & /*newBooking, fieldsPromise*/ 18) {
    				select_option(select2, /*newBooking*/ ctx[1].idEvento);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			info.block.d();
    			info.token = null;
    			info = null;
    			info_1.block.d();
    			info_1.token = null;
    			info_1 = null;
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(95:0) {#if bookingStart == true}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_catch_block_1$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1$1.name,
    		type: "catch",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (116:49)                  {#each fields as field }
    function create_then_block_1$1(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*fields*/ ctx[20];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_1_else_1 = null;

    	if (!each_value_1.length) {
    		each_1_else_1 = create_else_block$7(ctx);
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();

    			if (each_1_else_1) {
    				each_1_else_1.c();
    			}
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else_1) {
    				each_1_else_1.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*fieldsPromise*/ 16) {
    				each_value_1 = /*fields*/ ctx[20];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;

    				if (each_value_1.length) {
    					if (each_1_else_1) {
    						each_1_else_1.d(1);
    						each_1_else_1 = null;
    					}
    				} else if (!each_1_else_1) {
    					each_1_else_1 = create_else_block$7(ctx);
    					each_1_else_1.c();
    					each_1_else_1.m(each_1_anchor.parentNode, each_1_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else_1) each_1_else_1.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1$1.name,
    		type: "then",
    		source: "(116:49)                  {#each fields as field }",
    		ctx
    	});

    	return block;
    }

    // (119:16) {:else}
    function create_else_block$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("SEM OPÇÕES NESSE HORARIO");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$7.name,
    		type: "else",
    		source: "(119:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (117:16) {#each fields as field }
    function create_each_block_1$1(ctx) {
    	let option;
    	let t_value = "[" + /*field*/ ctx[21].modalidade + "], " + /*field*/ ctx[21].nomebloco + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*field*/ ctx[21].id;
    			option.value = option.__value;
    			add_location(option, file$7, 117, 18, 4058);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(117:16) {#each fields as field }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_pending_block_1$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1$1.name,
    		type: "pending",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_catch_block$6(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$6.name,
    		type: "catch",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (135:49)                <option value={null}
    function create_then_block$6(ctx) {
    	let option;
    	let each_1_anchor;
    	let each_value = /*events*/ ctx[16];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			option = element("option");
    			option.textContent = "Nenhum";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			option.__value = null;
    			option.value = option.__value;
    			add_location(option, file$7, 135, 14, 4801);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*eventsPromise*/ 8) {
    				each_value = /*events*/ ctx[16];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$6.name,
    		type: "then",
    		source: "(135:49)                <option value={null}",
    		ctx
    	});

    	return block;
    }

    // (137:16) {#each events as event }
    function create_each_block$7(ctx) {
    	let option;
    	let t_value = /*event*/ ctx[17].nome + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*event*/ ctx[17].id;
    			option.value = option.__value;
    			add_location(option, file$7, 137, 18, 4897);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(137:16) {#each events as event }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_pending_block$6(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$6.name,
    		type: "pending",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t3;
    	let td1;
    	let t5;
    	let td2;
    	let t7;
    	let td3;
    	let t9;
    	let td4;
    	let t11;
    	let td5;
    	let t13;
    	let td6;
    	let t15;
    	let tbody;
    	let promise;
    	let t16;
    	let button;
    	let t18;
    	let if_block_anchor;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_2$1,
    		then: create_then_block_2$1,
    		catch: create_catch_block_2$1,
    		value: 24
    	};

    	handle_promise(promise = /*bookingsPromise*/ ctx[0], info);
    	let if_block = /*bookingStart*/ ctx[2] == true && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Minhas reservas";
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			td0.textContent = "DATA";
    			t3 = space();
    			td1 = element("td");
    			td1.textContent = "HORARIO";
    			t5 = space();
    			td2 = element("td");
    			td2.textContent = "MODALIDADES";
    			t7 = space();
    			td3 = element("td");
    			td3.textContent = "BLOCO";
    			t9 = space();
    			td4 = element("td");
    			td4.textContent = "RECORRÊNCIA";
    			t11 = space();
    			td5 = element("td");
    			td5.textContent = "STATUS";
    			t13 = space();
    			td6 = element("td");
    			td6.textContent = "EXCLUIR";
    			t15 = space();
    			tbody = element("tbody");
    			info.block.c();
    			t16 = space();
    			button = element("button");
    			button.textContent = "Nova Reserva";
    			t18 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h2, "class", "title svelte-1bjxly0");
    			set_style(h2, "text-align", "center");
    			add_location(h2, file$7, 58, 2, 1565);
    			add_location(td0, file$7, 62, 8, 1687);
    			add_location(td1, file$7, 63, 8, 1709);
    			add_location(td2, file$7, 64, 8, 1734);
    			add_location(td3, file$7, 65, 8, 1763);
    			add_location(td4, file$7, 66, 8, 1786);
    			add_location(td5, file$7, 67, 8, 1815);
    			add_location(td6, file$7, 68, 8, 1839);
    			add_location(tr, file$7, 61, 6, 1674);
    			add_location(thead, file$7, 60, 4, 1660);
    			add_location(tbody, file$7, 71, 4, 1885);
    			attr_dev(table, "class", "table");
    			add_location(table, file$7, 59, 2, 1634);
    			attr_dev(button, "class", "custom-button");
    			set_style(button, "margin-left", "450px");
    			set_style(button, "margin-top", "30px");
    			add_location(button, file$7, 91, 2, 2621);
    			attr_dev(div, "class", "booking svelte-1bjxly0");
    			add_location(div, file$7, 57, 0, 1541);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(tr, t9);
    			append_dev(tr, td4);
    			append_dev(tr, t11);
    			append_dev(tr, td5);
    			append_dev(tr, t13);
    			append_dev(tr, td6);
    			append_dev(table, t15);
    			append_dev(table, tbody);
    			info.block.m(tbody, info.anchor = null);
    			info.mount = () => tbody;
    			info.anchor = null;
    			append_dev(div, t16);
    			append_dev(div, button);
    			insert_dev(target, t18, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*bookingsPromise*/ 1 && promise !== (promise = /*bookingsPromise*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}

    			if (/*bookingStart*/ ctx[2] == true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t18);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Booking', slots, []);
    	let { user } = $$props;
    	let bookingsPromise = DataStorage.getByParams(`/appointments/clients/${user.id}`);
    	let eventsPromise = DataStorage.getByParams(`events/clients/${user.id}`);

    	let newBooking = {
    		idEvento: null,
    		idQuadra: '',
    		idCliente: user.id,
    		idFuncionario: null,
    		data: '2022-06-28',
    		horario: '09:00:00',
    		recorrente: false,
    		antecedencia: '',
    		status: 'pending'
    	};

    	let bookingStart = false;

    	let fieldsPromise = DataStorage.get('fields', {
    		'data': newBooking.data,
    		'horario': newBooking.horario
    	}) || [];

    	async function handleBooking() {
    		let res = await DataStorage.post('appointments', newBooking);

    		if (res.answer == "Success") {
    			alert('Sucesso!');
    			$$invalidate(2, bookingStart = false);

    			$$invalidate(1, newBooking = {
    				idEvento: null,
    				idCliente: user.id,
    				idQuadra: '',
    				idFuncionario: null,
    				data: '2022-06-28',
    				horario: '09:00:00',
    				recorrente: false,
    				antecedencia: '',
    				status: 'pending'
    			});

    			$$invalidate(0, bookingsPromise = DataStorage.getByParams(`/appointments/clients/${user.id}`));
    		}
    	}

    	async function deleteBooking(booking) {
    		let res = await DataStorage.del(`appointments/delete/${booking.id}`);
    		if (res.answer == 'Success') $$invalidate(0, bookingsPromise = bookingsPromise.then(bookings => bookings.filter(filterBooking => filterBooking.id != booking.id)));
    	}

    	const writable_props = ['user'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Booking> was created with unknown prop '${key}'`);
    	});

    	const click_handler = booked => deleteBooking(booked);
    	const click_handler_1 = () => $$invalidate(2, bookingStart = true);
    	const click_handler_2 = () => $$invalidate(2, bookingStart = false);

    	function input0_input_handler() {
    		newBooking.data = this.value;
    		$$invalidate(1, newBooking);
    		$$invalidate(4, fieldsPromise);
    	}

    	function input1_input_handler() {
    		newBooking.horario = this.value;
    		$$invalidate(1, newBooking);
    		$$invalidate(4, fieldsPromise);
    	}

    	function select0_change_handler() {
    		newBooking.idQuadra = select_value(this);
    		$$invalidate(1, newBooking);
    		$$invalidate(4, fieldsPromise);
    	}

    	function select1_change_handler() {
    		newBooking.recorrente = select_value(this);
    		$$invalidate(1, newBooking);
    		$$invalidate(4, fieldsPromise);
    	}

    	function select2_change_handler() {
    		newBooking.idEvento = select_value(this);
    		$$invalidate(1, newBooking);
    		$$invalidate(4, fieldsPromise);
    	}

    	$$self.$$set = $$props => {
    		if ('user' in $$props) $$invalidate(7, user = $$props.user);
    	};

    	$$self.$capture_state = () => ({
    		DataStorage,
    		user,
    		bookingsPromise,
    		eventsPromise,
    		newBooking,
    		bookingStart,
    		fieldsPromise,
    		handleBooking,
    		deleteBooking
    	});

    	$$self.$inject_state = $$props => {
    		if ('user' in $$props) $$invalidate(7, user = $$props.user);
    		if ('bookingsPromise' in $$props) $$invalidate(0, bookingsPromise = $$props.bookingsPromise);
    		if ('eventsPromise' in $$props) $$invalidate(3, eventsPromise = $$props.eventsPromise);
    		if ('newBooking' in $$props) $$invalidate(1, newBooking = $$props.newBooking);
    		if ('bookingStart' in $$props) $$invalidate(2, bookingStart = $$props.bookingStart);
    		if ('fieldsPromise' in $$props) $$invalidate(4, fieldsPromise = $$props.fieldsPromise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		bookingsPromise,
    		newBooking,
    		bookingStart,
    		eventsPromise,
    		fieldsPromise,
    		handleBooking,
    		deleteBooking,
    		user,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		input0_input_handler,
    		input1_input_handler,
    		select0_change_handler,
    		select1_change_handler,
    		select2_change_handler
    	];
    }

    class Booking extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { user: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Booking",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*user*/ ctx[7] === undefined && !('user' in props)) {
    			console.warn("<Booking> was created without expected prop 'user'");
    		}
    	}

    	get user() {
    		throw new Error("<Booking>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set user(value) {
    		throw new Error("<Booking>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/clientPages/MyEvents.svelte generated by Svelte v3.48.0 */
    const file$6 = "src/clientPages/MyEvents.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (1:0) <style>   .events{     position:relative;     margin-top: -50px;   }
    function create_catch_block$5(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$5.name,
    		type: "catch",
    		source: "(1:0) <style>   .events{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (45:40)          {#each events as event}
    function create_then_block$5(ctx) {
    	let each_1_anchor;
    	let each_value = /*events*/ ctx[10];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block$6(ctx);
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();

    			if (each_1_else) {
    				each_1_else.c();
    			}
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deleteEvent, eventsPromise*/ 17) {
    				each_value = /*events*/ ctx[10];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block$6(ctx);
    					each_1_else.c();
    					each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$5.name,
    		type: "then",
    		source: "(45:40)          {#each events as event}",
    		ctx
    	});

    	return block;
    }

    // (51:10) {:else}
    function create_else_block$6(ctx) {
    	let tr;
    	let td;
    	let t1;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			td.textContent = "Nenhum evento disponível";
    			t1 = space();
    			attr_dev(td, "colspan", "2");
    			add_location(td, file$6, 52, 14, 1418);
    			add_location(tr, file$6, 51, 12, 1399);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(tr, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(51:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (46:8) {#each events as event}
    function create_each_block$6(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*event*/ ctx[11].nome + "";
    	let t0;
    	let t1;
    	let td1;
    	let button;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*event*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			button = element("button");
    			button.textContent = "EXCLUIR";
    			t3 = space();
    			add_location(td0, file$6, 47, 12, 1251);
    			add_location(button, file$6, 48, 16, 1289);
    			add_location(td1, file$6, 48, 12, 1285);
    			add_location(tr, file$6, 46, 10, 1234);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, button);
    			append_dev(tr, t3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*eventsPromise*/ 1 && t0_value !== (t0_value = /*event*/ ctx[11].nome + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(46:8) {#each events as event}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <style>   .events{     position:relative;     margin-top: -50px;   }
    function create_pending_block$5(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$5.name,
    		type: "pending",
    		source: "(1:0) <style>   .events{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (62:0) {#if eventStart == true}
    function create_if_block$3(ctx) {
    	let div5;
    	let div4;
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let i;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let form;
    	let label;
    	let h1;
    	let t6;
    	let input;
    	let t7;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "RESERVAR";
    			t1 = space();
    			i = element("i");
    			i.textContent = "highlight_off";
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			form = element("form");
    			label = element("label");
    			h1 = element("h1");
    			h1.textContent = "NOME DO EVENTO";
    			t6 = space();
    			input = element("input");
    			t7 = space();
    			button = element("button");
    			button.textContent = "SALVAR";
    			set_style(span, "color", "var(--main-color)");
    			set_style(span, "font-weight", "bold");
    			set_style(span, "font-size", "18px");
    			add_location(span, file$6, 65, 28, 1887);
    			attr_dev(div0, "class", "left");
    			add_location(div0, file$6, 65, 10, 1869);
    			attr_dev(i, "class", "material-icons right clickable");
    			add_location(i, file$6, 66, 10, 1989);
    			attr_dev(div1, "class", "dialog-section");
    			add_location(div1, file$6, 64, 6, 1830);
    			attr_dev(div2, "class", "hr");
    			add_location(div2, file$6, 68, 6, 2104);
    			add_location(h1, file$6, 72, 12, 2383);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "EVENTO XXX");
    			input.required = true;
    			add_location(input, file$6, 73, 12, 2419);
    			attr_dev(label, "class", "finput");
    			set_style(label, "width", "350px");
    			add_location(label, file$6, 71, 10, 2327);
    			attr_dev(button, "class", "custom-button");
    			attr_dev(button, "type", "submit");
    			add_location(button, file$6, 75, 10, 2527);
    			attr_dev(form, "class", "field-form flex-column");
    			add_location(form, file$6, 70, 8, 2240);
    			attr_dev(div3, "class", "flex-column");
    			set_style(div3, "justify-content", "center");
    			set_style(div3, "align-items", "center");
    			set_style(div3, "padding", "60px 0 80px 0");
    			add_location(div3, file$6, 69, 6, 2133);
    			attr_dev(div4, "class", "dialog-container");
    			set_style(div4, "min-width", "1200px");
    			add_location(div4, file$6, 63, 2, 1766);
    			attr_dev(div5, "id", "login");
    			attr_dev(div5, "class", "fullscreen-faded");
    			set_style(div5, "z-index", "2 ");
    			add_location(div5, file$6, 62, 0, 1702);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div1, t1);
    			append_dev(div1, i);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, form);
    			append_dev(form, label);
    			append_dev(label, h1);
    			append_dev(label, t6);
    			append_dev(label, input);
    			set_input_value(input, /*eventName*/ ctx[2]);
    			append_dev(form, t7);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(i, "click", /*click_handler_2*/ ctx[8], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    					listen_dev(form, "submit", prevent_default(/*handleEvent*/ ctx[3]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*eventName*/ 4 && input.value !== /*eventName*/ ctx[2]) {
    				set_input_value(input, /*eventName*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(62:0) {#if eventStart == true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t3;
    	let td1;
    	let t5;
    	let tbody;
    	let promise;
    	let t6;
    	let button;
    	let t8;
    	let if_block_anchor;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$5,
    		then: create_then_block$5,
    		catch: create_catch_block$5,
    		value: 10
    	};

    	handle_promise(promise = /*eventsPromise*/ ctx[0], info);
    	let if_block = /*eventStart*/ ctx[1] == true && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Meus eventos";
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			td0.textContent = "EVENTO";
    			t3 = space();
    			td1 = element("td");
    			td1.textContent = "EXCLUIR";
    			t5 = space();
    			tbody = element("tbody");
    			info.block.c();
    			t6 = space();
    			button = element("button");
    			button.textContent = "Novo Evento";
    			t8 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h2, "class", "title svelte-1fpua8u");
    			set_style(h2, "text-align", "center");
    			add_location(h2, file$6, 35, 2, 916);
    			add_location(td0, file$6, 39, 8, 1073);
    			add_location(td1, file$6, 40, 8, 1097);
    			set_style(tr, "justify-content", "space-between");
    			add_location(tr, file$6, 38, 6, 1022);
    			add_location(thead, file$6, 37, 4, 1008);
    			add_location(tbody, file$6, 43, 4, 1143);
    			attr_dev(table, "class", "table");
    			add_location(table, file$6, 36, 2, 982);
    			attr_dev(button, "class", "custom-button");
    			set_style(button, "margin-left", "450px");
    			set_style(button, "margin-top", "30px");
    			add_location(button, file$6, 58, 2, 1543);
    			attr_dev(div, "class", "events svelte-1fpua8u");
    			add_location(div, file$6, 34, 0, 893);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(table, t5);
    			append_dev(table, tbody);
    			info.block.m(tbody, info.anchor = null);
    			info.mount = () => tbody;
    			info.anchor = null;
    			append_dev(div, t6);
    			append_dev(div, button);
    			insert_dev(target, t8, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*eventsPromise*/ 1 && promise !== (promise = /*eventsPromise*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}

    			if (/*eventStart*/ ctx[1] == true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t8);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MyEvents', slots, []);
    	let { user } = $$props;
    	let eventsPromise = DataStorage.getByParams(`events/clients/${user.id}`);
    	let eventStart = false;
    	let eventName = "";

    	async function handleEvent() {
    		let res = await DataStorage.post('events', { 'nome': eventName, 'idCliente': user.id });

    		if (res.answer == "Success") {
    			alert('Sucesso!');
    			$$invalidate(1, eventStart = false);
    			$$invalidate(2, eventName = "");
    			$$invalidate(0, eventsPromise = DataStorage.getByParams(`events/clients/${user.id}`));
    		}
    	}

    	async function deleteEvent(event) {
    		let res = await DataStorage.del(`events/delete/${event.id}`);
    		if (res.answer == "Success") $$invalidate(0, eventsPromise = eventsPromise.then(events => events.filter(filterEvent => filterEvent.id != event.id)));
    	}

    	const writable_props = ['user'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MyEvents> was created with unknown prop '${key}'`);
    	});

    	const click_handler = event => deleteEvent(event);
    	const click_handler_1 = () => $$invalidate(1, eventStart = true);
    	const click_handler_2 = () => $$invalidate(1, eventStart = false);

    	function input_input_handler() {
    		eventName = this.value;
    		$$invalidate(2, eventName);
    	}

    	$$self.$$set = $$props => {
    		if ('user' in $$props) $$invalidate(5, user = $$props.user);
    	};

    	$$self.$capture_state = () => ({
    		DataStorage,
    		user,
    		eventsPromise,
    		eventStart,
    		eventName,
    		handleEvent,
    		deleteEvent
    	});

    	$$self.$inject_state = $$props => {
    		if ('user' in $$props) $$invalidate(5, user = $$props.user);
    		if ('eventsPromise' in $$props) $$invalidate(0, eventsPromise = $$props.eventsPromise);
    		if ('eventStart' in $$props) $$invalidate(1, eventStart = $$props.eventStart);
    		if ('eventName' in $$props) $$invalidate(2, eventName = $$props.eventName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		eventsPromise,
    		eventStart,
    		eventName,
    		handleEvent,
    		deleteEvent,
    		user,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		input_input_handler
    	];
    }

    class MyEvents extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { user: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MyEvents",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*user*/ ctx[5] === undefined && !('user' in props)) {
    			console.warn("<MyEvents> was created without expected prop 'user'");
    		}
    	}

    	get user() {
    		throw new Error("<MyEvents>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set user(value) {
    		throw new Error("<MyEvents>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/workerPages/seeBooking.svelte generated by Svelte v3.48.0 */
    const file$5 = "src/workerPages/seeBooking.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_catch_block$4(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$4.name,
    		type: "catch",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (38:43)          {#each booking as booked}
    function create_then_block$4(ctx) {
    	let each_1_anchor;
    	let each_value = /*booking*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block$5(ctx);
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();

    			if (each_1_else) {
    				each_1_else.c();
    			}
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*handleApproved, bookingsPromise*/ 3) {
    				each_value = /*booking*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block$5(ctx);
    					each_1_else.c();
    					each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$4.name,
    		type: "then",
    		source: "(38:43)          {#each booking as booked}",
    		ctx
    	});

    	return block;
    }

    // (49:10) {:else}
    function create_else_block$5(ctx) {
    	let tr;
    	let td;
    	let t1;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			td.textContent = "Nenhuma reserva disponível";
    			t1 = space();
    			attr_dev(td, "colspan", "7");
    			set_style(td, "text-align", "center");
    			add_location(td, file$5, 50, 12, 1573);
    			add_location(tr, file$5, 49, 10, 1556);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(tr, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(49:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (39:8) {#each booking as booked}
    function create_each_block$5(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*booked*/ ctx[5].data.replace('T', ' ').replace('Z', '').substr(0, 10) + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*booked*/ ctx[5].horario + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*booked*/ ctx[5].modalidade + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*booked*/ ctx[5].nome + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = (/*booked*/ ctx[5].recorrente == false ? 'Não' : 'Sim') + "";
    	let t8;
    	let t9;
    	let td5;

    	let t10_value = (/*booked*/ ctx[5].status == 'approved'
    	? 'Aprovado'
    	: 'Pendente') + "";

    	let t10;
    	let t11;
    	let td6;
    	let button;

    	let t12_value = (/*booked*/ ctx[5].status == 'approved'
    	? 'Desaprovar'
    	: 'Aprovar') + "";

    	let t12;
    	let t13;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*booked*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td6 = element("td");
    			button = element("button");
    			t12 = text(t12_value);
    			t13 = space();
    			add_location(td0, file$5, 40, 12, 1053);
    			add_location(td1, file$5, 41, 12, 1134);
    			add_location(td2, file$5, 42, 12, 1172);
    			add_location(td3, file$5, 43, 12, 1213);
    			add_location(td4, file$5, 44, 12, 1248);
    			add_location(td5, file$5, 45, 12, 1314);
    			add_location(button, file$5, 46, 16, 1395);
    			add_location(td6, file$5, 46, 12, 1391);
    			add_location(tr, file$5, 39, 10, 1036);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td6);
    			append_dev(td6, button);
    			append_dev(button, t12);
    			append_dev(tr, t13);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*bookingsPromise*/ 1 && t0_value !== (t0_value = /*booked*/ ctx[5].data.replace('T', ' ').replace('Z', '').substr(0, 10) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*bookingsPromise*/ 1 && t2_value !== (t2_value = /*booked*/ ctx[5].horario + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*bookingsPromise*/ 1 && t4_value !== (t4_value = /*booked*/ ctx[5].modalidade + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*bookingsPromise*/ 1 && t6_value !== (t6_value = /*booked*/ ctx[5].nome + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*bookingsPromise*/ 1 && t8_value !== (t8_value = (/*booked*/ ctx[5].recorrente == false ? 'Não' : 'Sim') + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*bookingsPromise*/ 1 && t10_value !== (t10_value = (/*booked*/ ctx[5].status == 'approved'
    			? 'Aprovado'
    			: 'Pendente') + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*bookingsPromise*/ 1 && t12_value !== (t12_value = (/*booked*/ ctx[5].status == 'approved'
    			? 'Desaprovar'
    			: 'Aprovar') + "")) set_data_dev(t12, t12_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(39:8) {#each booking as booked}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_pending_block$4(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$4.name,
    		type: "pending",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t3;
    	let td1;
    	let t5;
    	let td2;
    	let t7;
    	let td3;
    	let t9;
    	let td4;
    	let t11;
    	let td5;
    	let t13;
    	let td6;
    	let t15;
    	let tbody;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$4,
    		then: create_then_block$4,
    		catch: create_catch_block$4,
    		value: 4
    	};

    	handle_promise(promise = /*bookingsPromise*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Todas as reservas";
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			td0.textContent = "DATA";
    			t3 = space();
    			td1 = element("td");
    			td1.textContent = "HORARIO";
    			t5 = space();
    			td2 = element("td");
    			td2.textContent = "MODALIDADES";
    			t7 = space();
    			td3 = element("td");
    			td3.textContent = "BLOCO";
    			t9 = space();
    			td4 = element("td");
    			td4.textContent = "RECORRÊNCIA";
    			t11 = space();
    			td5 = element("td");
    			td5.textContent = "STATUS";
    			t13 = space();
    			td6 = element("td");
    			td6.textContent = "APROVAÇÃO";
    			t15 = space();
    			tbody = element("tbody");
    			info.block.c();
    			attr_dev(h2, "class", "title svelte-1bjxly0");
    			set_style(h2, "text-align", "center");
    			add_location(h2, file$5, 23, 2, 616);
    			add_location(td0, file$5, 27, 8, 740);
    			add_location(td1, file$5, 28, 8, 762);
    			add_location(td2, file$5, 29, 8, 787);
    			add_location(td3, file$5, 30, 8, 816);
    			add_location(td4, file$5, 31, 8, 839);
    			add_location(td5, file$5, 32, 8, 868);
    			add_location(td6, file$5, 33, 8, 892);
    			add_location(tr, file$5, 26, 6, 727);
    			add_location(thead, file$5, 25, 4, 713);
    			add_location(tbody, file$5, 36, 4, 940);
    			attr_dev(table, "class", "table");
    			add_location(table, file$5, 24, 2, 687);
    			attr_dev(div, "class", "booking flex-column svelte-1bjxly0");
    			add_location(div, file$5, 22, 0, 580);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(tr, t9);
    			append_dev(tr, td4);
    			append_dev(tr, t11);
    			append_dev(tr, td5);
    			append_dev(tr, t13);
    			append_dev(tr, td6);
    			append_dev(table, t15);
    			append_dev(table, tbody);
    			info.block.m(tbody, info.anchor = null);
    			info.mount = () => tbody;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*bookingsPromise*/ 1 && promise !== (promise = /*bookingsPromise*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SeeBooking', slots, []);
    	let bookingsPromise = DataStorage.get('appointments');
    	let { user } = $$props;

    	async function handleApproved(booking) {
    		let res = await DataStorage.put(`appointments/${booking.id}`, {
    			'status': booking.status == 'pending' ? 'approved' : 'pending',
    			'id': booking.id,
    			'idFuncionario': user.id
    		});

    		if (res.answer == 'Success') $$invalidate(0, bookingsPromise = DataStorage.get('appointments'));
    	}

    	const writable_props = ['user'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SeeBooking> was created with unknown prop '${key}'`);
    	});

    	const click_handler = booked => handleApproved(booked);

    	$$self.$$set = $$props => {
    		if ('user' in $$props) $$invalidate(2, user = $$props.user);
    	};

    	$$self.$capture_state = () => ({
    		DataStorage,
    		bookingsPromise,
    		user,
    		handleApproved
    	});

    	$$self.$inject_state = $$props => {
    		if ('bookingsPromise' in $$props) $$invalidate(0, bookingsPromise = $$props.bookingsPromise);
    		if ('user' in $$props) $$invalidate(2, user = $$props.user);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bookingsPromise, handleApproved, user, click_handler];
    }

    class SeeBooking extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { user: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SeeBooking",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*user*/ ctx[2] === undefined && !('user' in props)) {
    			console.warn("<SeeBooking> was created without expected prop 'user'");
    		}
    	}

    	get user() {
    		throw new Error("<SeeBooking>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set user(value) {
    		throw new Error("<SeeBooking>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/workerPages/seeEvents.svelte generated by Svelte v3.48.0 */
    const file$4 = "src/workerPages/seeEvents.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (1:0) <style>   .events{     position:relative;     margin-top: -50px;   }
    function create_catch_block$3(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(1:0) <style>   .events{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (26:40)          {#each events as event}
    function create_then_block$3(ctx) {
    	let each_1_anchor;
    	let each_value = /*events*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block$4(ctx);
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();

    			if (each_1_else) {
    				each_1_else.c();
    			}
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*eventsPromise*/ 1) {
    				each_value = /*events*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block$4(ctx);
    					each_1_else.c();
    					each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(26:40)          {#each events as event}",
    		ctx
    	});

    	return block;
    }

    // (32:10) {:else}
    function create_else_block$4(ctx) {
    	let tr;
    	let td;
    	let t1;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			td.textContent = "Nenhuma evento disponível";
    			t1 = space();
    			attr_dev(td, "colspan", "2");
    			set_style(td, "text-align", "center");
    			add_location(td, file$4, 33, 14, 732);
    			add_location(tr, file$4, 32, 12, 713);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(tr, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(32:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:8) {#each events as event}
    function create_each_block$4(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*event*/ ctx[2].data.replace('T', ' ').replace('Z', '').substr(0, 10) + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*event*/ ctx[2].nome + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			add_location(td0, file$4, 28, 12, 565);
    			add_location(td1, file$4, 29, 12, 645);
    			add_location(tr, file$4, 27, 10, 548);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(27:8) {#each events as event}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <style>   .events{     position:relative;     margin-top: -50px;   }
    function create_pending_block$3(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(1:0) <style>   .events{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t3;
    	let td1;
    	let t5;
    	let tbody;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		value: 1
    	};

    	handle_promise(/*eventsPromise*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Todos os Eventos";
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			td0.textContent = "DATA";
    			t3 = space();
    			td1 = element("td");
    			td1.textContent = "EVENTO";
    			t5 = space();
    			tbody = element("tbody");
    			info.block.c();
    			attr_dev(h2, "class", "title svelte-1fpua8u");
    			set_style(h2, "text-align", "center");
    			add_location(h2, file$4, 16, 2, 267);
    			add_location(td0, file$4, 20, 8, 390);
    			add_location(td1, file$4, 21, 8, 412);
    			add_location(tr, file$4, 19, 6, 377);
    			add_location(thead, file$4, 18, 4, 363);
    			add_location(tbody, file$4, 24, 4, 457);
    			attr_dev(table, "class", "table");
    			add_location(table, file$4, 17, 2, 337);
    			attr_dev(div, "class", "events svelte-1fpua8u");
    			add_location(div, file$4, 15, 0, 244);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(table, t5);
    			append_dev(table, tbody);
    			info.block.m(tbody, info.anchor = null);
    			info.mount = () => tbody;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SeeEvents', slots, []);
    	let eventsPromise = DataStorage.get('events');
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SeeEvents> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ DataStorage, eventsPromise });

    	$$self.$inject_state = $$props => {
    		if ('eventsPromise' in $$props) $$invalidate(0, eventsPromise = $$props.eventsPromise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [eventsPromise];
    }

    class SeeEvents extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SeeEvents",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/workerPages/seeClients.svelte generated by Svelte v3.48.0 */
    const file$3 = "src/workerPages/seeClients.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (1:0) <style>   .events{     position:relative;     margin-top: -50px;   }
    function create_catch_block$2(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(1:0) <style>   .events{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (34:42)          {#each clients as client}
    function create_then_block$2(ctx) {
    	let each_1_anchor;
    	let each_value = /*clients*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block$3(ctx);
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();

    			if (each_1_else) {
    				each_1_else.c();
    			}
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*removeClient, clientsPromise*/ 3) {
    				each_value = /*clients*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block$3(ctx);
    					each_1_else.c();
    					each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(34:42)          {#each clients as client}",
    		ctx
    	});

    	return block;
    }

    // (42:10) {:else}
    function create_else_block$3(ctx) {
    	let tr;
    	let td;
    	let t1;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			td.textContent = "Nenhuma cliente disponível";
    			t1 = space();
    			attr_dev(td, "colspan", "4");
    			set_style(td, "text-align", "center");
    			add_location(td, file$3, 43, 14, 1067);
    			add_location(tr, file$3, 42, 12, 1048);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(tr, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(42:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:8) {#each clients as client}
    function create_each_block$3(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*client*/ ctx[4].nome + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*client*/ ctx[4].cpf + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*client*/ ctx[4].endereco + "";
    	let t4;
    	let t5;
    	let td3;
    	let button;
    	let t7;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*client*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			button = element("button");
    			button.textContent = "Remover";
    			t7 = space();
    			add_location(td0, file$3, 36, 12, 824);
    			add_location(td1, file$3, 37, 12, 859);
    			add_location(td2, file$3, 38, 12, 893);
    			add_location(button, file$3, 39, 16, 936);
    			add_location(td3, file$3, 39, 12, 932);
    			add_location(tr, file$3, 35, 10, 807);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, button);
    			append_dev(tr, t7);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*clientsPromise*/ 1 && t0_value !== (t0_value = /*client*/ ctx[4].nome + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*clientsPromise*/ 1 && t2_value !== (t2_value = /*client*/ ctx[4].cpf + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*clientsPromise*/ 1 && t4_value !== (t4_value = /*client*/ ctx[4].endereco + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(35:8) {#each clients as client}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <style>   .events{     position:relative;     margin-top: -50px;   }
    function create_pending_block$2(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(1:0) <style>   .events{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t3;
    	let td1;
    	let t5;
    	let td2;
    	let t7;
    	let td3;
    	let t9;
    	let tbody;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 3
    	};

    	handle_promise(promise = /*clientsPromise*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Todos os Clientes";
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			td0.textContent = "NOME";
    			t3 = space();
    			td1 = element("td");
    			td1.textContent = "CPF";
    			t5 = space();
    			td2 = element("td");
    			td2.textContent = "ENDERECO";
    			t7 = space();
    			td3 = element("td");
    			td3.textContent = "REMOVER";
    			t9 = space();
    			tbody = element("tbody");
    			info.block.c();
    			attr_dev(h2, "class", "title svelte-1fpua8u");
    			set_style(h2, "text-align", "center");
    			add_location(h2, file$3, 22, 2, 473);
    			add_location(td0, file$3, 26, 8, 597);
    			add_location(td1, file$3, 27, 8, 619);
    			add_location(td2, file$3, 28, 8, 640);
    			add_location(td3, file$3, 29, 8, 666);
    			add_location(tr, file$3, 25, 6, 584);
    			add_location(thead, file$3, 24, 4, 570);
    			add_location(tbody, file$3, 32, 4, 712);
    			attr_dev(table, "class", "table");
    			add_location(table, file$3, 23, 2, 544);
    			attr_dev(div, "class", "events svelte-1fpua8u");
    			add_location(div, file$3, 21, 0, 450);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(table, t9);
    			append_dev(table, tbody);
    			info.block.m(tbody, info.anchor = null);
    			info.mount = () => tbody;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*clientsPromise*/ 1 && promise !== (promise = /*clientsPromise*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SeeClients', slots, []);
    	let clientsPromise = DataStorage.get('clients');

    	async function removeClient(client) {
    		await DataStorage.del(`clients/delete/${client.id}`);
    		$$invalidate(0, clientsPromise = clientsPromise.then(clients => clients.filter(filterClient => filterClient.id != client.id)));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SeeClients> was created with unknown prop '${key}'`);
    	});

    	const click_handler = client => removeClient(client);

    	$$self.$capture_state = () => ({
    		DataStorage,
    		clientsPromise,
    		removeClient
    	});

    	$$self.$inject_state = $$props => {
    		if ('clientsPromise' in $$props) $$invalidate(0, clientsPromise = $$props.clientsPromise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [clientsPromise, removeClient, click_handler];
    }

    class SeeClients extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SeeClients",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/workerPages/seeWorkers.svelte generated by Svelte v3.48.0 */
    const file$2 = "src/workerPages/seeWorkers.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_catch_block$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (56:42)          {#each workers as worker}
    function create_then_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*workers*/ ctx[12];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block$2(ctx);
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();

    			if (each_1_else) {
    				each_1_else.c();
    			}
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*removeWorker, workersPromise*/ 17) {
    				each_value = /*workers*/ ctx[12];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block$2(ctx);
    					each_1_else.c();
    					each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(56:42)          {#each workers as worker}",
    		ctx
    	});

    	return block;
    }

    // (64:10) {:else}
    function create_else_block$2(ctx) {
    	let tr;
    	let td;
    	let t1;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			td.textContent = "Nenhuma funcionário disponível";
    			t1 = space();
    			attr_dev(td, "colspan", "7");
    			set_style(td, "text-align", "center");
    			add_location(td, file$2, 65, 12, 1541);
    			add_location(tr, file$2, 64, 10, 1524);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(tr, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(64:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (57:8) {#each workers as worker}
    function create_each_block$2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*worker*/ ctx[13].nome + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*worker*/ ctx[13].login + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*worker*/ ctx[13].cargo + "";
    	let t4;
    	let t5;
    	let td3;
    	let button;
    	let t7;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*worker*/ ctx[13]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			button = element("button");
    			button.textContent = "REMOVER";
    			t7 = space();
    			add_location(td0, file$2, 58, 12, 1303);
    			add_location(td1, file$2, 59, 12, 1338);
    			add_location(td2, file$2, 60, 12, 1374);
    			add_location(button, file$2, 61, 16, 1414);
    			add_location(td3, file$2, 61, 12, 1410);
    			add_location(tr, file$2, 57, 10, 1286);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, button);
    			append_dev(tr, t7);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*workersPromise*/ 1 && t0_value !== (t0_value = /*worker*/ ctx[13].nome + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*workersPromise*/ 1 && t2_value !== (t2_value = /*worker*/ ctx[13].login + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*workersPromise*/ 1 && t4_value !== (t4_value = /*worker*/ ctx[13].cargo + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(57:8) {#each workers as worker}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_pending_block$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block;
    }

    // (75:0) {#if workerStart == true}
    function create_if_block$2(ctx) {
    	let div5;
    	let div4;
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let i;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let form;
    	let label0;
    	let h10;
    	let t6;
    	let input0;
    	let t7;
    	let label1;
    	let h11;
    	let t9;
    	let input1;
    	let t10;
    	let label2;
    	let h12;
    	let t12;
    	let input2;
    	let t13;
    	let label3;
    	let h13;
    	let t15;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t19;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "RESERVAR";
    			t1 = space();
    			i = element("i");
    			i.textContent = "highlight_off";
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			form = element("form");
    			label0 = element("label");
    			h10 = element("h1");
    			h10.textContent = "LOGIN";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			label1 = element("label");
    			h11 = element("h1");
    			h11.textContent = "SENHA";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			label2 = element("label");
    			h12 = element("h1");
    			h12.textContent = "NOME";
    			t12 = space();
    			input2 = element("input");
    			t13 = space();
    			label3 = element("label");
    			h13 = element("h1");
    			h13.textContent = "CARGO";
    			t15 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "SERVIDOR";
    			option1 = element("option");
    			option1.textContent = "BOLSISTA";
    			option2 = element("option");
    			option2.textContent = "ADMINISTRADOR";
    			t19 = space();
    			button = element("button");
    			button.textContent = "SALVAR";
    			set_style(span, "color", "var(--main-color)");
    			set_style(span, "font-weight", "bold");
    			set_style(span, "font-size", "18px");
    			add_location(span, file$2, 78, 28, 2031);
    			attr_dev(div0, "class", "left");
    			add_location(div0, file$2, 78, 10, 2013);
    			attr_dev(i, "class", "material-icons right clickable");
    			add_location(i, file$2, 79, 10, 2133);
    			attr_dev(div1, "class", "dialog-section");
    			add_location(div1, file$2, 77, 6, 1974);
    			attr_dev(div2, "class", "hr");
    			add_location(div2, file$2, 81, 6, 2249);
    			add_location(h10, file$2, 85, 12, 2529);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Username");
    			input0.required = true;
    			add_location(input0, file$2, 86, 12, 2556);
    			attr_dev(label0, "class", "finput");
    			set_style(label0, "width", "350px");
    			add_location(label0, file$2, 84, 10, 2473);
    			add_location(h11, file$2, 89, 12, 2723);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "placeholder", "****");
    			input1.required = true;
    			add_location(input1, file$2, 90, 12, 2750);
    			attr_dev(label1, "class", "finput");
    			set_style(label1, "width", "350px");
    			add_location(label1, file$2, 88, 10, 2667);
    			add_location(h12, file$2, 93, 12, 2918);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "placeholder", "João da Silva");
    			input2.required = true;
    			add_location(input2, file$2, 94, 12, 2944);
    			attr_dev(label2, "class", "finput");
    			set_style(label2, "width", "350px");
    			add_location(label2, file$2, 92, 10, 2862);
    			add_location(h13, file$2, 97, 12, 3115);
    			option0.__value = 'Servidor';
    			option0.value = option0.__value;
    			add_location(option0, file$2, 99, 16, 3205);
    			option1.__value = 'Bolsista';
    			option1.value = option1.__value;
    			add_location(option1, file$2, 100, 16, 3266);
    			option2.__value = 'admin';
    			option2.value = option2.__value;
    			add_location(option2, file$2, 101, 16, 3327);
    			select.required = true;
    			if (/*newWorker*/ ctx[2].cargo === void 0) add_render_callback(() => /*select_change_handler*/ ctx[11].call(select));
    			add_location(select, file$2, 98, 12, 3142);
    			attr_dev(label3, "class", "finput");
    			set_style(label3, "width", "350px");
    			add_location(label3, file$2, 96, 10, 3060);
    			attr_dev(button, "class", "custom-button");
    			attr_dev(button, "type", "submit");
    			add_location(button, file$2, 104, 10, 3425);
    			attr_dev(form, "class", "field-form flex-column");
    			add_location(form, file$2, 83, 8, 2385);
    			attr_dev(div3, "class", "flex-column");
    			set_style(div3, "justify-content", "center");
    			set_style(div3, "align-items", "center");
    			set_style(div3, "padding", "60px 0 80px 0");
    			add_location(div3, file$2, 82, 6, 2278);
    			attr_dev(div4, "class", "dialog-container");
    			set_style(div4, "min-width", "1200px");
    			add_location(div4, file$2, 76, 2, 1910);
    			attr_dev(div5, "id", "login");
    			attr_dev(div5, "class", "fullscreen-faded");
    			set_style(div5, "z-index", "2 ");
    			add_location(div5, file$2, 75, 0, 1846);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div1, t1);
    			append_dev(div1, i);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, form);
    			append_dev(form, label0);
    			append_dev(label0, h10);
    			append_dev(label0, t6);
    			append_dev(label0, input0);
    			set_input_value(input0, /*newWorker*/ ctx[2].login);
    			append_dev(form, t7);
    			append_dev(form, label1);
    			append_dev(label1, h11);
    			append_dev(label1, t9);
    			append_dev(label1, input1);
    			set_input_value(input1, /*newWorker*/ ctx[2].senha);
    			append_dev(form, t10);
    			append_dev(form, label2);
    			append_dev(label2, h12);
    			append_dev(label2, t12);
    			append_dev(label2, input2);
    			set_input_value(input2, /*newWorker*/ ctx[2].nome);
    			append_dev(form, t13);
    			append_dev(form, label3);
    			append_dev(label3, h13);
    			append_dev(label3, t15);
    			append_dev(label3, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*newWorker*/ ctx[2].cargo);
    			append_dev(form, t19);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(i, "click", /*click_handler_2*/ ctx[7], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[10]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[11]),
    					listen_dev(form, "submit", prevent_default(/*handleWorker*/ ctx[3]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newWorker*/ 4 && input0.value !== /*newWorker*/ ctx[2].login) {
    				set_input_value(input0, /*newWorker*/ ctx[2].login);
    			}

    			if (dirty & /*newWorker*/ 4 && input1.value !== /*newWorker*/ ctx[2].senha) {
    				set_input_value(input1, /*newWorker*/ ctx[2].senha);
    			}

    			if (dirty & /*newWorker*/ 4 && input2.value !== /*newWorker*/ ctx[2].nome) {
    				set_input_value(input2, /*newWorker*/ ctx[2].nome);
    			}

    			if (dirty & /*newWorker*/ 4) {
    				select_option(select, /*newWorker*/ ctx[2].cargo);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(75:0) {#if workerStart == true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t3;
    	let td1;
    	let t5;
    	let td2;
    	let t7;
    	let td3;
    	let t9;
    	let tbody;
    	let promise;
    	let t10;
    	let button;
    	let t12;
    	let if_block_anchor;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 12
    	};

    	handle_promise(promise = /*workersPromise*/ ctx[0], info);
    	let if_block = /*workerStart*/ ctx[1] == true && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Todos os funcionários";
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			td0.textContent = "NOME";
    			t3 = space();
    			td1 = element("td");
    			td1.textContent = "LOGIN";
    			t5 = space();
    			td2 = element("td");
    			td2.textContent = "CARGO";
    			t7 = space();
    			td3 = element("td");
    			td3.textContent = "REMOVER";
    			t9 = space();
    			tbody = element("tbody");
    			info.block.c();
    			t10 = space();
    			button = element("button");
    			button.textContent = "Novo funcionário";
    			t12 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h2, "class", "title svelte-1bjxly0");
    			set_style(h2, "text-align", "center");
    			add_location(h2, file$2, 44, 2, 949);
    			add_location(td0, file$2, 48, 8, 1077);
    			add_location(td1, file$2, 49, 8, 1099);
    			add_location(td2, file$2, 50, 8, 1122);
    			add_location(td3, file$2, 51, 8, 1145);
    			add_location(tr, file$2, 47, 6, 1064);
    			add_location(thead, file$2, 46, 4, 1050);
    			add_location(tbody, file$2, 54, 4, 1191);
    			attr_dev(table, "class", "table");
    			add_location(table, file$2, 45, 2, 1024);
    			attr_dev(button, "class", "custom-button");
    			set_style(button, "margin-top", "30px");
    			add_location(button, file$2, 71, 2, 1698);
    			attr_dev(div, "class", "booking flex-column svelte-1bjxly0");
    			add_location(div, file$2, 43, 0, 913);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(table, t9);
    			append_dev(table, tbody);
    			info.block.m(tbody, info.anchor = null);
    			info.mount = () => tbody;
    			info.anchor = null;
    			append_dev(div, t10);
    			append_dev(div, button);
    			insert_dev(target, t12, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*workersPromise*/ 1 && promise !== (promise = /*workersPromise*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}

    			if (/*workerStart*/ ctx[1] == true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t12);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SeeWorkers', slots, []);
    	let workersPromise = DataStorage.get('workers');
    	let workerStart = false;

    	let newWorker = {
    		login: '',
    		senha: '',
    		nome: '',
    		cargo: ''
    	};

    	async function handleWorker() {
    		let res = await DataStorage.post('workers', newWorker);

    		if (res.answer == 'Success') {
    			alert('Sucesso!');

    			$$invalidate(2, newWorker = {
    				login: '',
    				senha: '',
    				nome: '',
    				cargo: 'SERVIDOR'
    			});

    			$$invalidate(1, workerStart = false);
    			$$invalidate(0, workersPromise = DataStorage.get('workers'));
    		}
    	}

    	async function removeWorker(worker) {
    		await DataStorage.del(`workers/delete/${worker.id}`);
    		$$invalidate(0, workersPromise = workersPromise.then(workers => workers.filter(filterWorker => filterWorker.id != worker.id)));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SeeWorkers> was created with unknown prop '${key}'`);
    	});

    	const click_handler = worker => removeWorker(worker);
    	const click_handler_1 = () => $$invalidate(1, workerStart = true);
    	const click_handler_2 = () => $$invalidate(1, workerStart = false);

    	function input0_input_handler() {
    		newWorker.login = this.value;
    		$$invalidate(2, newWorker);
    	}

    	function input1_input_handler() {
    		newWorker.senha = this.value;
    		$$invalidate(2, newWorker);
    	}

    	function input2_input_handler() {
    		newWorker.nome = this.value;
    		$$invalidate(2, newWorker);
    	}

    	function select_change_handler() {
    		newWorker.cargo = select_value(this);
    		$$invalidate(2, newWorker);
    	}

    	$$self.$capture_state = () => ({
    		DataStorage,
    		workersPromise,
    		workerStart,
    		newWorker,
    		handleWorker,
    		removeWorker
    	});

    	$$self.$inject_state = $$props => {
    		if ('workersPromise' in $$props) $$invalidate(0, workersPromise = $$props.workersPromise);
    		if ('workerStart' in $$props) $$invalidate(1, workerStart = $$props.workerStart);
    		if ('newWorker' in $$props) $$invalidate(2, newWorker = $$props.newWorker);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		workersPromise,
    		workerStart,
    		newWorker,
    		handleWorker,
    		removeWorker,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		select_change_handler
    	];
    }

    class SeeWorkers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SeeWorkers",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/workerPages/seeFieldsAndBlock.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;
    const file$1 = "src/workerPages/seeFieldsAndBlock.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_catch_block_2(ctx) {
    	const block_1 = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_catch_block_2.name,
    		type: "catch",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block_1;
    }

    // (55:40)          {#each fields as field}
    function create_then_block_1(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*fields*/ ctx[18];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_1_else = null;

    	if (!each_value_1.length) {
    		each_1_else = create_else_block$1(ctx);
    	}

    	const block_1 = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();

    			if (each_1_else) {
    				each_1_else.c();
    			}
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*removeField, fieldsPromise, blockPromise*/ 82) {
    				each_value_1 = /*fields*/ ctx[18];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;

    				if (!each_value_1.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value_1.length) {
    					each_1_else = create_else_block$1(ctx);
    					each_1_else.c();
    					each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(55:40)          {#each fields as field}",
    		ctx
    	});

    	return block_1;
    }

    // (64:10) {:else}
    function create_else_block$1(ctx) {
    	let tr;
    	let td;
    	let t1;

    	const block_1 = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			td.textContent = "Nenhuma quadra disponível";
    			t1 = space();
    			attr_dev(td, "colspan", "7");
    			set_style(td, "text-align", "center");
    			add_location(td, file$1, 65, 12, 1613);
    			add_location(tr, file$1, 64, 10, 1596);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(tr, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(64:10) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_catch_block_1(ctx) {
    	const block_1 = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block_1;
    }

    // (59:45)                <td>{blocks.find(block=>block.id = field.id).nome}
    function create_then_block_2(ctx) {
    	let td;
    	let t_value = /*blocks*/ ctx[14].find(func).nome + "";
    	let t;

    	function func(...args) {
    		return /*func*/ ctx[7](/*field*/ ctx[19], ...args);
    	}

    	const block_1 = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			add_location(td, file$1, 59, 14, 1395);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*fieldsPromise*/ 2 && t_value !== (t_value = /*blocks*/ ctx[14].find(func).nome + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_then_block_2.name,
    		type: "then",
    		source: "(59:45)                <td>{blocks.find(block=>block.id = field.id).nome}",
    		ctx
    	});

    	return block_1;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_pending_block_2(ctx) {
    	const block_1 = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_pending_block_2.name,
    		type: "pending",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block_1;
    }

    // (56:8) {#each fields as field}
    function create_each_block_1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*field*/ ctx[19].modalidade + "";
    	let t0;
    	let t1;
    	let t2;
    	let td1;
    	let button;
    	let t4;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_2,
    		then: create_then_block_2,
    		catch: create_catch_block_1,
    		value: 14
    	};

    	handle_promise(/*blockPromise*/ ctx[4], info);

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*field*/ ctx[19]);
    	}

    	const block_1 = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			info.block.c();
    			t2 = space();
    			td1 = element("td");
    			button = element("button");
    			button.textContent = "REMOVER";
    			t4 = space();
    			add_location(td0, file$1, 57, 12, 1307);
    			add_location(button, file$1, 61, 16, 1488);
    			add_location(td1, file$1, 61, 12, 1484);
    			add_location(tr, file$1, 56, 10, 1290);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			info.block.m(tr, info.anchor = null);
    			info.mount = () => tr;
    			info.anchor = t2;
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, button);
    			append_dev(tr, t4);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*fieldsPromise*/ 2 && t0_value !== (t0_value = /*field*/ ctx[19].modalidade + "")) set_data_dev(t0, t0_value);
    			update_await_block_branch(info, ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			info.block.d();
    			info.token = null;
    			info = null;
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(56:8) {#each fields as field}",
    		ctx
    	});

    	return block_1;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_pending_block_1(ctx) {
    	const block_1 = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block_1;
    }

    // (75:0) {#if fieldStart == true}
    function create_if_block$1(ctx) {
    	let div5;
    	let div4;
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let i;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let form;
    	let label0;
    	let h10;
    	let t6;
    	let input;
    	let t7;
    	let button0;
    	let t9;
    	let label1;
    	let h11;
    	let t11;
    	let select;
    	let t12;
    	let button1;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 14
    	};

    	handle_promise(/*blockPromise*/ ctx[4], info);

    	const block_1 = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "RESERVAR";
    			t1 = space();
    			i = element("i");
    			i.textContent = "highlight_off";
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			form = element("form");
    			label0 = element("label");
    			h10 = element("h1");
    			h10.textContent = "MODALIDADES";
    			t6 = space();
    			input = element("input");
    			t7 = space();
    			button0 = element("button");
    			button0.textContent = "Adicionar";
    			t9 = space();
    			label1 = element("label");
    			h11 = element("h1");
    			h11.textContent = "BLOCO";
    			t11 = space();
    			select = element("select");
    			info.block.c();
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "SALVAR";
    			set_style(span, "color", "var(--main-color)");
    			set_style(span, "font-weight", "bold");
    			set_style(span, "font-size", "18px");
    			add_location(span, file$1, 78, 28, 2091);
    			attr_dev(div0, "class", "left");
    			add_location(div0, file$1, 78, 10, 2073);
    			attr_dev(i, "class", "material-icons right clickable");
    			add_location(i, file$1, 79, 10, 2193);
    			attr_dev(div1, "class", "dialog-section");
    			add_location(div1, file$1, 77, 6, 2034);
    			attr_dev(div2, "class", "hr");
    			add_location(div2, file$1, 81, 6, 2308);
    			add_location(h10, file$1, 85, 12, 2587);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "FUTSAL");
    			add_location(input, file$1, 86, 12, 2620);
    			add_location(button0, file$1, 87, 12, 2702);
    			attr_dev(label0, "class", "finput");
    			set_style(label0, "width", "350px");
    			add_location(label0, file$1, 84, 10, 2531);
    			add_location(h11, file$1, 90, 12, 2931);
    			select.required = true;
    			if (/*newField*/ ctx[0].idBloco === void 0) add_render_callback(() => /*select_change_handler*/ ctx[13].call(select));
    			add_location(select, file$1, 91, 12, 2958);
    			attr_dev(label1, "class", "finput");
    			set_style(label1, "width", "350px");
    			add_location(label1, file$1, 89, 10, 2876);
    			attr_dev(button1, "class", "custom-button");
    			attr_dev(button1, "type", "submit");
    			add_location(button1, file$1, 99, 10, 3259);
    			attr_dev(form, "class", "field-form flex-column");
    			add_location(form, file$1, 83, 8, 2444);
    			attr_dev(div3, "class", "flex-column");
    			set_style(div3, "justify-content", "center");
    			set_style(div3, "align-items", "center");
    			set_style(div3, "padding", "60px 0 80px 0");
    			add_location(div3, file$1, 82, 6, 2337);
    			attr_dev(div4, "class", "dialog-container");
    			set_style(div4, "min-width", "1200px");
    			add_location(div4, file$1, 76, 2, 1970);
    			attr_dev(div5, "id", "login");
    			attr_dev(div5, "class", "fullscreen-faded");
    			set_style(div5, "z-index", "2 ");
    			add_location(div5, file$1, 75, 0, 1906);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div1, t1);
    			append_dev(div1, i);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, form);
    			append_dev(form, label0);
    			append_dev(label0, h10);
    			append_dev(label0, t6);
    			append_dev(label0, input);
    			set_input_value(input, /*sportVariable*/ ctx[3]);
    			append_dev(label0, t7);
    			append_dev(label0, button0);
    			append_dev(form, t9);
    			append_dev(form, label1);
    			append_dev(label1, h11);
    			append_dev(label1, t11);
    			append_dev(label1, select);
    			info.block.m(select, info.anchor = null);
    			info.mount = () => select;
    			info.anchor = null;
    			select_option(select, /*newField*/ ctx[0].idBloco);
    			append_dev(form, t12);
    			append_dev(form, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(i, "click", /*click_handler_2*/ ctx[10], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[11]),
    					listen_dev(button0, "click", /*click_handler_3*/ ctx[12], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[13]),
    					listen_dev(form, "submit", prevent_default(/*handleSport*/ ctx[5]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*sportVariable*/ 8 && input.value !== /*sportVariable*/ ctx[3]) {
    				set_input_value(input, /*sportVariable*/ ctx[3]);
    			}

    			update_await_block_branch(info, ctx, dirty);

    			if (dirty & /*newField, blockPromise*/ 17) {
    				select_option(select, /*newField*/ ctx[0].idBloco);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			info.block.d();
    			info.token = null;
    			info = null;
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(75:0) {#if fieldStart == true}",
    		ctx
    	});

    	return block_1;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_catch_block(ctx) {
    	const block_1 = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block_1;
    }

    // (93:48)                  {#each blocks as block }
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*blocks*/ ctx[14];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block_1 = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*blockPromise*/ 16) {
    				each_value = /*blocks*/ ctx[14];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_then_block.name,
    		type: "then",
    		source: "(93:48)                  {#each blocks as block }",
    		ctx
    	});

    	return block_1;
    }

    // (94:16) {#each blocks as block }
    function create_each_block$1(ctx) {
    	let option;
    	let t_value = /*block*/ ctx[15].nome + "";
    	let t;

    	const block_1 = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*block*/ ctx[15].id;
    			option.value = option.__value;
    			add_location(option, file$1, 94, 18, 3114);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(94:16) {#each blocks as block }",
    		ctx
    	});

    	return block_1;
    }

    // (1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }
    function create_pending_block(ctx) {
    	const block_1 = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(1:0) <style>   .booking{     position:relative;     margin-top: -50px;   }",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t3;
    	let td1;
    	let t5;
    	let td2;
    	let t7;
    	let tbody;
    	let promise;
    	let t8;
    	let button;
    	let t10;
    	let if_block_anchor;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block_2,
    		value: 18
    	};

    	handle_promise(promise = /*fieldsPromise*/ ctx[1], info);
    	let if_block = /*fieldStart*/ ctx[2] == true && create_if_block$1(ctx);

    	const block_1 = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Todos as Quadras";
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			td0.textContent = "MODALIDADES";
    			t3 = space();
    			td1 = element("td");
    			td1.textContent = "BLOCO";
    			t5 = space();
    			td2 = element("td");
    			td2.textContent = "REMOVER";
    			t7 = space();
    			tbody = element("tbody");
    			info.block.c();
    			t8 = space();
    			button = element("button");
    			button.textContent = "Nova Quadra";
    			t10 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h2, "class", "title svelte-1bjxly0");
    			set_style(h2, "text-align", "center");
    			add_location(h2, file$1, 44, 2, 978);
    			add_location(td0, file$1, 48, 8, 1101);
    			add_location(td1, file$1, 49, 8, 1130);
    			add_location(td2, file$1, 50, 8, 1153);
    			add_location(tr, file$1, 47, 6, 1088);
    			add_location(thead, file$1, 46, 4, 1074);
    			add_location(tbody, file$1, 53, 4, 1199);
    			attr_dev(table, "class", "table");
    			add_location(table, file$1, 45, 2, 1048);
    			attr_dev(button, "class", "custom-button");
    			set_style(button, "margin-top", "30px");
    			add_location(button, file$1, 71, 2, 1765);
    			attr_dev(div, "class", "booking flex-column svelte-1bjxly0");
    			add_location(div, file$1, 43, 0, 942);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(table, t7);
    			append_dev(table, tbody);
    			info.block.m(tbody, info.anchor = null);
    			info.mount = () => tbody;
    			info.anchor = null;
    			append_dev(div, t8);
    			append_dev(div, button);
    			insert_dev(target, t10, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*fieldsPromise*/ 2 && promise !== (promise = /*fieldsPromise*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}

    			if (/*fieldStart*/ ctx[2] == true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t10);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SeeFieldsAndBlock', slots, []);
    	let fieldsPromise = DataStorage.get('fields/all');
    	let blockPromise = DataStorage.get('blocks');
    	let fieldStart = false;
    	let sportVariable = '';
    	let newField = { modalidade: [], idBloco: '' };

    	async function handleSport() {
    		let res = await DataStorage.post('fields', newField);

    		if (res.answer == 'Success') {
    			alert('Sucesso!');
    			$$invalidate(0, newField = { modalidade: [], idBloco: '' });
    			$$invalidate(1, fieldsPromise = DataStorage.get('fields/all'));
    			$$invalidate(2, fieldStart = false);
    		}
    	}

    	async function removeField(field) {
    		await DataStorage.del(`fields/delete/${field.id}`);
    		$$invalidate(1, fieldsPromise = fieldsPromise.then(fields => fields.filter(filterField => filterField.id != field.id)));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<SeeFieldsAndBlock> was created with unknown prop '${key}'`);
    	});

    	const func = (field, block) => block.id = field.id;
    	const click_handler = field => removeField(field);
    	const click_handler_1 = () => $$invalidate(2, fieldStart = true);
    	const click_handler_2 = () => $$invalidate(2, fieldStart = false);

    	function input_input_handler() {
    		sportVariable = this.value;
    		$$invalidate(3, sportVariable);
    	}

    	const click_handler_3 = () => {
    		(newField.modalidade.push(sportVariable), $$invalidate(0, newField), $$invalidate(3, sportVariable = ''));
    	};

    	function select_change_handler() {
    		newField.idBloco = select_value(this);
    		$$invalidate(0, newField);
    		$$invalidate(4, blockPromise);
    	}

    	$$self.$capture_state = () => ({
    		DataStorage,
    		fieldsPromise,
    		blockPromise,
    		fieldStart,
    		sportVariable,
    		newField,
    		handleSport,
    		removeField
    	});

    	$$self.$inject_state = $$props => {
    		if ('fieldsPromise' in $$props) $$invalidate(1, fieldsPromise = $$props.fieldsPromise);
    		if ('blockPromise' in $$props) $$invalidate(4, blockPromise = $$props.blockPromise);
    		if ('fieldStart' in $$props) $$invalidate(2, fieldStart = $$props.fieldStart);
    		if ('sportVariable' in $$props) $$invalidate(3, sportVariable = $$props.sportVariable);
    		if ('newField' in $$props) $$invalidate(0, newField = $$props.newField);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*newField*/ 1) {
    			console.log(newField);
    		}
    	};

    	return [
    		newField,
    		fieldsPromise,
    		fieldStart,
    		sportVariable,
    		blockPromise,
    		handleSport,
    		removeField,
    		func,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		input_input_handler,
    		click_handler_3,
    		select_change_handler
    	];
    }

    class SeeFieldsAndBlock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SeeFieldsAndBlock",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    // (112:44) 
    function create_if_block_11(ctx) {
    	let seefieldsandblock;
    	let current;
    	seefieldsandblock = new SeeFieldsAndBlock({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(seefieldsandblock.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(seefieldsandblock, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(seefieldsandblock.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(seefieldsandblock.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(seefieldsandblock, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(112:44) ",
    		ctx
    	});

    	return block;
    }

    // (110:45) 
    function create_if_block_10(ctx) {
    	let seeworkers;
    	let current;
    	seeworkers = new SeeWorkers({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(seeworkers.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(seeworkers, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(seeworkers.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(seeworkers.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(seeworkers, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(110:45) ",
    		ctx
    	});

    	return block;
    }

    // (108:45) 
    function create_if_block_9(ctx) {
    	let seeclients;
    	let current;
    	seeclients = new SeeClients({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(seeclients.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(seeclients, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(seeclients.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(seeclients.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(seeclients, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(108:45) ",
    		ctx
    	});

    	return block;
    }

    // (106:44) 
    function create_if_block_8(ctx) {
    	let seeevents;
    	let current;
    	seeevents = new SeeEvents({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(seeevents.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(seeevents, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(seeevents.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(seeevents.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(seeevents, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(106:44) ",
    		ctx
    	});

    	return block;
    }

    // (104:45) 
    function create_if_block_7(ctx) {
    	let seebooking;
    	let current;

    	seebooking = new SeeBooking({
    			props: { user: /*user*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(seebooking.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(seebooking, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const seebooking_changes = {};
    			if (dirty & /*user*/ 32) seebooking_changes.user = /*user*/ ctx[5];
    			seebooking.$set(seebooking_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(seebooking.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(seebooking.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(seebooking, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(104:45) ",
    		ctx
    	});

    	return block;
    }

    // (102:43) 
    function create_if_block_6(ctx) {
    	let myevents;
    	let current;

    	myevents = new MyEvents({
    			props: { user: /*user*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(myevents.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(myevents, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const myevents_changes = {};
    			if (dirty & /*user*/ 32) myevents_changes.user = /*user*/ ctx[5];
    			myevents.$set(myevents_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(myevents.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(myevents.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(myevents, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(102:43) ",
    		ctx
    	});

    	return block;
    }

    // (100:42) 
    function create_if_block_5(ctx) {
    	let booking;
    	let current;

    	booking = new Booking({
    			props: { user: /*user*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(booking.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(booking, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const booking_changes = {};
    			if (dirty & /*user*/ 32) booking_changes.user = /*user*/ ctx[5];
    			booking.$set(booking_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(booking.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(booking.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(booking, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(100:42) ",
    		ctx
    	});

    	return block;
    }

    // (98:41) 
    function create_if_block_4(ctx) {
    	let events;
    	let current;
    	events = new Events({ $$inline: true });
    	events.$on("handleLogin", /*handleLogin_handler_2*/ ctx[13]);

    	const block = {
    		c: function create() {
    			create_component(events.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(events, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(events.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(events.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(events, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(98:41) ",
    		ctx
    	});

    	return block;
    }

    // (96:40) 
    function create_if_block_3(ctx) {
    	let field;
    	let current;
    	field = new Field({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(field.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(field, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(field, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(96:40) ",
    		ctx
    	});

    	return block;
    }

    // (94:6) {#if headerOption == 'about'}
    function create_if_block_2(ctx) {
    	let about;
    	let current;
    	about = new About({ $$inline: true });
    	about.$on("handleLogin", /*handleLogin_handler_1*/ ctx[12]);

    	const block = {
    		c: function create() {
    			create_component(about.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(about, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(about, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(94:6) {#if headerOption == 'about'}",
    		ctx
    	});

    	return block;
    }

    // (118:0) {#if loginIn != false}
    function create_if_block(ctx) {
    	let div1;
    	let div0;

    	function select_block_type_1(ctx, dirty) {
    		if (/*loginType*/ ctx[2] == 'sign-up') return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if_block.c();
    			attr_dev(div0, "class", "dialog-container");
    			set_style(div0, "min-width", "1200px");
    			add_location(div0, file, 119, 2, 3347);
    			attr_dev(div1, "id", "login");
    			attr_dev(div1, "class", "fullscreen-faded");
    			set_style(div1, "z-index", "2 ");
    			add_location(div1, file, 118, 0, 3283);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if_block.m(div0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(118:0) {#if loginIn != false}",
    		ctx
    	});

    	return block;
    }

    // (156:6) {:else}
    function create_else_block(ctx) {
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let i;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let form;
    	let label0;
    	let h10;
    	let t6;
    	let input0;
    	let t7;
    	let label1;
    	let h11;
    	let t9;
    	let input1;
    	let t10;
    	let label2;
    	let h12;
    	let t12;
    	let select;
    	let t13;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*loginOption*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "ENTRAR";
    			t1 = space();
    			i = element("i");
    			i.textContent = "highlight_off";
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			form = element("form");
    			label0 = element("label");
    			h10 = element("h1");
    			h10.textContent = "CPF OU LOGIN";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			label1 = element("label");
    			h11 = element("h1");
    			h11.textContent = "SENHA";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			label2 = element("label");
    			h12 = element("h1");
    			h12.textContent = "TIPO";
    			t12 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			button = element("button");
    			button.textContent = "ENTRAR";
    			set_style(span, "color", "var(--main-color)");
    			set_style(span, "font-weight", "bold");
    			set_style(span, "font-size", "18px");
    			add_location(span, file, 157, 30, 5322);
    			attr_dev(div0, "class", "left");
    			add_location(div0, file, 157, 12, 5304);
    			attr_dev(i, "class", "material-icons right clickable");
    			add_location(i, file, 158, 12, 5424);
    			attr_dev(div1, "class", "dialog-section");
    			add_location(div1, file, 156, 10, 5263);
    			attr_dev(div2, "class", "hr");
    			add_location(div2, file, 160, 8, 5540);
    			add_location(h10, file, 164, 14, 5826);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "000.000.000-00");
    			input0.required = true;
    			add_location(input0, file, 165, 14, 5862);
    			attr_dev(label0, "class", "finput");
    			set_style(label0, "width", "350px");
    			add_location(label0, file, 163, 12, 5769);
    			add_location(h11, file, 168, 14, 6035);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "placeholder", "******");
    			input1.required = true;
    			add_location(input1, file, 169, 14, 6064);
    			attr_dev(label1, "class", "finput");
    			set_style(label1, "width", "350px");
    			add_location(label1, file, 167, 12, 5978);
    			add_location(h12, file, 172, 14, 6238);
    			select.required = true;
    			if (/*login*/ ctx[3].type === void 0) add_render_callback(() => /*select_change_handler*/ ctx[24].call(select));
    			add_location(select, file, 173, 14, 6266);
    			attr_dev(label2, "class", "finput");
    			set_style(label2, "width", "350px");
    			add_location(label2, file, 171, 12, 6181);
    			attr_dev(button, "class", "custom-button");
    			set_style(button, "margin-top", "30px");
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 179, 12, 6495);
    			attr_dev(form, "class", "field-form flex-column");
    			add_location(form, file, 162, 10, 5680);
    			attr_dev(div3, "class", "flex-column");
    			set_style(div3, "justify-content", "center");
    			set_style(div3, "align-items", "center");
    			set_style(div3, "padding", "60px 0 80px 0");
    			add_location(div3, file, 161, 8, 5571);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div1, t1);
    			append_dev(div1, i);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, form);
    			append_dev(form, label0);
    			append_dev(label0, h10);
    			append_dev(label0, t6);
    			append_dev(label0, input0);
    			set_input_value(input0, /*login*/ ctx[3].cpf);
    			append_dev(form, t7);
    			append_dev(form, label1);
    			append_dev(label1, h11);
    			append_dev(label1, t9);
    			append_dev(label1, input1);
    			set_input_value(input1, /*login*/ ctx[3].password);
    			append_dev(form, t10);
    			append_dev(form, label2);
    			append_dev(label2, h12);
    			append_dev(label2, t12);
    			append_dev(label2, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*login*/ ctx[3].type);
    			append_dev(form, t13);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(i, "click", /*click_handler_1*/ ctx[21], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[22]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[23]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[24]),
    					listen_dev(form, "submit", prevent_default(/*handleLogin*/ ctx[7]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*login, loginOption*/ 72 && input0.value !== /*login*/ ctx[3].cpf) {
    				set_input_value(input0, /*login*/ ctx[3].cpf);
    			}

    			if (dirty & /*login, loginOption*/ 72 && input1.value !== /*login*/ ctx[3].password) {
    				set_input_value(input1, /*login*/ ctx[3].password);
    			}

    			if (dirty & /*loginOption*/ 64) {
    				each_value = /*loginOption*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*login, loginOption*/ 72) {
    				select_option(select, /*login*/ ctx[3].type);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(156:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (121:4) {#if loginType == 'sign-up'}
    function create_if_block_1(ctx) {
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let i;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let form;
    	let label0;
    	let h10;
    	let t6;
    	let input0;
    	let t7;
    	let label1;
    	let h11;
    	let t9;
    	let input1;
    	let t10;
    	let label2;
    	let h12;
    	let t12;
    	let input2;
    	let t13;
    	let label3;
    	let h13;
    	let t15;
    	let input3;
    	let t16;
    	let label4;
    	let h14;
    	let t18;
    	let input4;
    	let t19;
    	let label5;
    	let h15;
    	let t21;
    	let input5;
    	let t22;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "CADASTRO";
    			t1 = space();
    			i = element("i");
    			i.textContent = "highlight_off";
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			form = element("form");
    			label0 = element("label");
    			h10 = element("h1");
    			h10.textContent = "CPF";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			label1 = element("label");
    			h11 = element("h1");
    			h11.textContent = "SENHA";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			label2 = element("label");
    			h12 = element("h1");
    			h12.textContent = "NOME";
    			t12 = space();
    			input2 = element("input");
    			t13 = space();
    			label3 = element("label");
    			h13 = element("h1");
    			h13.textContent = "IDADE";
    			t15 = space();
    			input3 = element("input");
    			t16 = space();
    			label4 = element("label");
    			h14 = element("h1");
    			h14.textContent = "OCUPAÇÃO";
    			t18 = space();
    			input4 = element("input");
    			t19 = space();
    			label5 = element("label");
    			h15 = element("h1");
    			h15.textContent = "ENDEREÇO";
    			t21 = space();
    			input5 = element("input");
    			t22 = space();
    			button = element("button");
    			button.textContent = "CADASTRAR";
    			set_style(span, "color", "var(--main-color)");
    			set_style(span, "font-weight", "bold");
    			set_style(span, "font-size", "18px");
    			add_location(span, file, 122, 28, 3501);
    			attr_dev(div0, "class", "left");
    			add_location(div0, file, 122, 10, 3483);
    			attr_dev(i, "class", "material-icons right clickable");
    			add_location(i, file, 123, 10, 3603);
    			attr_dev(div1, "class", "dialog-section");
    			add_location(div1, file, 121, 6, 3444);
    			attr_dev(div2, "class", "hr");
    			add_location(div2, file, 125, 6, 3715);
    			add_location(h10, file, 129, 12, 3994);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "000.000.000-00");
    			input0.required = true;
    			add_location(input0, file, 130, 12, 4019);
    			attr_dev(label0, "class", "finput");
    			set_style(label0, "width", "350px");
    			add_location(label0, file, 128, 10, 3939);
    			add_location(h11, file, 133, 12, 4188);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "placeholder", "******");
    			input1.required = true;
    			add_location(input1, file, 134, 12, 4215);
    			attr_dev(label1, "class", "finput");
    			set_style(label1, "width", "350px");
    			add_location(label1, file, 132, 10, 4133);
    			add_location(h12, file, 137, 12, 4382);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "placeholder", "João da Silva");
    			input2.required = true;
    			add_location(input2, file, 138, 12, 4408);
    			attr_dev(label2, "class", "finput");
    			set_style(label2, "width", "350px");
    			add_location(label2, file, 136, 10, 4327);
    			add_location(h13, file, 141, 12, 4577);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "placeholder", "18");
    			input3.required = true;
    			add_location(input3, file, 142, 12, 4604);
    			attr_dev(label3, "class", "finput");
    			set_style(label3, "width", "350px");
    			add_location(label3, file, 140, 10, 4522);
    			add_location(h14, file, 145, 12, 4763);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "placeholder", "Estudante");
    			input4.required = true;
    			add_location(input4, file, 146, 12, 4793);
    			attr_dev(label4, "class", "finput");
    			set_style(label4, "width", "350px");
    			add_location(label4, file, 144, 10, 4708);
    			add_location(h15, file, 149, 12, 4962);
    			attr_dev(input5, "type", "text");
    			attr_dev(input5, "placeholder", "Rua Paulo Malchitzki,100");
    			input5.required = true;
    			add_location(input5, file, 150, 12, 4992);
    			attr_dev(label5, "class", "finput");
    			set_style(label5, "width", "350px");
    			add_location(label5, file, 148, 10, 4907);
    			attr_dev(button, "class", "custom-button");
    			set_style(button, "margin-top", "30px");
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 152, 10, 5121);
    			attr_dev(form, "class", "field-form flex-column");
    			add_location(form, file, 127, 8, 3851);
    			attr_dev(div3, "class", "flex-column");
    			set_style(div3, "justify-content", "center");
    			set_style(div3, "align-items", "center");
    			set_style(div3, "padding", "60px 0 80px 0");
    			add_location(div3, file, 126, 6, 3744);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div1, t1);
    			append_dev(div1, i);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, form);
    			append_dev(form, label0);
    			append_dev(label0, h10);
    			append_dev(label0, t6);
    			append_dev(label0, input0);
    			set_input_value(input0, /*newUser*/ ctx[4].cpf);
    			append_dev(form, t7);
    			append_dev(form, label1);
    			append_dev(label1, h11);
    			append_dev(label1, t9);
    			append_dev(label1, input1);
    			set_input_value(input1, /*newUser*/ ctx[4].senha);
    			append_dev(form, t10);
    			append_dev(form, label2);
    			append_dev(label2, h12);
    			append_dev(label2, t12);
    			append_dev(label2, input2);
    			set_input_value(input2, /*newUser*/ ctx[4].nome);
    			append_dev(form, t13);
    			append_dev(form, label3);
    			append_dev(label3, h13);
    			append_dev(label3, t15);
    			append_dev(label3, input3);
    			set_input_value(input3, /*newUser*/ ctx[4].idade);
    			append_dev(form, t16);
    			append_dev(form, label4);
    			append_dev(label4, h14);
    			append_dev(label4, t18);
    			append_dev(label4, input4);
    			set_input_value(input4, /*newUser*/ ctx[4].ocupacao);
    			append_dev(form, t19);
    			append_dev(form, label5);
    			append_dev(label5, h15);
    			append_dev(label5, t21);
    			append_dev(label5, input5);
    			set_input_value(input5, /*newUser*/ ctx[4].endereco);
    			append_dev(form, t22);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(i, "click", /*click_handler*/ ctx[14], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[15]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[16]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[17]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[18]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[19]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[20]),
    					listen_dev(form, "submit", prevent_default(/*handleSignUp*/ ctx[8]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newUser*/ 16 && input0.value !== /*newUser*/ ctx[4].cpf) {
    				set_input_value(input0, /*newUser*/ ctx[4].cpf);
    			}

    			if (dirty & /*newUser*/ 16 && input1.value !== /*newUser*/ ctx[4].senha) {
    				set_input_value(input1, /*newUser*/ ctx[4].senha);
    			}

    			if (dirty & /*newUser*/ 16 && input2.value !== /*newUser*/ ctx[4].nome) {
    				set_input_value(input2, /*newUser*/ ctx[4].nome);
    			}

    			if (dirty & /*newUser*/ 16 && to_number(input3.value) !== /*newUser*/ ctx[4].idade) {
    				set_input_value(input3, /*newUser*/ ctx[4].idade);
    			}

    			if (dirty & /*newUser*/ 16 && input4.value !== /*newUser*/ ctx[4].ocupacao) {
    				set_input_value(input4, /*newUser*/ ctx[4].ocupacao);
    			}

    			if (dirty & /*newUser*/ 16 && input5.value !== /*newUser*/ ctx[4].endereco) {
    				set_input_value(input5, /*newUser*/ ctx[4].endereco);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(121:4) {#if loginType == 'sign-up'}",
    		ctx
    	});

    	return block;
    }

    // (175:16) {#each loginOption as option }
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[25] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*option*/ ctx[25];
    			option.value = option.__value;
    			add_location(option, file, 175, 18, 6373);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(175:16) {#each loginOption as option }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let t0;
    	let div;
    	let current_block_type_index;
    	let if_block0;
    	let t1;
    	let if_block1_anchor;
    	let current;

    	header = new Header({
    			props: { user: /*user*/ ctx[5] },
    			$$inline: true
    		});

    	header.$on("handleEvents", /*handleEvents_handler*/ ctx[10]);
    	header.$on("handleLogin", /*handleLogin_handler*/ ctx[11]);
    	header.$on("handleLogout", /*handleLogout*/ ctx[9]);

    	const if_block_creators = [
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_if_block_6,
    		create_if_block_7,
    		create_if_block_8,
    		create_if_block_9,
    		create_if_block_10,
    		create_if_block_11
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*headerOption*/ ctx[0] == 'about') return 0;
    		if (/*headerOption*/ ctx[0] == 'field') return 1;
    		if (/*headerOption*/ ctx[0] == 'events') return 2;
    		if (/*headerOption*/ ctx[0] == 'booking') return 3;
    		if (/*headerOption*/ ctx[0] == 'myevents') return 4;
    		if (/*headerOption*/ ctx[0] == 'seeBooking') return 5;
    		if (/*headerOption*/ ctx[0] == 'seeEvents') return 6;
    		if (/*headerOption*/ ctx[0] == 'seeClients') return 7;
    		if (/*headerOption*/ ctx[0] == 'seeWorkers') return 8;
    		if (/*headerOption*/ ctx[0] == 'seeFields') return 9;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	let if_block1 = /*loginIn*/ ctx[1] != false && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t0 = space();
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(div, "class", "root svelte-lwjmtc");
    			add_location(div, file, 92, 2, 2354);
    			add_location(main, file, 90, 0, 2197);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t0);
    			append_dev(main, div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			insert_dev(target, t1, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const header_changes = {};
    			if (dirty & /*user*/ 32) header_changes.user = /*user*/ ctx[5];
    			header.$set(header_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					} else {
    						if_block0.p(ctx, dirty);
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(div, null);
    				} else {
    					if_block0 = null;
    				}
    			}

    			if (/*loginIn*/ ctx[1] != false) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (detaching) detach_dev(t1);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let headerOption = 'about';
    	let loginIn = false;
    	let loginOption = ['Cliente', 'Funcionário'];
    	let loginType;
    	let login = { cpf: '', password: '', type: 'Cliente' };

    	let newUser = {
    		cpf: '',
    		senha: '',
    		nome: '',
    		idade: null,
    		ocupacao: '',
    		endereco: ''
    	};

    	let user;

    	async function handleLogin() {
    		let requestedUser;

    		if (login.type == 'Cliente') requestedUser = await DataStorage.get(`clients/login`, {
    			'cpf': login.cpf,
    			'senha': login.password
    		}); else requestedUser = await DataStorage.get(`workers/login`, {
    			'login': login.cpf,
    			'senha': login.password
    		});

    		if (requestedUser.length > 0) {
    			$$invalidate(5, user = requestedUser[0]);
    			alert('Sucesso!');

    			login.type == 'Cliente'
    			? $$invalidate(0, headerOption = 'booking')
    			: $$invalidate(0, headerOption = 'seeBooking');

    			$$invalidate(1, loginIn = false);
    		} else alert('Dados invalidos');
    	}

    	async function handleSignUp() {
    		let res = await DataStorage.post('clients', newUser);

    		if (res.answer == 'Success') {
    			alert('Sucesso!Faca o login');
    			$$invalidate(2, loginType = 'login');

    			$$invalidate(4, newUser = {
    				cpf: '',
    				senha: '',
    				nome: '',
    				idade: null,
    				ocupacao: '',
    				endereco: ''
    			});
    		}
    	}

    	async function handleLogout() {
    		$$invalidate(5, user = null);
    		$$invalidate(3, login.cpf = '', login);
    		($$invalidate(3, login.password = '', login), $$invalidate(3, login.type = 'Cliente', login));
    		$$invalidate(0, headerOption = 'about');
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const handleEvents_handler = e => {
    		$$invalidate(0, headerOption = e.detail);
    	};

    	const handleLogin_handler = e => {
    		$$invalidate(1, loginIn = e.detail);
    	};

    	const handleLogin_handler_1 = e => {
    		$$invalidate(1, loginIn = e.detail.status);
    		$$invalidate(2, loginType = e.detail.type);
    	};

    	const handleLogin_handler_2 = e => {
    		$$invalidate(1, loginIn = e.detail.status);
    		$$invalidate(2, loginType = e.detail.type);
    	};

    	const click_handler = () => $$invalidate(1, loginIn = false);

    	function input0_input_handler() {
    		newUser.cpf = this.value;
    		$$invalidate(4, newUser);
    	}

    	function input1_input_handler() {
    		newUser.senha = this.value;
    		$$invalidate(4, newUser);
    	}

    	function input2_input_handler() {
    		newUser.nome = this.value;
    		$$invalidate(4, newUser);
    	}

    	function input3_input_handler() {
    		newUser.idade = to_number(this.value);
    		$$invalidate(4, newUser);
    	}

    	function input4_input_handler() {
    		newUser.ocupacao = this.value;
    		$$invalidate(4, newUser);
    	}

    	function input5_input_handler() {
    		newUser.endereco = this.value;
    		$$invalidate(4, newUser);
    	}

    	const click_handler_1 = () => $$invalidate(1, loginIn = false);

    	function input0_input_handler_1() {
    		login.cpf = this.value;
    		$$invalidate(3, login);
    		$$invalidate(6, loginOption);
    	}

    	function input1_input_handler_1() {
    		login.password = this.value;
    		$$invalidate(3, login);
    		$$invalidate(6, loginOption);
    	}

    	function select_change_handler() {
    		login.type = select_value(this);
    		$$invalidate(3, login);
    		$$invalidate(6, loginOption);
    	}

    	$$self.$capture_state = () => ({
    		Header,
    		Field,
    		About,
    		Events,
    		Booking,
    		MyEvents,
    		SeeBooking,
    		SeeEvents,
    		SeeClients,
    		SeeWorkers,
    		SeeFieldsAndBlock,
    		DataStorage,
    		headerOption,
    		loginIn,
    		loginOption,
    		loginType,
    		login,
    		newUser,
    		user,
    		handleLogin,
    		handleSignUp,
    		handleLogout
    	});

    	$$self.$inject_state = $$props => {
    		if ('headerOption' in $$props) $$invalidate(0, headerOption = $$props.headerOption);
    		if ('loginIn' in $$props) $$invalidate(1, loginIn = $$props.loginIn);
    		if ('loginOption' in $$props) $$invalidate(6, loginOption = $$props.loginOption);
    		if ('loginType' in $$props) $$invalidate(2, loginType = $$props.loginType);
    		if ('login' in $$props) $$invalidate(3, login = $$props.login);
    		if ('newUser' in $$props) $$invalidate(4, newUser = $$props.newUser);
    		if ('user' in $$props) $$invalidate(5, user = $$props.user);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		headerOption,
    		loginIn,
    		loginType,
    		login,
    		newUser,
    		user,
    		loginOption,
    		handleLogin,
    		handleSignUp,
    		handleLogout,
    		handleEvents_handler,
    		handleLogin_handler,
    		handleLogin_handler_1,
    		handleLogin_handler_2,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		click_handler_1,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		select_change_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
