//alert("Hello, world!");

// select an element that has a class of view-count
//var viewCount = document.querySelector('.view-count');
// viewCount is a span element. Get the text content of the span element. The text is in the form of comma separated numbers. Convert the text to a number by removing the commas. Also text contains views word. Remove the word views.
//var count = Number(viewCount.textContent.replace(/,/g, '').replace('views', ''));

// use the following selector and get the element. #factoids > factoid-renderer:nth-child(1) > div > span.YtwFactoidRendererValue > span

//var factoid = document.querySelector('#factoids > factoid-renderer:nth-child(1) > div > span.YtwFactoidRendererValue > span');

// make the API call to https://www.youtube.com/watch?v=MNw9x53Ybos and extract the factoid from the page. The factoid is in the form of a number. Extract the number from the page and convert it to a number.

// get the url from the current page


// Get the current URL
var currentPageUrl = "";

// Listen for changes to the URL
function urlEmitter() {
  // Get the new URL
  const newUrl = window.location.href

  // Check if the pathname has changed
  if (newUrl !== currentPageUrl && window.location.pathname !== '/') {
    
    // The pathname has changed
    let applicantPageUrl = matchApplicantPageUrl(newUrl);

    if (applicantPageUrl) {
      console.log("applicant page url matched");
      prepareApplicantPage(newUrl); 
    }

  } else {
    // The pathname hasn't changed, do something here
  }

  // Update the current URL
  currentPageUrl = newUrl
};

setInterval(urlEmitter, 1000);

function matchApplicantPageUrl(url) {
    return url.match(/youtube\.com\/watch\?v=.+/) !== null;
}

function prepareApplicantPage(api) {
    fetch(api)
        .then(response => response.text())
        .then(data => {
            //var parser = new DOMParser();
            //var doc = parser.parseFromString(data, 'text/html');
    
            // In the console log window, Add 10 line empty space to separate the logs
            console.log('\n \n \n \n Girish Test \n \n \n \n \n \n \n ');
            //console.log(api);
            //console.log(data);
            // Doc is the parsed HTML content. Print the content of the document
            var regex = /like this video along with \d{1,3}(,\d{3})* other people/;
            var match = data.match(regex);
            var count = Number(match[0].replace(/,/g, '').replace('like this video along with ', '').replace(' other people', ''));
            console.log(count);
            //alert(count);
    
            // find the element with class view-count and print the text content of the element
            //var viewCount = doc.querySelector('.view-count');
            //alert(viewCount.textContent);
    
            //var factoid = doc.querySelector('#factoids > factoid-renderer:nth-child(1) > div > span.YtwFactoidRendererValue > span');
            //var count = Number(factoid.textContent.replace(/,/g, ''));
            //alert(count);
        });
}

async function fetchHtmlAsText(youtubeUrl) {
    console.log(`\n \n \n \n Fetching html content for: ${youtubeUrl} \n \n \n \n \n \n \n `);

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
        console.error("Failed to fetch html content:", error);
        return null;
    }
}

async function fetchLikeCount(youtubeUrl) {
    console.log(`\n \n \n \n Fetching count for: ${youtubeUrl} \n \n \n \n \n \n \n `);
    try {
        // Fetch data from the URL
        const response = await fetch(youtubeUrl);
        // Ensure the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Convert the response body to text
        const data = await response.text();
        console.log(data);
        
        // Extract like count using the regex
        getViewCount(data);
        return getLikeCount(data);
    } catch (error) {
        console.error("Failed to fetch and parse like count:", error);
    }
}

function getLikeCount(htmlData) {
    const regex = /like this video along with \d{1,3}(,\d{3})* other people/;
    const match = htmlData.match(regex);
    if (match) {
        const count = Number(match[0].replace(/,/g, '').replace('like this video along with ', '').replace(' other people', ''));
        console.log("like count value: " + count);
        return count;
    } else {
        console.log("No match found");
        return -1;
    }
}

function getViewCount(htmlData) {
    const regex = /accessibilityText":"\d{1,3}(,\d{3})* views/;
    const match = htmlData.match(regex);
    if (match) {
        // get number from the match
        const numberRegex = /\d{1,3}(,\d{3})* views/;
        const numberMatch = match[0].match(numberRegex);
        const count = Number(numberMatch[0].replace(/,/g, '').replace(' views', ''));
        console.log("view count value: " + count);
        return count;
    } else {
        console.log("No match found");
        return -1;
    }
}

window.onload = function() {
    startProcessing();
}

async function startProcessing() {
    // wait for 500ms
    await new Promise(resolve => setTimeout(resolve, 500));
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
    videoThumbnails.forEach(thumbnail => {

        if (!thumbnail.dataset.girmanListenerAdded) {
            // Mark the thumbnail as processed
            thumbnail.dataset.girmanListenerAdded = 'true';

            thumbnail.addEventListener('mouseenter', function() {
                // Extract the video URL from the 'href' attribute
                const videoUrl = this.href;
                //alert(videoUrl);
                console.log('\n \n \n \n Hovered video \n \n \n \n \n \n \n ');
                console.log('Hovered over video URL:', videoUrl);
    
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
    const likeCount = getLikeCount(htmlContent);
    // get view count
    const viewCount = getViewCount(htmlContent);

    // validate like and view count. It should be greater than 0
    if (likeCount < 0 || viewCount < 0) {
        console.error('Failed to fetch like or view count');
        return;
    }

    // calculate percentage
    const percentage = likeCount / viewCount * 100;
    const percentageText = `Percentage: ${percentage.toFixed(2)}%`;
    console.log(percentageText);

    // add metadata to the thumbnail
    addPercentMetadata(thumbnail, percentageText);
}

function addUrlToVideoMetadata(thumbnail, videoUrl) {
    
    const metaDataContainer = thumbnail
        .closest('.style-scope ytd-rich-item-renderer')
        .querySelector('.style-scope ytd-video-meta-block');

    if (metaDataContainer) {
        // Create a new element to display the video URL
        const urlElement = document.createElement('span');
        urlElement.textContent = `URL: ${videoUrl}`;
        urlElement.style.marginLeft = '0px'; // Add some spacing

        // Append the URL element to the meta data container
        metaDataContainer.appendChild(urlElement);
    }

}

function addPercentMetadata(thumbnail, percentageText) {
    
    const metaDataContainer = thumbnail
        .closest('.style-scope ytd-rich-item-renderer')
        .querySelector('.style-scope ytd-video-meta-block');

    if (metaDataContainer) {
        // Create a new element to display the video URL
        const urlElement = document.createElement('span');
        urlElement.textContent = percentageText;
        urlElement.style.marginLeft = '0px'; // Add some spacing

        // Append the URL element to the meta data container
        metaDataContainer.appendChild(urlElement);
    }

}