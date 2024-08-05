let currentPageUrl = window.location.href;

// Function to inject the video script
function injectVideoScript() {
  if (!document.querySelector('#videoScript')) {
    console.log('Injecting videoScript...');
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('videoScript.bundle.js');
    script.id = 'videoScript';
    script.type = 'module';
    document.head.appendChild(script);
  } else {
    console.log('videoScript already injected');
  }
}

function injectVideoRecommended() {
  if (!document.querySelector('#videoRecommended')) {
    console.log('Injecting videoRecommendedScript...');
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('videoRecommendedListScript.bundle.js');
    script.id = 'videoRecommended';
    script.type = 'module';
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
    script.src = chrome.runtime.getURL('videoSearchListScript.bundle.js');
    script.id = 'videoSearch';
    script.type = 'module';
    document.head.appendChild(script);
  } else {
    console.log('videoSearchListScript already injected');
  }
}

// Function to monitor URL changes and inject script accordingly
function urlEmitter() {
  const newUrl = window.location.href;

  // Check if the pathname has changed and if it matches /watch
  if (newUrl !== currentPageUrl && newUrl.includes('youtube.com/watch')) {
    console.log('Navigated to a watch page, injecting videoScript...');
    injectVideoScript();
    injectVideoRecommended();
  } else if (
    newUrl !== currentPageUrl &&
    newUrl.includes('youtube.com/results')
  ) {
    console.log(
      'Navigated to a Search page, injecting videoSearchListScript...'
    );
    injectVideoSearch();
  }

  // Update the current URL
  currentPageUrl = newUrl;
  console.log('URL Emitter: ' + currentPageUrl);
}

setInterval(urlEmitter, 500);

function matchApplicantPageUrl(url) {
  //return url.match(/youtube\.com\/watch\?v=.+/) !== null;
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
    //console.log(data);
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

function parseViewCount(htmlData) {
  const regex = /accessibilityText":"\d{1,3}(,\d{3})* views/;
  const match = htmlData.match(regex);
  if (match) {
    // get number from the match
    const numberRegex = /\d{1,3}(,\d{3})* views/;
    const numberMatch = match[0].match(numberRegex);
    const count = Number(
      numberMatch[0].replace(/,/g, '').replace(' views', '')
    );
    console.log('view count value: ' + count);
    return count;
  } else {
    console.log('No match found');
    return -1;
  }
}

window.onload = function () {
  startProcessing();
};

async function startProcessing() {
  // wait for 500ms
  await new Promise((resolve) => setTimeout(resolve, 500));
  addHoverListenersToVideos();
  setInterval(addHoverListenersToVideos, 5000);
}

// Function to add hover listeners to video elements
function addHoverListenersToVideos() {
  // Select all video thumbnail elements (the selector might need updates)
  const videoThumbnails = document.querySelectorAll('a#thumbnail');

  //console.log('\n \n \n \n Hover Test \n \n \n \n \n \n \n ');
  //console.log(videoThumbnails.length);

  // Add a 'mouseenter' event listener to each video thumbnail
  videoThumbnails.forEach((thumbnail) => {
    if (!thumbnail.dataset.girmanListenerAdded) {
      // Mark the thumbnail as processed
      thumbnail.dataset.girmanListenerAdded = 'true';

      thumbnail.addEventListener('mouseenter', function () {
        // Extract the video URL from the 'href' attribute
        const videoUrl = this.href;
        //alert(videoUrl);
        console.log('\n \n \n \n Hovered video \n \n \n \n \n \n \n ');

        // Check if the video URL is already processed
        if (ProcessedVideoUrls.isUrlProcessed(videoUrl)) {
          console.log('Video URL already processed');
          return;
        }

        // add videoUrl to processed url list
        ProcessedVideoUrls.addProcessedUrl(videoUrl);

        fetchAndDisplayMetadata(thumbnail, videoUrl);

        // You can now use the videoUrl for your needs
      });
    }

    //console.log("url is: " + thumbnail.href);
  });
}

async function fetchAndDisplayMetadata(thumbnail, videoUrl) {
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
  const viewCount = parseViewCount(htmlContent);

  // validate like and view count. It should be greater than 0
  if (likeCount < 0 || viewCount < 0) {
    console.error('Failed to fetch like or view count');
    return;
  }

  // calculate percentage
  const percentage = (likeCount / viewCount) * 100;
  const percentageText = `Percentage: ${percentage.toFixed(2)}%`;
  console.log(percentageText);

  // add metadata to the thumbnail
  addPercentMetadata(thumbnail, percentageText);
}

function addUrlToVideoMetadata(thumbnail, videoUrl) {
  const richItemRenderer = thumbnail.closest(
    '.style-scope ytd-rich-item-renderer'
  );

  if (richItemRenderer) {
    const metaDataContainer = richItemRenderer.querySelector(
      '.style-scope ytd-video-meta-block'
    );
    if (metaDataContainer) {
      // Create a new element to display the video URL
      const urlElement = document.createElement('span');
      urlElement.textContent = `URL: ${videoUrl}`;
      urlElement.style.marginLeft = '0px'; // Add some spacing

      // Append the URL element to the meta data container
      metaDataContainer.appendChild(urlElement);
    }
  } else {
    // Handle the case where closest did not find a matching element
  }
}

function addPercentMetadata(thumbnail, percentageText) {
  const richItemRenderer = thumbnail.closest(
    '.style-scope ytd-rich-item-renderer'
  );

  if (richItemRenderer) {
    const metaDataContainer = richItemRenderer.querySelector(
      '.style-scope ytd-video-meta-block'
    );
    if (metaDataContainer) {
      // Create a new element to display the video URL
      const urlElement = document.createElement('span');
      urlElement.textContent = percentageText;
      urlElement.style.marginLeft = '0px'; // Add some spacing

      // Append the URL element to the meta data container
      metaDataContainer.appendChild(urlElement);

      ProcessedVideoUrls.addProcessedUrl(thumbnail.href);
    }
  } else {
    // Handle the case where closest did not find a matching element
  }
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

// Usage example:
// Add a processed URL
// ProcessedVideoUrls.addProcessedUrl("https://www.youtube.com/watch?v=abc123");

// // Check if a URL is already processed
// const isProcessed = ProcessedVideoUrls.isUrlProcessed("https://www.youtube.com/watch?v=abc123");
// console.log(isProcessed); // Output: true

// // Clear the list of processed URLs
// ProcessedVideoUrls.clearProcessedUrls();
