// searchResultScript.bundle.js

import { getBackgroundColor } from './color';

// Encapsulated logic to store processed video URLs

console.log('hello ');
const ProcessedVideoUrls = (function () {
  let processedUrls = [];

  return {
    addProcessedUrl: function (url) {
      processedUrls.push(url);
    },
    clearProcessedUrls: function () {
      processedUrls = [];
    },
    isUrlProcessed: function (url) {
      return processedUrls.includes(url);
    },
  };
})();

async function fetchHtmlAsText(youtubeUrl) {
  try {
    const response = await fetch(youtubeUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    return data;
  } catch (error) {
    console.error('Failed to fetch HTML content:', error);
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
    return count;
  } else {
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

async function fetchAndDisplayMetadata(thumbnail, videoUrl) {
  const htmlContent = await fetchHtmlAsText(videoUrl);
  if (!htmlContent) {
    console.error('Failed to fetch HTML content');
    return;
  }
  const card = thumbnail.closest('ytd-video-renderer');
  const likeCount = parseLikeCount(htmlContent);
  console.log('likes:-' + likeCount);
  const viewCount = parseViewCount(card, htmlContent);

  if (likeCount < 0 || viewCount < 0) {
    console.error('Failed to fetch like or view count');
    return;
  }

  const percentage = (likeCount / viewCount) * 100;
  const percentageText = `${percentage.toFixed(1)}%`;

  addPercentMetadata(thumbnail, percentage, percentageText);
}

function addPercentMetadata(thumbnail, percentage, percentageText) {
  const richItemRenderer = thumbnail.closest('.style-scope ytd-video-renderer');

  console.log(richItemRenderer);
  if (richItemRenderer) {
    const metaDataContainer = richItemRenderer.querySelector(
      '.style-scope ytd-video-meta-block'
    );
    if (metaDataContainer) {
      const urlElement = document.createElement('span');
      urlElement.textContent = percentageText;

      const color = getBackgroundColor(percentage);
      urlElement.style.backgroundColor = color[0];
      urlElement.style.color = color[1];
      urlElement.style.fontWeight = '500';
      urlElement.style.fontSize = '12.84px';

      urlElement.style.textAlign = 'center';

      urlElement.style.display = 'flex';
      urlElement.style.alignItems = 'center';
      urlElement.style.justifyContent = 'center';
      urlElement.style.width = '60px';
      urlElement.style.height = '30.95px';
      urlElement.style.borderRadius = '28px';
      metaDataContainer.appendChild(urlElement);
      ProcessedVideoUrls.addProcessedUrl(thumbnail.href);
    }
  }
}

function addHoverListenersToVideos() {
  const videoThumbnails = document.querySelectorAll('a#thumbnail');

  videoThumbnails.forEach((thumbnail) => {
    if (!thumbnail.dataset.girmanListenerAdded) {
      thumbnail.dataset.girmanListenerAdded = 'true';
      thumbnail.addEventListener('mouseenter', function () {
        const videoUrl = this.href;
        if (ProcessedVideoUrls.isUrlProcessed(videoUrl)) {
          return;
        }
        ProcessedVideoUrls.addProcessedUrl(videoUrl);
        fetchAndDisplayMetadata(thumbnail, videoUrl);
      });
    }
  });
}

async function startProcessing() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  addHoverListenersToVideos();
  setInterval(addHoverListenersToVideos, 500);
}

startProcessing();
