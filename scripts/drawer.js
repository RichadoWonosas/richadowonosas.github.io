"use-strict";

export { drawer, config };

import { localizeHelper } from "./localize.js";

const config = (() => {
    let result = {
        global: {},
        localeChanged: [],
        themeChanged: [],
        fontSizeChanged: []
    };

    // function
    result.saveGlobalConfig = () => localStorage.setItem("globalConfig", JSON.stringify(result.global));
    // callback registrar
    result.registerLocaleChangedCallback = (onLocaleChanged = (locale) => { }) => {
        result.localeChanged.push(onLocaleChanged);
    };
    result.registerThemeChangedCallback = (onThemeChanged = (light) => { }) => {
        result.themeChanged.push(onThemeChanged);
    };
    result.registerFontSizeChangedCallback = (onFontSizeChanged = (size) => { }) => {
        result.fontSizeChanged.push(onFontSizeChanged);
    };
    // trigger
    result.changeTheme = (light = !result.global.light) => {
        result.global.light = light;
        result.saveGlobalConfig();
        document.body.classList.remove(light ? "dark" : "light");
        document.body.classList.add(!light ? "dark" : "light");
        for (let callback in result.themeChanged)
            result.themeChanged[callback](light);
    };
    result.changeLocale = (locale = "en-US") => {
        result.global.locale = locale;
        result.saveGlobalConfig();
        localizeHelper.changeLocale(locale);
        for (let callback in result.localeChanged)
            result.localeChanged[callback](locale);
    };
    result.changeFontSize = (size = "medium") => {
        result.global.size = size;
        result.saveGlobalConfig();
        for (let callback in result.fontSizeChanged)
            result.fontSizeChanged[callback](size);
    };
    result.loadGlobalConfig = () => {
        let storedSettings = localStorage.getItem("globalConfig");
        result.global = (!!storedSettings) ? JSON.parse(storedSettings) : {
            locale: "en-US",
            light: false,
            size: "medium"
        };
        result.changeTheme(result.global.light);
        result.changeFontSize(result.global.size);
        localizeHelper.registerTranslationImportedCallback(() => result.changeLocale(result.global.locale));
    };

    return result;
})();

