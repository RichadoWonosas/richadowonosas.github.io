"use-strict";

export { localizeHelper };

import { getJsonData } from "./json.js";

const localizeHelper = (() => {
    let result = {};

    // helper content
    result.translate = {};
    result.languages = {};
    result.localeChange = {};
    result.languageListLoaded = [];
    result.translationImported = [];
    result.stringsLoaded = [];

    getJsonData("../resources/langlist.json").then(
        (data) => {
            result.languages = data.languages;
            for (let callback in result.languageListLoaded)
                result.languageListLoaded[callback](result.languages);
        }
    ).catch(
        (err) => alert(err)
    );

    getJsonData("../resources/global-localized-strings.json").then(
        (data) => {
            result.translate = data;
            for (let callback in result.stringsLoaded)
                result.stringsLoaded[callback]();
        }
    ).catch(
        (err) => alert(err)
    );

    // helper functions
    result.importTranslation = (path) =>
        getJsonData(path).then(
            (data) => {
                for (let i in data)
                    if (!result.translate[i])
                        result.translate[i] = data[i];
                for (let callback in result.translationImported)
                    result.translationImported[callback]();
            }
        ).catch(
            (err) => alert(err)
        );
    result.registerTranslationImportedCallback = (onTranslationImported = () => { }) => {
        result.translationImported.push(onTranslationImported);
    }
    result.registerLocaleChangeCallback = (id, onLocaleChange = (str) => { }) => {
        result.localeChange[id] = onLocaleChange;
    };
    result.registerLanguageListLoadedCallback = (onLanguageListLoaded = (languages) => { }) => {
        result.languageListLoaded.push(onLanguageListLoaded);
    };
    result.changeLocale = (selected) => {
        const DEF = "en-US";
        let s = DEF;
        for (let i in result.languages)
            if (result.languages[i].id == selected) {
                s = selected;
                break;
            }
        for (let id in result.localeChange) {
            if (!result.translate[id])
                continue;
            result.localeChange[id]((!result.translate[id][s]) ? result.translate[id][DEF] : result.translate[id][s]);
        }
    };

    return result;
})();

console.log(localizeHelper);