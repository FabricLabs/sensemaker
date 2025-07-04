'use strict';

const React = require('react');
const merge = require('lodash.merge');

const {
  Icon,
  Message,
  Label,
  Segment,
  Grid,
  Header,
  Statistic,
  Progress,
  Tab
} = require('semantic-ui-react');

// Import EXIF reader
let exifr;
try {
  exifr = require('exifr');
} catch (error) {
  console.warn('[ImageContent] EXIFR not available:', error.message);
}

class ImageContent extends React.Component {
  constructor (props = {}) {
    super(props);

    this.settings = merge({
      state: {
        status: 'INITIALIZED',
        currentContent: '',
        error: null,
        loading: false,
        imageLoaded: false,
        imageMetrics: null,
        analyzingImage: false,
        exifData: null,
        loadingExif: false,
        exifError: null,
        activeTabIndex: 0
      }
    }, props);

    this.state = this.settings.state;

    return this;
  }

  componentDidMount () {
    this.fetchBlobContent();
  }

  componentDidUpdate (prevProps) {
    // Fetch blob content if latest_blob_id changes
    if (prevProps.latest_blob_id !== this.props.latest_blob_id) {
      this.fetchBlobContent();
    }
  }

  fetchBlobContent = async () => {
    const { latest_blob_id, content } = this.props;
    console.debug('[ImageContent] fetchBlobContent called with:', { latest_blob_id, contentLength: content?.length });

    // If we have content directly, use it
    if (content) {
      console.debug('[ImageContent] Using direct content');
      this.setState({ currentContent: content, status: 'READY' });
      return;
    }

    // If we have a blob ID, fetch the blob content
    if (latest_blob_id) {
      console.debug('[ImageContent] Fetching blob:', latest_blob_id);
      this.setState({ loading: true, error: null });
      try {
        const response = await fetch(`/blobs/${latest_blob_id}`);
        console.debug('[ImageContent] Response status:', response.status, response.statusText);
        console.debug('[ImageContent] Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }

        // For images, we can get as blob and create object URL
        const blob = await response.blob();
        console.debug('[ImageContent] Fetched blob data:', {
          blobSize: blob.size,
          blobType: blob.type,
          blobConstructor: blob.constructor.name
        });

        // Check if we got valid blob data
        if (blob.size === 0) {
          throw new Error('Received empty blob data');
        }

        const objectUrl = URL.createObjectURL(blob);
        console.debug('[ImageContent] Created object URL:', objectUrl);

        this.setState({
          currentContent: objectUrl,
          status: 'READY',
          loading: false
        });
      } catch (error) {
        console.error('[ImageContent] Error fetching blob:', error);
        this.setState({
          error: { message: `Failed to load image: ${error.message}` },
          loading: false,
          status: 'ERROR'
        });
      }
    } else {
      console.debug('[ImageContent] No blob_id or content provided');
      this.setState({ status: 'READY' });
    }
  };

  handleImageLoad = (event) => {
    this.setState({ imageLoaded: true });
    this.analyzeImage(event.target);
    this.extractExifData(event.target);
  };

  handleImageError = () => {
    this.setState({
      error: { message: 'Failed to load image' },
      imageLoaded: false
    });
  };

  extractExifData = async (imageElement) => {
    if (!exifr || !imageElement || !imageElement.src) {
      console.debug('[ImageContent] EXIF extraction not available');
      return;
    }

    this.setState({ loadingExif: true, exifError: null });

    try {
      // Extract EXIF data from the image
      const exifData = await exifr.parse(imageElement.src, {
        // Include all available EXIF data
        tiff: true,
        exif: true,
        gps: true,
        iptc: true,
        icc: true,
        pick: [
          // Camera info
          'Make', 'Model', 'Software', 'DateTime', 'DateTimeOriginal', 'DateTimeDigitized',
          // Camera settings
          'ExposureTime', 'FNumber', 'ExposureProgram', 'ISOSpeedRatings', 'ISO',
          'ExifVersion', 'ShutterSpeedValue', 'ApertureValue', 'BrightnessValue',
          'ExposureBiasValue', 'MaxApertureValue', 'MeteringMode', 'LightSource',
          'Flash', 'FocalLength', 'ColorSpace', 'WhiteBalance', 'DigitalZoomRatio',
          'FocalLengthIn35mmFilm', 'SceneCaptureType', 'GainControl', 'Contrast',
          'Saturation', 'Sharpness', 'SubjectDistanceRange',
          // Image dimensions
          'ImageWidth', 'ImageHeight', 'Orientation',
          // GPS data (if available)
          'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSTimeStamp', 'GPSDateStamp',
          'GPSLatitudeRef', 'GPSLongitudeRef', 'GPSAltitudeRef',
          // Technical details
          'XResolution', 'YResolution', 'ResolutionUnit', 'Compression',
          'PhotometricInterpretation', 'SamplesPerPixel', 'BitsPerSample'
        ]
      });

      console.debug('[ImageContent] Extracted EXIF data:', exifData);

      this.setState({
        exifData: exifData || {},
        loadingExif: false
      });
    } catch (error) {
      console.error('[ImageContent] Error extracting EXIF data:', error);
      this.setState({
        exifError: { message: 'Failed to extract EXIF data: ' + error.message },
        loadingExif: false
      });
    }
  };

  analyzeImage = (imageElement) => {
    if (!imageElement || !imageElement.complete) return;

    this.setState({ analyzingImage: true });

    try {
      // Create a canvas to extract pixel data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas size to match image
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      // Draw the image to canvas
      ctx.drawImage(imageElement, 0, 0);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Compute metrics
      const metrics = this.computeImageMetrics(pixels, canvas.width, canvas.height);

      this.setState({
        imageMetrics: metrics,
        analyzingImage: false
      });
    } catch (error) {
      console.error('[ImageContent] Error analyzing image:', error);
      this.setState({
        analyzingImage: false,
        error: { message: 'Failed to analyze image: ' + error.message }
      });
    }
  };

  computeImageMetrics = (pixels, width, height) => {
    const totalPixels = width * height;
    let totalR = 0, totalG = 0, totalB = 0;
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;

    // Color histogram buckets (simplified to 8 buckets per channel)
    const rHist = new Array(8).fill(0);
    const gHist = new Array(8).fill(0);
    const bHist = new Array(8).fill(0);

    // Brightness histogram
    const brightnessHist = new Array(8).fill(0);

    // Process each pixel (RGBA format, so step by 4)
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      // Alpha channel is pixels[i + 3], but we'll ignore it for now

      // Sum for averages
      totalR += r;
      totalG += g;
      totalB += b;

      // Min/max values
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
      minG = Math.min(minG, g);
      maxG = Math.max(maxG, g);
      minB = Math.min(minB, b);
      maxB = Math.max(maxB, b);

      // Histogram buckets (divide 0-255 into 8 buckets)
      rHist[Math.floor(r / 32)]++;
      gHist[Math.floor(g / 32)]++;
      bHist[Math.floor(b / 32)]++;

      // Brightness (using luminance formula)
      const brightness = Math.floor((0.299 * r + 0.587 * g + 0.114 * b) / 32);
      brightnessHist[Math.min(brightness, 7)]++;
    }

    // Calculate averages
    const avgR = Math.round(totalR / totalPixels);
    const avgG = Math.round(totalG / totalPixels);
    const avgB = Math.round(totalB / totalPixels);

    // Calculate brightness and contrast
    const avgBrightness = Math.round((0.299 * avgR + 0.587 * avgG + 0.114 * avgB));
    const contrast = Math.round(((maxR - minR) + (maxG - minG) + (maxB - minB)) / 3);

    // Color balance (normalized ratios)
    const colorSum = avgR + avgG + avgB;
    const redBalance = colorSum > 0 ? (avgR / colorSum) : 0;
    const greenBalance = colorSum > 0 ? (avgG / colorSum) : 0;
    const blueBalance = colorSum > 0 ? (avgB / colorSum) : 0;

    // Dominant color analysis
    const dominantChannel = avgR > avgG && avgR > avgB ? 'Red' :
                           avgG > avgB ? 'Green' : 'Blue';

    // Color temperature estimation (simplified)
    const colorTemp = this.estimateColorTemperature(avgR, avgG, avgB);

    return {
      dimensions: { width, height },
      totalPixels,
      averageColor: { r: avgR, g: avgG, b: avgB },
      colorRange: {
        red: { min: minR, max: maxR },
        green: { min: minG, max: maxG },
        blue: { min: minB, max: maxB }
      },
      colorBalance: {
        red: Math.round(redBalance * 100) / 100,
        green: Math.round(greenBalance * 100) / 100,
        blue: Math.round(blueBalance * 100) / 100
      },
      brightness: avgBrightness,
      contrast,
      dominantChannel,
      colorTemperature: colorTemp,
      histograms: {
        red: rHist,
        green: gHist,
        blue: bHist,
        brightness: brightnessHist
      }
    };
  };

