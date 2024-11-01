import { getBackgroundColor } from './color';

let currentPageUrl = window.location.href;

const policy = window.trustedTypes.createPolicy('default', {
  createScriptURL: (url) => {
    console.log(`Creating trusted script URL for: ${url}`);
    return url;
  },
});

if (policy) {
  console.log('Trusted Types policy successfully created.');
} else {
  console.log('Failed to create Trusted Types policy.');
}
// Function to inject the video script
function injectVideoScript() {
  if (!document.querySelector('#videoScript')) {
    console.log('Injecting videoScript...');
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('videoScript.bundle.js');

    script.id = 'videoScript';
    script.type = 'text/javascript';
    document.head.appendChild(script);
  } else {
    console.log('videoScript already injected');
  }
}

function injectVideoRecommended() {
  if (!document.querySelector('#videoRecommended')) {
    console.log('Injecting videoRecommendedScript...');
    const script = document.createElement('script');
    script.src = policy.createScriptURL(
      chrome.runtime.getURL('videoRecommendedListScript.bundle.js')
    );
    script.id = 'videoRecommended';
    script.type = 'text/javascript';
    console.log('recommendedScript:- ' + script.src);
    document.head.appendChild(script);
  } else {
    console.log('videoRecommended already injected');
  }
}

function injectVideoSearch() {
  if (!document.querySelector('#videoSearch')) {
    console.log('Injecting videoSearchListScript...');
    const script = document.createElement('script');
    script.src = policy.createScriptURL(
      chrome.runtime.getURL('videoSearchListScript.bundle.js')
    );
    script.id = 'videoSearch';
    script.type = 'text/javascript';
    document.head.appendChild(script);
  } else {
    console.log('videoSearchListScript already injected');
  }
}

// Function to monitor URL changes and inject script accordingly
function urlEmitter() {
  const newUrl = window.location.href;

  if (newUrl !== currentPageUrl) {
    // Inject or remove scripts based on the URL
    clearAllPercentMetadata();

    if (newUrl.includes('youtube.com/watch')) {
      console.log('Navigated to a watch page, injecting videoScript...');
      injectVideoScript();
      injectVideoRecommended();
    } else if (newUrl.includes('youtube.com/results')) {
      console.log(
        'Navigated to a Search page, injecting videoSearchListScript...'
      );
      injectVideoSearch();
    } else if (
      newUrl === 'https://www.youtube.com/' ||
      newUrl === 'https://youtube.com/'
    ) {
      console.log(
        'Navigated to the YouTube homepage, removing injected scripts...'
      );
      removeInjectedScripts();
    }

    // Update the current URL
    currentPageUrl = newUrl;
    console.log('URL Emitter: ' + currentPageUrl);
  }
}

// Function to remove the injected scripts
function removeInjectedScripts() {
  // Remove the videoScript
  const videoScript = document.querySelector('#videoScript');
  if (videoScript) {
    videoScript.remove();
    console.log('videoScript removed.');
  }

  // Remove the videoRecommendedScript
  const videoRecommendedScript = document.querySelector('#videoRecommended');
  if (videoRecommendedScript) {
    videoRecommendedScript.remove();
    console.log('videoRecommendedScript removed.');
  }

  // Remove the videoSearchListScript
  const videoSearchListScript = document.querySelector('#videoSearch');
  if (videoSearchListScript) {
    videoSearchListScript.remove();
    console.log('videoSearchListScript removed.');
  }
}

setInterval(urlEmitter, 200);

function matchApplicantPageUrl(url) {
  // return url.match(/youtube\.com\/watch\?v=.+/) !== null;
}

function prepareApplicantPage(api) {
  // process the page!
}

async function fetchHtmlAsText(youtubeUrl) {
  console.log(
    `\n \n \n \n Fetching html content for: ${youtubeUrl} \n \n \n \n \n \n \n `
  );

  try {
    // Fetch data from the URL
    const response = await fetch(youtubeUrl);
    // Ensure the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Convert the response body to text
    const data = await response.text();
    // console.log(data);
    return data;
  } catch (error) {
    console.error('Failed to fetch html content:', error);
    return null;
  }
}

function parseLikeCount(htmlData) {
  const regex = /like this video along with \d{1,3}(,\d{3})* other people/;
  console.log(htmlData);
  const match = htmlData.match(regex);
  if (match) {
    const count = Number(
      match[0]
        .replace(/,/g, '')
        .replace('like this video along with ', '')
        .replace(' other people', '')
    );
    console.log('like count value: ' + count);
    return count;
  } else {
    console.log('No match found');
    return -1;
  }
}

