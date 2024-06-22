"use strict";

export {localizeHelper};

import {getJsonData} from "./json.js";

const localizeHelper = (() => {
    let result = {};

    // helper content
    let translate = {};
    let languages = {};
    let localeChange = {};
    let languageListLoaded = [];
    let translationImported = [];
    let stringsLoaded = [];

    getJsonData("https://richadowonosas.github.io/resources/langlist.json").then(
        (data) => {
            languages = data.languages;
            for (let callback in languageListLoaded)
                languageListLoaded[callback](languages);
        }
    ).catch(
        (err) => alert(err)
    );

    getJsonData("https://richadowonosas.github.io/resources/global-localized-strings.json").then(
        (data) => {
            translate = data;
            for (let callback in stringsLoaded)
                stringsLoaded[callback]();
        }
    ).catch(
        (err) => alert(err)
    );

    // helper functions
    result.registerTranslationImportedCallback = (onTranslationImported = () => {
    }) => {
        translationImported.push(onTranslationImported);
    }
    result.registerLocaleChangeCallback = (id, onLocaleChange = (str) => {
        console.log(str)
    }) => {
        localeChange[id] = onLocaleChange;
    };
    result.registerLanguageListLoadedCallback = (onLanguageListLoaded = (languages) => {
        console.log(languages)
    }) => {
        languageListLoaded.push(onLanguageListLoaded);
    };
    result.registerStringsLoadedCallback = (onStringsLoaded = (stringsLoaded) => {
        console.log(stringsLoaded)
    }) => {
        stringsLoaded.push(onStringsLoaded);
    }
    result.changeLocale = (selected) => {
        const DEF = "en-US";
        let s = DEF;
        for (let i in languages)
            if (languages[i].id === selected) {
                s = selected;
                break;
            }
        for (let id in localeChange) {
            if (!translate[id])
                continue;
            localeChange[id]((!translate[id][s]) ? translate[id][DEF] : translate[id][s]);
        }
    };
    result.importTranslation = (path) => {
        getJsonData(path).then(
            (data) => {
                for (let i in data)
                    if (!translate[i])
                        translate[i] = data[i];
                for (let callback in translationImported)
                    translationImported[callback]();
            }
        ).catch(
            (err) => alert(err)
        )
    };

    // debug uses
    // result.translate = translate;
    // result.languages = languages;
    // result.localeChange = localeChange;
    // result.languageListLoaded = languageListLoaded;
    // result.translationImported = translationImported;
    // result.stringsLoaded = stringsLoaded;

    return result;
})();