  estimateColorTemperature = (r, g, b) => {
    // Simplified color temperature estimation
    // Warmer images have more red/yellow, cooler have more blue
    const redBlueRatio = r / Math.max(b, 1);
    if (redBlueRatio > 1.2) return 'Warm';
    if (redBlueRatio < 0.8) return 'Cool';
    return 'Neutral';
  };

  getMimeTypeDisplay = () => {
    const { mime_type } = this.props;
    if (!mime_type) return 'Unknown';

    // Create a more readable display of the mime type
    const mimeMap = {
      'image/jpeg': 'JPEG Image',
      'image/jpg': 'JPEG Image',
      'image/png': 'PNG Image',
      'image/gif': 'GIF Image',
      'image/webp': 'WebP Image',
      'image/svg+xml': 'SVG Image',
      'image/bmp': 'BMP Image',
      'image/tiff': 'TIFF Image'
    };

    return mimeMap[mime_type] || mime_type.toUpperCase();
  };

  getEncodingColor = () => {
    const { mime_type } = this.props;
    if (!mime_type) return 'grey';

    // Color code different image types
    const colorMap = {
      'image/jpeg': 'orange',
      'image/jpg': 'orange',
      'image/png': 'blue',
      'image/gif': 'purple',
      'image/webp': 'green',
      'image/svg+xml': 'teal',
      'image/bmp': 'red',
      'image/tiff': 'brown'
    };

    return colorMap[mime_type] || 'grey';
  };

