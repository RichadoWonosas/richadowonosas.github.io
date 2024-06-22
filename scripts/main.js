"use strict";

// import {drawer, config} from "./drawer.js";
// import {localizeHelper} from "./localize.js";
//
// const initialise = () => {
//     localizeHelper.importTranslation("../resources/localized-strings.json");
//     localizeHelper.registerLocaleChangeCallback("title", (str) => document.title = str);
//
//     config.loadGlobalConfig();
//     drawer.appendToDocument();
// };

import {helper} from "./helper.js";

const initialise = () => {
    helper.importTranslation("../resources/localized-strings.json");
    helper.addEventListener("locale", "title", (res) => document.title = res.str);
    helper.addEventListener("size", "root",
        (res) => {
        let root_div = document.getElementById("root_div");
            if (res.size === 'small') {
                root_div.classList.add('small');
            } else {
                root_div.classList.remove('small');
            }
            if (res.size === 'medium') {
                root_div.classList.add('medium');
            } else {
                root_div.classList.remove('medium');
            }
            if (res.size === 'large') {
                root_div.classList.add('large');
            } else {
                root_div.classList.remove('large');
            }
        });

    helper.loadGlobalConfig();
    helper.drawer.appendToDocument();
};

document.body.onload = initialise;