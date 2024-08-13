import { getBackgroundColor } from './color';

let currentPageUrl = window.location.href;
let intervalId = null;

// Function to check and handle URL changes
function urlEmitter() {
  const newUrl = window.location.href;

  if (newUrl !== currentPageUrl) {
    clearAllPercentMetadata();
    currentPageUrl = newUrl;

    // Check if we are on the YouTube search results page
    if (isYouTubeSearchResultsPage(newUrl)) {
      console.log('YouTube search results page detected');
      startProcessing();
    } else {
      console.log('Navigated away from YouTube search results page');
      clearInterval(intervalId);
      intervalId = null;
    }
  }
}

function isYouTubeSearchResultsPage(url) {
  return url.includes('youtube.com/results?search_query=');
}

function startProcessing() {
  // Ensure we clear any previous interval
  if (intervalId) {
    clearInterval(intervalId);
  }

  // Set up a new interval for adding hover listeners
  intervalId = setInterval(addHoverListenersToVideos, 500);
}

async function fetchHtmlAsText(youtubeUrl) {
  console.log(`Fetching html content for: ${youtubeUrl}`);

  try {
    const response = await fetch(youtubeUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Failed to fetch html content:', error);
    return null;
  }
}

function parseLikeCount(htmlData) {
  const regex = /like this video along with \d{1,3}(,\d{3})* other people/;
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
  const viewContainer = card?.querySelector('.inline-metadata-item');

  let str = viewContainer
    ? viewContainer?.innerText.split(' ')[0]
    : 'no match found';
  return parseCount(str);
}

function addHoverListenersToVideos() {
  const videoThumbnails = document.querySelectorAll('a#thumbnail');

  videoThumbnails.forEach((thumbnail) => {
    if (!thumbnail.dataset.listenerAdded) {
      thumbnail.dataset.listenerAdded = 'true';

      thumbnail.addEventListener('mouseenter', async function () {
        const videoUrl = this.href;

        if (ProcessedVideoUrls.isUrlProcessed(videoUrl)) {
          console.log('Video URL already processed');
          return;
        }

        ProcessedVideoUrls.addProcessedUrl(videoUrl);
        const htmlContent = await fetchHtmlAsText(videoUrl);

        if (!htmlContent) {
          console.error('Failed to fetch html content');
          return;
        }
        const card = thumbnail.closest('ytd-compact-video-renderer');
        const likeCount = parseLikeCount(htmlContent);
        const viewCount = parseViewCount(card, htmlContent);

        if (likeCount < 0 || viewCount < 0) {
          console.error('Failed to fetch like or view count');
          return;
        }

        const percentage = (likeCount / viewCount) * 100;
        const percentageText = ` ${percentage.toFixed(1)}%`;

        addPercentMetadata(thumbnail, percentage, percentageText);
      });
    }
  });
}

function addPercentMetadata(thumbnail, percentage, percentageText) {
  const richItemRenderer = thumbnail.closest(
    '.style-scope ytd-compact-video-renderer'
  );

  if (richItemRenderer) {
    const metaDataContainer = richItemRenderer.querySelector(
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

      metaDataContainer.style.display = 'flex';
      metaDataContainer.style.flexDirection = 'row';

      const urlElement = document.createElement('span');
      urlElement.textContent = percentageText;
      urlElement.style.marginLeft = '10px';
      urlElement.className = 'percentage-metadata';

      const color = getBackgroundColor(percentage);
      urlElement.style.backgroundColor = color[0];
      urlElement.style.color = color[1];
      urlElement.style.fontWeight = '600';
      urlElement.style.fontSize = '11px';
      urlElement.style.textAlign = 'center';
      urlElement.style.display = 'flex';
      urlElement.style.alignItems = 'center';
      urlElement.style.justifyContent = 'center';
      urlElement.style.width = '45.5px';
      urlElement.style.height = '24px';
      urlElement.style.borderRadius = '11.77px';

      metaDataContainer.appendChild(urlElement);
    }
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
  let processedUrls = [];

  return {
    addProcessedUrl: function (url) {
      processedUrls.push(url);
    },
    isUrlProcessed: function (url) {
      return processedUrls.includes(url);
    },
  };
})();

// Start the URL monitoring
startProcessing();
setInterval(urlEmitter, 100);
