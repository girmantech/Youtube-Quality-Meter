import { getBackgroundColor } from './color';

var currentPageUrl = '';

// Listen for changes to the URL
function urlEmitter() {
  // Get the new URL
  const newUrl = window.location.href;

  // Check if the pathname has changed
  if (newUrl !== currentPageUrl && window.location.pathname !== '/') {
    // The pathname has changed
    let applicantPageUrl = matchApplicantPageUrl(newUrl);

    if (applicantPageUrl) {
      console.log('applicant page url matched');
      prepareApplicantPage(newUrl);
    }
  } else {
    // The pathname hasn't changed, do something here
  }

  // Update the current URL
  currentPageUrl = newUrl;
}

setInterval(urlEmitter, 1000);

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
  const viewCount = parseViewCount(htmlContent);

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
    metaDataContainer.style.display = 'flex';
    metaDataContainer.style.flexDirection = 'row';
    const urlElement = document.createElement('span');
    urlElement.textContent = percentageText;
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
