"use-strict";

export { getJsonData };

const getJsonData = (path) => {
    let prom = fetch(path).then(
        (response) =>
            response.status === 200 ?
                response.json() :
                {}
    );

    return prom;
};