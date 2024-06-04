"use-strict";

import { drawer, config } from "./drawer.js";
import { localizeHelper } from "./localize.js";

const initialise = () => {
    config.loadGlobalConfig();
    drawer.appendToDocument();

    localizeHelper.importTranslation("../resources/localized-strings.json");
};

document.body.onload = initialise;