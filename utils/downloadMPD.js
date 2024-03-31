import RNFS from 'react-native-fs';
import { download, directories } from '@kesha-antonov/react-native-background-downloader';
import { parseString } from 'react-native-xml2js';

const ensureDirectoryExists = async (path) => {
  const exists = await RNFS.exists(path);
  if (!exists) {
    await RNFS.mkdir(path, { NSURLIsExcludedFromBackupKey: true }); // Optionally exclude from iCloud backup
  }
};


const downloadMPEGDASHStream = async (mpdUrl, basePath) => {
  try {
    await ensureDirectoryExists(basePath);

    // Step 1: Download the MPD file
    const mpdResponse = await fetch(mpdUrl);
    const mpdText = await mpdResponse.text();
    const mpdPath = `${basePath}/manifest.mpd`;

    await RNFS.writeFile(mpdPath, mpdText, 'utf8');

    // Step 2: Parse the MPD file
    parseString(mpdText, async (err, result) => {
      if (err) {
        console.error('Failed to parse MPD file', err);
        return;
      }

      // Simplified: Assuming one period, one adaptation set, and one representation
      const segmentTemplate = result.MPD.Period[0].AdaptationSet[0].SegmentTemplate[0].$;
      const representation = result.MPD.Period[0].AdaptationSet[0].Representation[0];
      const initialization = segmentTemplate.initialization.replace('$RepresentationID$', representation.$.id);
      const media = segmentTemplate.media.replace('$RepresentationID$', representation.$.id);
      const startNumber = parseInt(segmentTemplate.startNumber);
      const timescale = parseInt(segmentTemplate.timescale);
      const duration = parseInt(segmentTemplate.duration);
      const totalSegments = Math.ceil(representation.$.bandwidth / timescale / duration);

      // Step 3: Download initialization segment
      await downloadSegment(mpdUrl, basePath, initialization);

      // Step 4: Download media segments
      for (let number = startNumber; number < totalSegments + startNumber; number++) {
        const segmentUrl = media.replace('$Number%04d$', number.toString().padStart(4, '0'));
        await downloadSegment(mpdUrl, basePath, segmentUrl);
      }
    });

  } catch (error) {
    console.error('Error downloading MPEG-DASH stream:', error);
  }
};

const downloadSegment = async (mpdUrl, basePath, segmentPath) => {
  const baseUrl = mpdUrl.substring(0, mpdUrl.lastIndexOf("/") + 1);
  const segmentUrl = `${baseUrl}${segmentPath}`;
  const localPath = `${basePath}/${segmentPath}`;

  await RNFS.mkdir(localPath.substring(0, localPath.lastIndexOf('/')));

  return new Promise((resolve, reject) => {
    download({
      id: segmentPath,
      url: segmentUrl,
      destination: localPath
    }).begin(() => {
      console.log(`Started downloading: ${segmentPath}`)
 
      console.log(`Init segment URL: ${segmentPath} ${segmentUrl}`);
    
    }).progress(({ bytesDownloaded, bytesTotal }) => {
      console.log(`Downloading ${segmentPath}: ${(bytesDownloaded / bytesTotal * 100).toFixed(2)}%`);
    }).done(() => {
      console.log(`Completed downloading: ${segmentPath}`);
      resolve();
    }).error((error) => {
      console.error(`Error downloading ${segmentPath}:`, error);
      reject(error);
    });
  });
};






export {downloadMPEGDASHStream};
