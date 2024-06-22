"use strict";

export {getJsonData};

const getJsonData = (path) => {
    return fetch(path).then(
        (response) =>
            response.status === 200 ?
                response.json() :
                {}
    );
};