const drawer = (() => {
    let result = {};

    // the list to record a content is expanded or not
    result.expand = { "drawer": false };

    // drawer
    result.drawer = document.createElement("div");
    result.drawer.id = "drawer";

    // content container
    result.container = document.createElement("div");
    result.container.id = "root_container";
    result.drawer.appendChild(result.container);

    // collapse container list
    result.list = [];

    // button
    result.button = document.createElement("div");
    result.button.id = "drawer_button";
    result.button.classList.add("no_padding");
    result.button.innerHTML = `
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
        localizeHelper.registerLocaleChangeCallback("text_menu", (str) => s.innerText = str);
        result.button.appendChild(s);
    }
    result.drawer.appendChild(result.button);

    // mask
    result.mask = document.createElement("div");
    result.mask.id = "drawer_mask";

    // functions
    result.updateDrawerCond = () => {
        result.list.forEach((element) => element.style = "--height:" + element.offsetHeight + "px");
    };

    result.appendToDocument = () => {
        result.drawer.classList.remove("expand");
        result.button.classList.remove("expand");
        result.mask.classList.remove("expand");
        result.drawer.classList.add("collapse");
        result.button.classList.add("collapse");
        result.mask.classList.add("collapse");
        document.body.appendChild(result.drawer);
        result.updateDrawerCond();
    };

    result.createDrawerContentFrame = (name, defaultTitle) => {
        // frame html struct
        let frame = { id: name };
        let root = document.createElement("div");
        root.id = "root_" + name;
        root.classList.add("drawer_root");
        root.classList.add("collapse");
        frame.root = root;

        let title = document.createElement("div");
        title.id = "opt_" + name;
        title.classList.add("drawer_container");
        title.classList.add("flex");
        let text_title = document.createElement("h3");
        text_title.id = "text_" + name;
        text_title.innerText = defaultTitle;
        title.appendChild(text_title);
        localizeHelper.registerLocaleChangeCallback(text_title.id, (str) => text_title.innerText = str);
        let icon_expand = document.createElement("span");
        icon_expand.classList.add("icon_expand");
        title.appendChild(icon_expand);
        frame.root.appendChild(title);
        frame.title = title;

        let cont = document.createElement("div");
        cont.classList.add("drawer_container");

        let container = document.createElement("div");
        container.id = name + "_container";
        container.classList.add("drawer_container");
        container.classList.add("collapse");
        cont.appendChild(container);
        frame.root.appendChild(cont);
        frame.container = container;

        // functions
        frame.createContent = (sectionName, sectionTitle) => {
            let result = document.createElement("div");
            result.id = frame.id + "_" + sectionName;
            result.classList.add("drawer_content");

            let s = document.createElement("span");
            s.id = "text_" + result.id;
            s.classList.add("opt_text");
            s.innerText = sectionTitle;
            localizeHelper.registerLocaleChangeCallback(s.id, (str) => s.innerText = str);
            result.appendChild(s);

            return result;
        };

        frame.addContent = (content) => frame.container.appendChild(content);

        return frame;
    };

    result.addDrawerContentByFrame = (frame) => {
        if (!frame.id || !frame.root || !frame.title || !frame.container) {
            console.warn("Invalid drawer frame!");
            return;
        }
        result.container.appendChild(frame.root);
        result.list.push(frame.container);
        result.expand[frame.id] = false;

        frame.title.onclick = () => {
            result.expand[frame.id] = !result.expand[frame.id];
            frame.root.classList.remove(result.expand[frame.id] ? "collapse" : "expand");
            frame.root.classList.add(!result.expand[frame.id] ? "collapse" : "expand");
            frame.container.classList.remove(result.expand[frame.id] ? "collapse" : "expand");
            frame.container.classList.add(!result.expand[frame.id] ? "collapse" : "expand");
        };
    };

    result.changeDrawerStatus = (status = !result.expand["drawer"]) => {
        result.expand["drawer"] = status;
        if (result.expand["drawer"]) {
            document.body.appendChild(result.mask);
            result.mask.onclick = () => result.changeDrawerStatus(false);
            result.drawer.classList.remove("collapse");
            result.drawer.classList.add("expand");
            result.button.classList.remove("collapse");
            result.button.classList.add("expand");
            setTimeout(() => {
                result.mask.classList.remove("collapse");
                result.mask.classList.add("expand");
            }, 0);
        } else {
            result.mask.onclick = () => { };
            result.drawer.classList.remove("expand");
            result.drawer.classList.add("collapse");
            result.button.classList.remove("expand");
            result.button.classList.add("collapse");
            result.mask.classList.remove("expand");
            result.mask.classList.add("collapse");
            setTimeout(() => {
                try {
                    document.body.removeChild(result.mask)
                } catch (e) {
                    console.log(e);
                };
            }, 333);
        }
    };

    // TODO: bind default setting area
    {
        let settingsFrame = result.createDrawerContentFrame("settings", "设置");
        {
            let div_lang = settingsFrame.createContent("lang", "界面语言");

            let s = document.createElement("select");
            s.id = "select_language";
            localizeHelper.registerLanguageListLoadedCallback((languages) => {
                for (let lang in languages) {
                    let o = document.createElement("option");
                    o.value = languages[lang].id;
                    o.innerText = languages[lang].name;
                    s.appendChild(o);
                }
            });
            s.onchange = () => config.changeLocale(s.selectedOptions[0].value);
            config.registerLocaleChangedCallback((locale) => {
                for (let o in s.options)
                    if (s.options[o].value == locale) {
                        s.options[o].selected = true;
                        break;
                    }
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
                localizeHelper.registerLocaleChangeCallback(o.id, (str) => o.innerText = str);
                s.appendChild(o);
            }
            {
                let o = document.createElement("option");
                o.id = "text_medium";
                o.value = "medium";
                o.selected = true;
                o.innerText = "中";
                localizeHelper.registerLocaleChangeCallback(o.id, (str) => o.innerText = str);
                s.appendChild(o);
            }
            {
                let o = document.createElement("option");
                o.id = "text_large";
                o.value = "large";
                o.innerText = "大";
                localizeHelper.registerLocaleChangeCallback(o.id, (str) => o.innerText = str);
                s.appendChild(o);
            }
            s.onchange = () => config.changeFontSize(s.value);
            config.registerFontSizeChangedCallback((size) => {
                for (let o in s.options)
                    if (s.options[o].value == size) {
                        s.options[o].selected = true;
                        break;
                    }
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
            config.registerThemeChangedCallback((light) => input.checked = !light);
            input.onchange = () => config.changeTheme(!input.checked);
            div_theme.appendChild(l);

            settingsFrame.addContent(div_theme);
        }

        result.addDrawerContentByFrame(settingsFrame);
    };

    // function bindings
    result.button.onclick = () => result.changeDrawerStatus();
    result.mask.onclick = () => { };
    document.onresize = () => result.updateDrawerCond();

    return result;
})();