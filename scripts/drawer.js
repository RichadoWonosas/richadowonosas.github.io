"use-strict";

export { drawer, config };

import { localizeHelper } from "./localize.js";

const config = (() => {
    let result = {};

    let global = {};
    let localeChanged = [];
    let themeChanged = [];
    let fontSizeChanged = [];
    let yohaChanged = [];

    // function
    result.saveGlobalConfig = () => localStorage.setItem("globalConfig", JSON.stringify(global));
    // callback registrar
    result.registerLocaleChangedCallback = (onLocaleChanged = (locale) => { }) => {
        localeChanged.push(onLocaleChanged);
    };
    result.registerThemeChangedCallback = (onThemeChanged = (light) => { }) => {
        themeChanged.push(onThemeChanged);
    };
    result.registerFontSizeChangedCallback = (onFontSizeChanged = (size) => { }) => {
        fontSizeChanged.push(onFontSizeChanged);
    };
    result.registerYohaneChangedCallback = (onYohaneChanged = (yoha) => { }) => {
        yohaChanged.push(onYohaneChanged);
    }
    // trigger
    result.changeTheme = (light = !global.light) => {
        global.light = light;
        result.saveGlobalConfig();
        document.body.classList.remove(light ? "dark" : "light");
        document.body.classList.add(!light ? "dark" : "light");
        for (let callback in themeChanged)
            themeChanged[callback](light);
    };
    result.changeLocale = (locale = "en-US") => {
        global.locale = locale;
        result.saveGlobalConfig();
        localizeHelper.changeLocale(locale);
        for (let callback in localeChanged)
            localeChanged[callback](locale);
    };
    result.changeFontSize = (size = "medium") => {
        global.size = size;
        result.saveGlobalConfig();
        for (let callback in fontSizeChanged)
            fontSizeChanged[callback](size);
    };
    result.changeYoha = (yoha = false) => {
        global.yoha = yoha;
        result.saveGlobalConfig();
        if (yoha)
            document.body.classList.add("yoha");
        else
            document.body.classList.remove("yoha");
        for (let callback in yohaChanged)
            yohaChanged[callback](yoha);
    };
    result.loadGlobalConfig = () => {
        let storedSettings = localStorage.getItem("globalConfig");
        global = (!!storedSettings) ? JSON.parse(storedSettings) : {
            locale: "en-US",
            light: false,
            size: "medium",
            yoha: false
        };
        {
            if (global.locale == undefined)
                global.locale = "en-US";
            if (global.light == undefined)
                global.light = true;
            if (global.size == undefined)
                global.size = "medium";
            if (global.yoha == undefined)
                global.yoha = false;

        }
        result.changeTheme(global.light);
        result.changeFontSize(global.size);
        result.changeYoha(global.yoha);
        localizeHelper.registerTranslationImportedCallback(() => result.changeLocale(global.locale));
    };

    // debug uses
    // result.global = global;
    // result.localeChanged = localeChanged;
    // result.themeChanged = themeChanged;
    // result.themeChanged = fontSizeChanged;

    return result;
})();

const drawer = (() => {
    let result = {};

    // the list to record a content is expanded or not
    let expand = { "drawer": false };

    // drawer
    let drawer = document.createElement("div");
    drawer.id = "drawer";

    // content container
    let container = document.createElement("div");
    container.id = "root_container";
    drawer.appendChild(container);

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
        localizeHelper.registerLocaleChangeCallback("text_menu", (str) => s.innerText = str);
        button.appendChild(s);
    }
    drawer.appendChild(button);

    // mask
    let mask = document.createElement("div");
    mask.id = "drawer_mask";

    // functions
    result.updateDrawerCond = () => {
        list.forEach((element) => element.style = "--height:" + element.offsetHeight + "px");
    };

    result.appendToDocument = () => {
        drawer.classList.remove("expand");
        button.classList.remove("expand");
        mask.classList.remove("expand");
        drawer.classList.add("collapse");
        button.classList.add("collapse");
        mask.classList.add("collapse");
        document.body.appendChild(drawer);
        result.updateDrawerCond();
    };

    result.createDrawerContentFrame = (name, defaultTitle) => {
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
        localizeHelper.registerLocaleChangeCallback(text_title.id, (str) => text_title.innerText = str);
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
            localizeHelper.registerLocaleChangeCallback(s.id, (str) => s.innerText = str);
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

    result.addDrawerContentByFrame = (frame) => {
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

    result.changeDrawerStatus = (status = !expand["drawer"]) => {
        expand["drawer"] = status;
        if (expand["drawer"]) {
            document.body.appendChild(mask);
            mask.onclick = () => result.changeDrawerStatus(false);
            drawer.classList.remove("collapse");
            drawer.classList.add("expand");
            button.classList.remove("collapse");
            button.classList.add("expand");
            setTimeout(() => {
                mask.classList.remove("collapse");
                mask.classList.add("expand");
            }, 0);
        } else {
            mask.onclick = () => { };
            drawer.classList.remove("expand");
            drawer.classList.add("collapse");
            button.classList.remove("expand");
            button.classList.add("collapse");
            mask.classList.remove("expand");
            mask.classList.add("collapse");
            setTimeout(() => {
                try {
                    document.body.removeChild(mask)
                } catch (e) {
                    console.log(e);
                };
            }, 333);
        }
    };

    // bind default setting area
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
        {
            let div_yoha = settingsFrame.createContent("yoha", "夜羽");

            let l = document.createElement("label");
            l.classList.add("toggle");
            l.innerHTML = `
            <input type="checkbox">
                <span class="slider">
                    <span class="inner_slider"></span>
                </span>
            </input>`;
            let input = l.children[0];
            config.registerYohaneChangedCallback((yoha) => input.checked = yoha);
            input.onchange = () => config.changeYoha(input.checked);
            div_yoha.appendChild(l);

            settingsFrame.addContent(div_yoha);
        }

        result.addDrawerContentByFrame(settingsFrame);
    };

    // function bindings
    button.onclick = () => result.changeDrawerStatus();
    mask.onclick = () => { };
    document.onresize = () => result.updateDrawerCond();

    // debug uses
    // result.expand = expand;
    // result.drawer = drawer;
    // result.container = container;
    // result.list = list;
    // result.button = button;
    // result.mask = mask;

    return result;
})();