"use strict";

import {getJsonData} from "./json.js";

export {helper};

const helper = (() => {
    let result = {};
    const events = {};
    const eventListeners = {};
    const global = {};
    const globalDefault = {};
    const local = {};
    const localDefault = {};
    const localize = {
        languages: {},
        entries: {},
    };
    let localID = "";

    const defaultTrigger = (listeners, ev) => {
        for (const entry in listeners) {
            listeners[entry](ev);
        }
    };

    //// Basic Functions ////

    result.saveGlobalConfig = () => localStorage.setItem("globalConfig", JSON.stringify(global));
    result.saveLocalConfig = () => {
        if (localID !== "")
            localStorage.setItem(`localConfig_${localID}`, JSON.stringify(local));
    };
    result.loadGlobalConfig = () => {
        let storedSettings = localStorage.getItem("globalConfig");
        let settings = (!!storedSettings) ? JSON.parse(storedSettings) : {};
        for (let entry in globalDefault) {
            global[entry] = (settings[entry] !== undefined) ? settings[entry] : globalDefault[entry];
        }
        for (let entry in globalDefault) {
            let ev = {};
            ev[entry] = global[entry];
            result.triggerEvent(entry, ev);
        }
    };
    result.loadLocalConfig = () => {
        let storedSettings = localStorage.getItem(`localConfig_${localID}`);
        let settings = (!!storedSettings) ? JSON.parse(storedSettings) : {};
        for (let entry in localDefault) {
            local[entry] = (settings[entry] !== undefined) ? settings[entry] : localDefault[entry];
        }
        for (let entry in localDefault) {
            let ev = {};
            ev[entry] = local[entry];
            result.triggerEvent(entry, ev);
        }
    };

    result.setLocalID = (id) => {
        if (localID === "")
            localID = id;
    };

    result.addEvent = (eventID, onTrigger = defaultTrigger) => {
        events[eventID] = onTrigger;
        eventListeners[eventID] = {};
    };

    result.addEventListener = (eventID, listenerID, onTrigger = (res) => {
        console.debug(`"${listenerID}" captured event "${eventID}" with content "${res}"`);
    }) => {
        if (events[eventID] === undefined) {
            console.warn(`Event ${eventID} is not defined!`);
            return;
        }
        eventListeners[eventID][listenerID] = onTrigger;
    };

    result.triggerEvent = (eventID, ev) => {
        if (events[eventID] === undefined) {
            console.warn(`Event ${eventID} is not defined!`);
            return;
        }
        events[eventID](eventListeners[eventID], ev);
    };

    // localize helper contents
    {
        result.addEvent("languageListLoaded");
        result.addEvent("entriesLoaded");
        result.addEvent("localeChanged");

        result.importTranslation = (path) => {
            getJsonData(path).then(
                (data) => {
                    for (let entry in data)
                        if (localize.entries[entry] === undefined)
                            localize.entries[entry] = data[entry];
                    result.triggerEvent("entriesLoaded", {entries: localize.entries});
                    result.triggerEvent("locale", {locale: global.locale});
                }
            ).catch(
                (err) => console.error(err)
            )
        };

        getJsonData("https://richadowonosas.github.io/resources/langlist.json").then(
            (data) => {
                localize.languages = data.languages;
                result.triggerEvent("languageListLoaded", {languages: localize.languages});
            }
        ).catch(
            (err) => console.error(err)
        );
        result.importTranslation("https://richadowonosas.github.io/resources/global-localized-strings.json");
    }

    // define global configs
    {
        const addGlobalConfigEntry = (id, defaultValue, onTrigger = defaultTrigger) => {
            global[id] = globalDefault[id] = defaultValue;
            result.addEvent(id, onTrigger);
        };
        addGlobalConfigEntry("locale", "en-US", (listeners, ev) => {
            let locale = global.locale = (ev["locale"] === undefined) ? global.locale : ev["locale"];
            result.saveGlobalConfig();
            for (let listenerID in listeners) {
                if (localize.entries[listenerID] === undefined)
                    continue;
                listeners[listenerID]({
                    str: localize.entries[listenerID][locale] === undefined ?
                        localize.entries[listenerID][globalDefault.locale] :
                        localize.entries[listenerID][locale]
                });
            }
            result.triggerEvent("localeChanged", {locale: locale});
        });
        addGlobalConfigEntry("light", false, (listeners, ev) => {
            let light = global.light = (ev["light"] === undefined) ? global.light : ev["light"];
            result.saveGlobalConfig();
            document.body.classList.remove(light ? "dark" : "light");
            document.body.classList.add(!light ? "dark" : "light");
            for (let listenerID in listeners) {
                listeners[listenerID]({light: global.light});
            }
        });
        addGlobalConfigEntry("size", "medium", (listeners, ev) => {
            let size = global.size = (ev["size"] === undefined) ? global.size : ev["size"];
            result.saveGlobalConfig();
            for (let listenerID in listeners) {
                listeners[listenerID]({size: size});
            }
        });
        addGlobalConfigEntry("yoha", false, (listeners, ev) => {
            let yoha = global.yoha = (ev["yoha"] === undefined) ? global.yoha : ev["yoha"];
            result.saveGlobalConfig();
            if (yoha)
                document.body.classList.add("yoha");
            else
                document.body.classList.remove("yoha");
            for (let listenerID in listeners) {
                listeners[listenerID]({yoha: yoha});
            }
        });
    }

    result.addLocalConfigEntry = (id, defaultValue, onTrigger = defaultTrigger) => {
        local[id] = localDefault[id] = defaultValue;
        result.addEvent(id, onTrigger);
    };

    // create drawer
    {
        result.drawer = (() => {
            let drawer = {};

            // the list to record a content is expanded or not
            let expand = {"drawer": false};

            // drawer
            let drawerDiv = document.createElement("div");
            drawerDiv.id = "drawer";

            // content container
            let container = document.createElement("div");
            container.id = "root_container";
            drawerDiv.appendChild(container);

            // collapse container list
            let list = [];

            // button
            let button = document.createElement("div");
            button.id = "drawer_button";
            button.classList.add("no_padding");
            button.innerHTML = `
    <svg class="menu_icon" viewbox="0 0 96 96" fill="#cccccc">
        <rect class="top" width="52" height="4" x="22" y="30" rx="2"></rect>
        <rect class="mid" width="52" height="4" x="22" y="46" rx="2"></rect>
        <rect class="low" width="52" height="4" x="22" y="62" rx="2"></rect>
        <rect class="xl" width="52" height="4" x="22" y="46" rx="2"></rect>
        <rect class="xr" width="52" height="4" x="22" y="46" rx="2"></rect>
    </svg>
    `;
            {
                let s = document.createElement("span");
                s.id = "text_menu";
                s.classList.add("db_text");
                s.innerText = "菜单";
                result.addEventListener("locale", "text_menu", (res) => s.innerText = res.str);
                button.appendChild(s);
            }
            drawerDiv.appendChild(button);

            // mask
            let mask = document.createElement("div");
            mask.id = "drawer_mask";

            // functions
            drawer.updateDrawerCond = () => {
                list.forEach((element) => element.style = "--height:" + element.offsetHeight + "px");
            };

            drawer.appendToDocument = () => {
                drawerDiv.classList.remove("expand");
                button.classList.remove("expand");
                mask.classList.remove("expand");
                drawerDiv.classList.add("collapse");
                button.classList.add("collapse");
                mask.classList.add("collapse");
                document.body.appendChild(drawerDiv);
                drawer.updateDrawerCond();
            };

            drawer.createDrawerContentFrame = (name, defaultTitle) => {
                // frame html struct
                let frame = {};
                let id = name;
                let root = document.createElement("div");
                root.id = "root_" + name;
                root.classList.add("drawer_root");
                root.classList.add("collapse");

                let title = document.createElement("div");
                title.id = "opt_" + name;
                title.classList.add("drawer_container");
                title.classList.add("flex");
                let text_title = document.createElement("h3");
                text_title.id = "text_" + name;
                text_title.innerText = defaultTitle;
                title.appendChild(text_title);
                result.addEventListener("locale", text_title.id, (res) => text_title.innerText = res.str);
                let icon_expand = document.createElement("span");
                icon_expand.classList.add("icon_expand");
                title.appendChild(icon_expand);
                root.appendChild(title);

                let cont = document.createElement("div");
                cont.classList.add("drawer_container");

                let container = document.createElement("div");
                container.id = name + "_container";
                container.classList.add("drawer_container");
                container.classList.add("collapse");
                cont.appendChild(container);
                root.appendChild(cont);

                // functions
                frame.createContent = (sectionName, sectionTitle) => {
                    let content = document.createElement("div");
                    content.id = id + "_" + sectionName;
                    content.classList.add("drawer_content");

                    let s = document.createElement("span");
                    s.id = "text_" + content.id;
                    s.classList.add("opt_text");
                    s.innerText = sectionTitle;
                    result.addEventListener("locale", s.id, (res) => s.innerText = res.str);
                    content.appendChild(s);

                    return content;
                };

                frame.addContent = (content) => container.appendChild(content);

                // data binding
                frame.id = id;
                frame.root = root;
                frame.title = title;
                frame.container = container;

                return frame;
            };

            drawer.addDrawerContentByFrame = (frame) => {
                if (!frame.id || !frame.root || !frame.title || !frame.container) {
                    console.warn("Invalid drawer frame!");
                    return;
                }
                container.appendChild(frame.root);
                list.push(frame.container);
                expand[frame.id] = false;

                frame.title.onclick = () => {
                    expand[frame.id] = !expand[frame.id];
                    frame.root.classList.remove(expand[frame.id] ? "collapse" : "expand");
                    frame.root.classList.add(!expand[frame.id] ? "collapse" : "expand");
                    frame.container.classList.remove(expand[frame.id] ? "collapse" : "expand");
                    frame.container.classList.add(!expand[frame.id] ? "collapse" : "expand");
                };
            };

            drawer.changeDrawerStatus = (status = !expand["drawer"]) => {
                expand["drawer"] = status;
                if (expand["drawer"]) {
                    document.body.appendChild(mask);
                    mask.onclick = () => drawer.changeDrawerStatus(false);
                    drawerDiv.classList.remove("collapse");
                    drawerDiv.classList.add("expand");
                    button.classList.remove("collapse");
                    button.classList.add("expand");
                    setTimeout(() => {
                        mask.classList.remove("collapse");
                        mask.classList.add("expand");
                    }, 0);
                } else {
                    mask.onclick = () => {
                    };
                    drawerDiv.classList.remove("expand");
                    drawerDiv.classList.add("collapse");
                    button.classList.remove("expand");
                    button.classList.add("collapse");
                    mask.classList.remove("expand");
                    mask.classList.add("collapse");
                    setTimeout(() => {
                        try {
                            document.body.removeChild(mask);
                        } catch (e) {
                            console.error(e);
                        }
                    }, 333);
                }
            };

            // bind default setting area
            {
                let settingsFrame = drawer.createDrawerContentFrame("settings", "设置");
                {
                    let div_lang = settingsFrame.createContent("lang", "界面语言");

                    let s = document.createElement("select");
                    s.id = "select_language";
                    result.addEventListener("languageListLoaded", s.id, (res) => {
                        for (let lang in res.languages) {
                            let o = document.createElement("option");
                            o.value = res.languages[lang].id;
                            o.innerText = res.languages[lang].name;
                            s.appendChild(o);
                        }
                    });
                    s.onchange = () => result.triggerEvent("locale", {locale: s.selectedOptions[0].value});
                    result.addEventListener("localeChanged", s.id, (res) => {
                        for (let o in s.options)
                            if (s.options[o].value === res.locale) {
                                s.options[o].selected = true;
                                break;
                            }
                        drawer.updateDrawerCond();
                    });
                    div_lang.appendChild(s);
                    settingsFrame.addContent(div_lang);
                }
                {
                    let div_size = settingsFrame.createContent("size", "字体大小");

                    let s = document.createElement("select");
                    s.id = "select_size";
                    {
                        let o = document.createElement("option");
                        o.id = "text_small";
                        o.value = "small";
                        o.innerText = "小";
                        result.addEventListener("locale", o.id, (res) => o.innerText = res.str);
                        s.appendChild(o);
                    }
                    {
                        let o = document.createElement("option");
                        o.id = "text_medium";
                        o.value = "medium";
                        o.selected = true;
                        o.innerText = "中";
                        result.addEventListener("locale", o.id, (res) => o.innerText = res.str);
                        s.appendChild(o);
                    }
                    {
                        let o = document.createElement("option");
                        o.id = "text_large";
                        o.value = "large";
                        o.innerText = "大";
                        result.addEventListener("locale", o.id, (res) => o.innerText = res.str);
                        s.appendChild(o);
                    }
                    s.onchange = () => result.triggerEvent("size", {size: s.value});
                    result.addEventListener("size", "size", (res) => {
                        for (let o in s.options)
                            if (s.options[o].value === res.size) {
                                s.options[o].selected = true;
                                break;
                            }
                        drawer.updateDrawerCond();
                    });
                    div_size.appendChild(s);

                    settingsFrame.addContent(div_size);
                }
                {
                    let div_theme = settingsFrame.createContent("theme", "主题切换");

                    let l = document.createElement("label");
                    l.classList.add("toggle");
                    l.innerHTML = `
            <input id="daynight" type="checkbox">
                <span id="dn_span" class="slider">
                    <span class="inner_slider"></span>
                </span>
            </input>`;
                    let input = l.children[0];
                    result.addEventListener("light", "light", (res) => {
                        input.checked = !res.light;
                    });
                    input.onchange = () => result.triggerEvent("light", {light: !input.checked});
                    div_theme.appendChild(l);

                    settingsFrame.addContent(div_theme);
                }
                {
                    let div_yoha = settingsFrame.createContent("yoha", "夜羽字体");

                    let l = document.createElement("label");
                    l.classList.add("toggle");
                    l.innerHTML = `
            <input id="input_yoha" type="checkbox">
                <span class="slider">
                    <span class="inner_slider"></span>
                </span>
            </input>`;
                    let input = l.children[0];
                    result.addEventListener("yoha", "yoha", (res) => {
                        input.checked = res.yoha;
                        drawer.updateDrawerCond();
                    });
                    input.onchange = () => result.triggerEvent("yoha", {yoha: input.checked});
                    div_yoha.appendChild(l);

                    settingsFrame.addContent(div_yoha);
                }

                drawer.addDrawerContentByFrame(settingsFrame);
            }

            // function bindings
            button.onclick = () => drawer.changeDrawerStatus();
            mask.onclick = () => {
            };
            document.onresize = () => drawer.updateDrawerCond();

            return drawer;
        })();
    }

    Object.freeze(result);
    return result;
})();