  renderImage = () => {
    const { currentContent } = this.state;
    const { mime_type } = this.props;

    if (!currentContent) {
      return (
        <Message info>
          <Message.Header>No Image Data</Message.Header>
          <p>This document contains no image data to display.</p>
        </Message>
      );
    }

    // Determine if content is a data URL or object URL
    const isDataUrl = currentContent.startsWith('data:');
    const isObjectUrl = currentContent.startsWith('blob:');
    const imageSrc = isDataUrl || isObjectUrl ? currentContent : `data:${mime_type || 'image/png'};base64,${currentContent}`;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1em',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#fafafa'
      }}>
        <img
          src={imageSrc}
          alt="Document content"
          onLoad={this.handleImageLoad}
          onError={this.handleImageError}
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            objectFit: 'contain',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white'
          }}
        />
        {this.state.imageLoaded && (
          <div style={{
            marginTop: '0.5em',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center'
          }}>
            Click to view full size
          </div>
        )}
      </div>
    );
  };

  renderImageMetrics = () => {
    const { imageMetrics, analyzingImage } = this.state;

    if (analyzingImage) {
      return (
        <div style={{ marginTop: '1em', textAlign: 'center' }}>
          <Message icon size='tiny'>
            <Icon name='circle notched' loading />
            <Message.Content>
              <Message.Header>Analyzing Image</Message.Header>
              <p>Computing pixel data and color metrics...</p>
            </Message.Content>
          </Message>
        </div>
      );
    }

    if (!imageMetrics) {
      return null;
    }

    const { averageColor, colorBalance, dimensions, totalPixels, brightness, contrast, dominantChannel, colorTemperature } = imageMetrics;

    return (
      <div style={{ marginTop: '1.5em', padding: '1em', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <Header as='h4' style={{ marginBottom: '1em' }}>
          <Icon name='chart bar' />
          Image Analysis
        </Header>

        <Grid columns={2} stackable>
          <Grid.Column>
            <Header as='h5'>Basic Properties</Header>
            <Statistic.Group size='mini' widths='2'>
              <Statistic>
                <Statistic.Value>{dimensions.width}×{dimensions.height}</Statistic.Value>
                <Statistic.Label>Dimensions</Statistic.Label>
              </Statistic>
              <Statistic>
                <Statistic.Value>{totalPixels.toLocaleString()}</Statistic.Value>
                <Statistic.Label>Total Pixels</Statistic.Label>
              </Statistic>
            </Statistic.Group>

            <Header as='h5' style={{ marginTop: '1em' }}>Average Color</Header>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
              <div
                style={{
                  width: '60px',
                  height: '30px',
                  backgroundColor: `rgb(${averageColor.r}, ${averageColor.g}, ${averageColor.b})`,
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                RGB({averageColor.r}, {averageColor.g}, {averageColor.b})
              </span>
            </div>

            <Header as='h5' style={{ marginTop: '1em' }}>Image Characteristics</Header>
            <div style={{ fontSize: '14px' }}>
              <div><strong>Brightness:</strong> {brightness}/255 ({Math.round((brightness/255)*100)}%)</div>
              <div><strong>Contrast:</strong> {contrast}/255 ({Math.round((contrast/255)*100)}%)</div>
              <div><strong>Dominant Channel:</strong> {dominantChannel}</div>
              <div><strong>Color Temperature:</strong> {colorTemperature}</div>
            </div>
          </Grid.Column>

          <Grid.Column>
            <Header as='h5'>Color Balance</Header>
            <div style={{ marginBottom: '1em' }}>
              <div style={{ marginBottom: '0.5em' }}>
                <Label size='tiny' color='red'>Red</Label>
                <Progress
                  percent={Math.round(colorBalance.red * 100)}
                  size='tiny'
                  color='red'
                  style={{ margin: '0.25em 0' }}
                />
              </div>
              <div style={{ marginBottom: '0.5em' }}>
                <Label size='tiny' color='green'>Green</Label>
                <Progress
                  percent={Math.round(colorBalance.green * 100)}
                  size='tiny'
                  color='green'
                  style={{ margin: '0.25em 0' }}
                />
              </div>
              <div style={{ marginBottom: '0.5em' }}>
                <Label size='tiny' color='blue'>Blue</Label>
                <Progress
                  percent={Math.round(colorBalance.blue * 100)}
                  size='tiny'
                  color='blue'
                  style={{ margin: '0.25em 0' }}
                />
              </div>
            </div>

            <Header as='h5'>Color Distribution</Header>
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <div style={{ marginBottom: '0.5em' }}>
                <strong>Red histogram:</strong> {imageMetrics.histograms.red.map((val, i) => `${Math.round((val/totalPixels)*100)}%`).join(', ')}
              </div>
              <div style={{ marginBottom: '0.5em' }}>
                <strong>Green histogram:</strong> {imageMetrics.histograms.green.map((val, i) => `${Math.round((val/totalPixels)*100)}%`).join(', ')}
              </div>
              <div style={{ marginBottom: '0.5em' }}>
                <strong>Blue histogram:</strong> {imageMetrics.histograms.blue.map((val, i) => `${Math.round((val/totalPixels)*100)}%`).join(', ')}
              </div>
            </div>
          </Grid.Column>
        </Grid>
      </div>
    );
  };

  renderExifData = () => {
    const { exifData, loadingExif, exifError } = this.state;

    if (loadingExif) {
      return (
        <div style={{ textAlign: 'center', padding: '2em' }}>
          <Message icon size='tiny'>
            <Icon name='circle notched' loading />
            <Message.Content>
              <Message.Header>Extracting EXIF Data</Message.Header>
              <p>Reading image metadata...</p>
            </Message.Content>
          </Message>
        </div>
      );
    }

    if (exifError) {
      return (
        <Message warning>
          <Message.Header>EXIF Extraction Failed</Message.Header>
          <p>{exifError.message}</p>
        </Message>
      );
    }

    if (!exifData || Object.keys(exifData).length === 0) {
      return (
        <Message info>
          <Message.Header>No EXIF Data Available</Message.Header>
          <p>This image does not contain EXIF metadata, or the metadata has been stripped.</p>
        </Message>
      );
    }

    // Helper function to format values
    const formatValue = (key, value) => {
      if (value === null || value === undefined) return 'N/A';

      // Handle special formatting for certain fields
      switch (key) {
        case 'ExposureTime':
          return typeof value === 'number' ? `1/${Math.round(1/value)} sec` : value;
        case 'FNumber':
        case 'ApertureValue':
          return typeof value === 'number' ? `f/${value.toFixed(1)}` : value;
        case 'FocalLength':
          return typeof value === 'number' ? `${value}mm` : value;
        case 'FocalLengthIn35mmFilm':
          return typeof value === 'number' ? `${value}mm (35mm equivalent)` : value;
        case 'ISO':
        case 'ISOSpeedRatings':
          return `ISO ${value}`;
        case 'Flash':
          return typeof value === 'number' ? (value & 1 ? 'Flash fired' : 'No flash') : value;
        case 'DateTime':
        case 'DateTimeOriginal':
        case 'DateTimeDigitized':
          return value instanceof Date ? value.toLocaleString() : value;
        case 'GPSLatitude':
        case 'GPSLongitude':
          return typeof value === 'number' ? value.toFixed(6) + '°' : value;
        case 'GPSAltitude':
          return typeof value === 'number' ? `${value.toFixed(1)}m` : value;
        case 'Orientation':
          const orientations = {
            1: 'Normal', 2: 'Flipped horizontally', 3: 'Rotated 180°',
            4: 'Flipped vertically', 5: 'Rotated 90° CCW, flipped', 6: 'Rotated 90° CW',
            7: 'Rotated 90° CW, flipped', 8: 'Rotated 90° CCW'
          };
          return orientations[value] || value;
        default:
          return typeof value === 'number' ? value.toLocaleString() : String(value);
      }
    };

    // Group EXIF data by category
    const cameraInfo = {};
    const cameraSettings = {};
    const imageInfo = {};
    const gpsInfo = {};
    const technicalInfo = {};

    Object.entries(exifData).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();

      if (['make', 'model', 'software', 'datetime', 'datetimeoriginal', 'datetimedigitized'].includes(lowerKey)) {
        cameraInfo[key] = value;
      } else if (['exposuretime', 'fnumber', 'iso', 'isospeedratings', 'focallength', 'focallength35', 'focallengthIn35mmfilm', 'flash', 'whitebalance', 'meteringmode', 'exposureprogram'].includes(lowerKey)) {
        cameraSettings[key] = value;
      } else if (['imagewidth', 'imageheight', 'orientation', 'colorspace', 'xresolution', 'yresolution'].includes(lowerKey)) {
        imageInfo[key] = value;
      } else if (lowerKey.startsWith('gps')) {
        gpsInfo[key] = value;
      } else {
        technicalInfo[key] = value;
      }
    });

    const renderSection = (title, data, iconName) => {
      if (Object.keys(data).length === 0) return null;

      return (
        <div style={{ marginBottom: '1.5em' }}>
          <Header as='h5'>
            <Icon name={iconName} />
            {title}
          </Header>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1em',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '13px'
          }}>
            {Object.entries(data).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '0.5em', display: 'flex' }}>
                <strong style={{ minWidth: '180px', color: '#555' }}>{key}:</strong>
                <span style={{ marginLeft: '1em' }}>{formatValue(key, value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div style={{ padding: '1em' }}>
        <Header as='h4' style={{ marginBottom: '1.5em' }}>
          <Icon name='info circle' />
          EXIF Metadata
        </Header>

        <Grid columns={1} stackable>
          <Grid.Column>
            {renderSection('Camera Information', cameraInfo, 'camera')}
            {renderSection('Camera Settings', cameraSettings, 'settings')}
            {renderSection('Image Properties', imageInfo, 'image')}
            {renderSection('GPS Location', gpsInfo, 'map marker')}
            {renderSection('Technical Details', technicalInfo, 'cog')}
          </Grid.Column>
        </Grid>

        {Object.keys(gpsInfo).length > 0 && gpsInfo.GPSLatitude && gpsInfo.GPSLongitude && (
          <Message info>
            <Message.Header>Location Data Available</Message.Header>
            <p>This image contains GPS coordinates: {formatValue('GPSLatitude', gpsInfo.GPSLatitude)}, {formatValue('GPSLongitude', gpsInfo.GPSLongitude)}</p>
          </Message>
        )}
      </div>
    );
  };

  handleTabChange = (e, { activeIndex }) => {
    this.setState({ activeTabIndex: activeIndex });
  };

  render () {
    const { error, loading, status, activeTabIndex } = this.state;

    // Define tab panes for analysis data only (image stays outside tabs)
    const panes = [
      {
        menuItem: { key: 'analysis', icon: 'chart bar', content: 'Analysis' },
        render: () => (
          <Tab.Pane>
            {this.renderImageMetrics()}
          </Tab.Pane>
        )
      },
      {
        menuItem: { key: 'exif', icon: 'info circle', content: 'EXIF' },
        render: () => (
          <Tab.Pane>
            {this.renderExifData()}
          </Tab.Pane>
        )
      }
    ];

    return (
      <fabric-image-content>
        <div style={{ marginBottom: '1em' }}>
          <Label
            color={this.getEncodingColor()}
            size='medium'
            style={{ marginBottom: '0.5em' }}
          >
            <Icon name='image' />
            {this.getMimeTypeDisplay()}
          </Label>
        </div>

        {error && (
          <Message negative>
            <Message.Header>Error</Message.Header>
            <p>{error.content || error.message || 'An error occurred while displaying the image content.'}</p>
          </Message>
        )}

        {loading && (
          <Message icon>
            <Icon name='circle notched' loading />
            <Message.Content>
              <Message.Header>Loading Image</Message.Header>
              <p>Fetching image data...</p>
            </Message.Content>
          </Message>
        )}

        {!loading && !error && (
          <div>
            {/* Image always displayed at the top */}
            <Segment style={{ marginBottom: '1em' }}>
              {this.renderImage()}
            </Segment>

            {/* Tabs below for analysis and metadata */}
            <Tab
              panes={panes}
              activeIndex={activeTabIndex}
              onTabChange={this.handleTabChange}
            />
          </div>
        )}
      </fabric-image-content>
    );
  }

  toHTML () {
    return require('react-dom/server').renderToString(this.render());
  }
}

module.exports = ImageContent;