const parseCount = (str) => {
  let multiplier = 1;

  // Check for suffix and set multiplier
  if (str.includes('K')) {
    multiplier = 1000;
    str = str.replace('K', '');
  } else if (str.includes('M')) {
    multiplier = 1000000;
    str = str.replace('M', '');
  } else if (str.includes('B')) {
    multiplier = 1000000000;
    str = str.replace('B', '');
  }

  // Replace any commas
  str = str.replace(/,/g, '');

  // Parse the number and multiply
  return parseFloat(str) * multiplier;
};
function parseViewCount(card, htmlData) {
  const viewContainer = card.querySelector('.inline-metadata-item');

  console.log('viewContainer ' + viewContainer.innerText);
  let str = viewContainer
    ? viewContainer.innerText.split(' ')[0]
    : 'no match found';
  return parseCount(str);
}

window.onload = function () {
  startProcessing();
};

async function startProcessing() {
  // wait for 500ms
  await new Promise((resolve) => setTimeout(resolve, 500));
  addHoverListenersToVideos();
  setInterval(addHoverListenersToVideos, 500);
}

// Function to add hover listeners to video elements
function addHoverListenersToVideos() {
  // Select all video card elements (the selector might need updates)
  const videoCards = document.querySelectorAll('ytd-rich-item-renderer');

  // Add a 'mouseenter' event listener to each video card
  videoCards.forEach((card) => {
    if (!card.dataset.girmanListenerAdded) {
      // Mark the card as processed
      card.dataset.girmanListenerAdded = 'true';

      card.addEventListener('mouseenter', function () {
        // Extract the video URL from the 'href' attribute of the thumbnail
        const thumbnail = this.querySelector('a#thumbnail');
        const videoUrl = thumbnail ? thumbnail.href : null;

        if (!videoUrl) return;

        console.log('\n \n \n \n Hovered video \n \n \n \n \n \n \n ');

        // Check if the video URL is already processed
        if (ProcessedVideoUrls.isUrlProcessed(videoUrl)) {
          console.log('Video URL already processed');
          return;
        }

        // add videoUrl to processed url list
        ProcessedVideoUrls.addProcessedUrl(videoUrl);

        fetchAndDisplayMetadata(card, videoUrl);

        // You can now use the videoUrl for your needs
      });
    }
  });
}

async function fetchAndDisplayMetadata(card, videoUrl) {
  // fetch html content
  const htmlContent = await fetchHtmlAsText(videoUrl);

  // validate html content
  if (!htmlContent) {
    console.error('Failed to fetch html content');
    return;
  }

  // get like count
  const likeCount = parseLikeCount(htmlContent);
  // get view count
  const viewCount = parseViewCount(card, htmlContent);

  // validate like and view count. It should be greater than 0
  if (likeCount < 0 || viewCount < 0) {
    console.error('Failed to fetch like or view count');
    return;
  }

  // calculate percentage
  const percentage = (likeCount / viewCount) * 100;
  const percentageText = ` ${percentage.toFixed(1)}%`;
  console.log(percentageText);

  // add metadata to the card
  addPercentMetadata(card, percentage, percentageText);
}

function addPercentMetadata(card, percentage, percentageText) {
  const metaDataContainer = card.querySelector(
    '.style-scope ytd-video-meta-block'
  );

  if (metaDataContainer) {
    // Remove any existing percentage element
    const existingPercentageElement = metaDataContainer.querySelector(
      '.percentage-metadata'
    );
    if (existingPercentageElement) {
      existingPercentageElement.remove();
    }

    // Create a new span for the percentage
    metaDataContainer.style.flexDirection = 'row';
    const urlElement = document.createElement('span');
    urlElement.textContent = percentageText;
    urlElement.className = 'percentage-metadata'; // Add a class for easier selection/removal
    urlElement.style.marginLeft = '10px';

    const color = getBackgroundColor(percentage);
    urlElement.style.backgroundColor = color[0];
    urlElement.style.color = color[1];
    urlElement.style.fontWeight = '600';
    urlElement.style.fontSize = '17.84px';

    urlElement.style.textAlign = 'center';
    urlElement.style.display = 'flex';

    urlElement.style.alignItems = 'center';
    urlElement.style.justifyContent = 'center';
    urlElement.style.width = '87px';
    urlElement.style.height = '45.95px';
    urlElement.style.borderRadius = '22px';

    metaDataContainer.appendChild(urlElement);
    ProcessedVideoUrls.addProcessedUrl(card.href);
  }
}

function clearAllPercentMetadata() {
  const allPercentageElements = document.querySelectorAll(
    '.percentage-metadata'
  );
  allPercentageElements.forEach((element) => element.remove());
}

// Encapsulated logic to store processed video URLs
const ProcessedVideoUrls = (function () {
  // Private variable to store the list of processed URLs
  let processedUrls = [];

  // Public methods
  return {
    // Add a processed URL to the list
    addProcessedUrl: function (url) {
      processedUrls.push(url);
    },

    // Clear the list of processed URLs
    clearProcessedUrls: function () {
      processedUrls = [];
    },

    // Check if a URL is already processed
    isUrlProcessed: function (url) {
      return processedUrls.includes(url);
    },
  };
})();
