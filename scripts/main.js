"use strict";

import {helper} from "./helper.js";

const initialise = () => {
    helper.importTranslation("../resources/localized-strings.json");
    helper.addEventListener("locale", "title", (res) => document.title = res.str);
    helper.addEventListener("size", "root",
        ({size}) => {
        let root_div = document.getElementById("root_div");
            if (size === 'small') {
                root_div.classList.add('small');
            } else {
                root_div.classList.remove('small');
            }
            if (size === 'medium') {
                root_div.classList.add('medium');
            } else {
                root_div.classList.remove('medium');
            }
            if (size === 'large') {
                root_div.classList.add('large');
            } else {
                root_div.classList.remove('large');
            }
        });

    helper.loadGlobalConfig();
    helper.drawer.appendToDocument();
};

document.body.onload = initialise;