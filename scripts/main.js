"use-strict";

import { drawer, config } from "./drawer.js";
import { localizeHelper } from "./localize.js";

const initialise = () => {
    localizeHelper.importTranslation("../resources/localized-strings.json");
    localizeHelper.registerLocaleChangeCallback("title", (str) => document.title = str);

    config.loadGlobalConfig();
    drawer.appendToDocument();
};

document.body.onload = initialise;