// --- Parses view count and likes count for YouTube videos --- //
// stops execution on error
let hasNoErrors = true;
// element definitions
const ratioElemId = 'yt-likes-ratio';
const viewCountSelector = '#count > ytd-video-view-count-renderer > span.view-count.style-scope.ytd-video-view-count-renderer';
const ratioElemContainer = '#top-level-buttons-computed';
const ratioElemAnchor = '#top-level-buttons-computed > segmented-like-dislike-button-view-model'
const likeButtonSelector = '#top-level-buttons-computed > segmented-like-dislike-button-view-model > yt-smartimation > div > div > like-button-view-model > toggle-button-view-model > button-view-model > button';
// query selector alias
const $ = document.querySelector.bind(document);
// await element then resolve promise
const awaitElement = (selector) => {
    return new Promise((resolve) => {
        const el = $(selector);
        if (el) return resolve(el);
        const observer = new MutationObserver(() => {
            const el = $(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
// resolve when all selectors present
const awaitElements = (selectors) => {
    const promises = [];
    selectors.forEach(selector => {
        promises.push(awaitElement(selector));
    });
    return Promise.all(promises);
}
// format number with thousands commas
const fmtNumber = (num) => {
    if (typeof num != 'number') return num;
    return num.toLocaleString('en-US', {
        style: 'decimal',
        maximumFractionDigits: 0
    });
}
// convert text count to number
const parseCount = (str) => {
    str = str.replace(/,/g, '')
        .replace('K', '000')
        .replace('M', '000000')
        .replace('B', '000000000');
    if (str.includes('.')) str = str.substring(0, str.length - 1);
    return parseInt(str);
}
// parse the view count in .innerText, expected format '93,123 views'
const getViewCount = () => {
    const el = $(viewCountSelector);
    let str = el ? el.innerText.split(' ')[0] : '';
    return parseCount(str);
}
// Parse the likes count in .ariaLabel, expected format 'like this video along with 3,239 other people'
const getLikesCount = () => {
    const el = $(likeButtonSelector);
    let str = el ? el.ariaLabel.split('with ')[1].split(' ')[0] : '';
    return parseCount(str);
}
// returns the ratio text parsed from views and likes
const buildRatio = () => {
    const likes = getLikesCount();
    const views = getViewCount();
    const ratio = (100.0 * likes / views)
        .toFixed(2);
    if (isNaN(ratio)) return;
    let ratioText = `${ratio}% liked`;
    let ratioTooltip = `This video had ${fmtNumber(likes)} likes / ${fmtNumber(views)} views = ${ratioText} when first opened`;
    // console.log('YouTube Likes Ratio >> ' + ratioTooltip)
    // update and exit if the element already exists...
    const curElem = $(`#${ratioElemId}`);
    if (curElem) {
        curElem.innerText = ratioText;
        curElem.title = ratioTooltip;
        return;
    }
    // ...or create a new element
    const newElem = document.createElement('div');
    newElem.id = ratioElemId;
    newElem.classList.add(
        'yt-spec-button-shape-next--mono',
        'yt-spec-button-shape-next--tonal',
        'yt-spec-button-shape-next--size-m'
    );
    newElem.style.cssText = 'white-space: nowrap; margin-right: 8px;';
    newElem.innerText = ratioText;
    newElem.title = ratioTooltip;
    const anchorElem = $(ratioElemAnchor);
    anchorElem.insertAdjacentElement('beforebegin', newElem);
}
// main function
const parseLikes = () => {
    if (!hasNoErrors) return;
    try {
        buildRatio();
    } catch (err) {
        console.warn('YouTube Likes Ratio >>', err.message);
        hasNoErrors = false;
    }
}
// await elements then parse and set up observers to persist and update the ratio
const initialize = () => {
    const requiredElements = [viewCountSelector, likeButtonSelector, ratioElemContainer, ratioElemAnchor]
    awaitElements(requiredElements)
        .then(() => {
            parseLikes();
            removalObserver.observe($(ratioElemContainer), {
                childList: true,
                subtree: true
            });
        });
}
// triggers full initialize
const initializeObserver = new MutationObserver(() => {
    initialize();
})
// if the likes element gets removed, regenerate it
const removalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((removedNode) => {
            if (removedNode.id === ratioElemId) initialize();
        });
    });
});
// wait for like button be ready on the page then initialize
awaitElement(likeButtonSelector)
    .then(() => {
        initializeObserver.observe($('head'), {
            childList: true,
            subtree: true
        });
        initialize();
    });