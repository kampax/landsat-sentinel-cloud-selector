// Sentinel-2 Cloud Selection App - English Version
// Author: Carlos Javier Navarro 2025

// Global variables for geometry and lists
var geometry;
var pixels;
var pixels2;
var IC;

// Lists of images with clouds - can be filled manually as they are identified
var withCloudS2 = [
  // Here you can add the IDs of Sentinel-2 images with clouds after visual review
  // Example: "20180101T105421_20180101T105415_T30SYJ", 
];

// Function to apply scale factors for Sentinel-2
function applyScaleFactorsS2(image) {
  // Sentinel-2 SR bands are already in reflectance (0-10000), scale to 0-1
  var opticalBands = image.select(['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B11', 'B12']).multiply(0.0001);
  return image.addBands(opticalBands, null, true);
}

// Define Start and End Dates
var startDate = '2015-06-01';
var endDate = '2025-12-31';

// Function to load Sentinel-2 collection
function loadSentinel2Collection() {
  if (!geometry) {
    print('Please draw a study area first');
    return ee.ImageCollection([]);
  }
  
  var collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                   .filterBounds(geometry)
                   .filter(ee.Filter.inList('system:index', withCloudS2).not())
                   .filterDate(startDate, endDate)
                   // Filter by cloud coverage (optional - you can adjust the threshold)
                   .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 80));
  
  return collection.map(function(image) {
    return applyScaleFactorsS2(image);
  });
}

// Function to update the drawing tools
function updateGeometry(newGeometry) {
  geometry = newGeometry;
  
  // Update pixels visualization
  var empty = ee.Image().byte();
  pixels2 = empty.paint({
    featureCollection: ee.FeatureCollection([ee.Feature(geometry)]),
    color: 1,
    width: 3
  });
  
  // Reload collection with new geometry
  IC = loadSentinel2Collection();
  
  // Update image selector
  if (IC.size().getInfo() > 0) {
    var opciones = IC.toList(IC.size()).map(function(image) {
      return ee.Image(image).get('system:index');
    });
    selectImage.items().reset(opciones.getInfo());
    selectImage.setPlaceholder('Select an image');
  } else {
    selectImage.items().reset([]);
    selectImage.setPlaceholder('No images found for this area');
  }
  
  Map.centerObject(geometry, 12);
}

// Create widgets for date selection
var startDateInput = ui.Textbox({
  value: startDate,
  placeholder: 'YYYY-MM-DD',
  onChange: function(value) {
    startDate = value;
  }
});

var endDateInput = ui.Textbox({
  value: endDate,
  placeholder: 'YYYY-MM-DD',
  onChange: function(value) {
    endDate = value;
  }
});

// Function to filter images by date
var filterImagesByDate = function() {
  var minDate = '2015-06-23';
  var maxDate = '2025-12-31';

  if (startDate < minDate || endDate > maxDate) {
    print('Error: Selected date range is not valid for Sentinel-2. ' + 
            'Dates must be between ' + minDate + ' and ' + maxDate + '.');
    return;
  }

  if (!geometry) {
    print('Please draw a study area first');
    return;
  }

  var collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                     .filterBounds(geometry)
                     .filter(ee.Filter.inList('system:index', withCloudS2).not())
                     .filterDate(startDate, endDate)
                     .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 80));
  
  collection = collection.map(function(image) {
    return applyScaleFactorsS2(image);
  });

  var opciones = collection.toList(collection.size()).map(function(image) {
    return ee.Image(image).get('system:index');
  });
  selectImage.items().reset(opciones.getInfo());
  selectImage.setPlaceholder('Select an image');
  IC = collection;
  
  print('Images found:', collection.size().getInfo());
};

// Create button to change dates
var changeDatesButton = ui.Button({
  label: 'Update Dates',
  onClick: filterImagesByDate
});

// Widget to filter by cloud percentage
var cloudCoverageInput = ui.Textbox({
  value: '80',
  placeholder: 'Max cloud percentage (%)',
  onChange: function(value) {
    // Will be processed when clicking the button
  }
});

var filterCloudButton = ui.Button({
  label: 'Filter by Clouds',
  onClick: function() {
    var maxCloudCoverage = parseFloat(cloudCoverageInput.getValue()) || 80;
    
    if (!geometry) {
      print('Please draw a study area first');
      return;
    }
    
    var collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                       .filterBounds(geometry)
                       .filter(ee.Filter.inList('system:index', withCloudS2).not())
                       .filterDate(startDate, endDate)
                       .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', maxCloudCoverage));
    
    collection = collection.map(function(image) {
      return applyScaleFactorsS2(image);
    });

    var opciones = collection.toList(collection.size()).map(function(image) {
      return ee.Image(image).get('system:index');
    });
    selectImage.items().reset(opciones.getInfo());
    selectImage.setPlaceholder('Select an image');
    IC = collection;
    
    print('Images found with <' + maxCloudCoverage + '% clouds:', collection.size().getInfo());
  }
});

// Create panels for dates and buttons
var datePanel1 = ui.Panel([
  ui.Label('Start date (from 2015-06-23):'),
  startDateInput
]);

var datePanel2 = ui.Panel([
  ui.Label('End date (to present):'),
  endDateInput,
  changeDatesButton
]);

var cloudPanel = ui.Panel([
  ui.Label('Cloud coverage filter:'),
  cloudCoverageInput,
  filterCloudButton
]);

// Drawing tools for study area
var drawingTools = Map.drawingTools();
drawingTools.setShown(false);

// Create drawing instruction panel
var drawingPanel = ui.Panel([
  ui.Label('Step 1: Draw your study area', {fontWeight: 'bold', color: 'red'}),
  ui.Label('Click the button below, then draw a rectangle on the map')
]);

var drawButton = ui.Button({
  label: '📍 Draw Study Area',
  onClick: function() {
    // Clear any existing drawings
    drawingTools.layers().reset();
    drawingTools.setShown(true);
    drawingTools.setShape('rectangle');
    drawingTools.draw();
    drawButton.setLabel('🔄 Redraw Study Area');
  }
});

drawingPanel.add(drawButton);

// Handle drawing events
drawingTools.onDraw(function(geometry) {
  updateGeometry(geometry);
  // Hide drawing tools but keep the geometry visible through our custom overlay
  drawingTools.setShown(false);
  // Clear the drawing tools layer since we show our own border
  drawingTools.layers().reset();
  print('Study area defined. You can now select images.');
});

drawingTools.onEdit(function(geometry) {
  updateGeometry(geometry);
});

// App title
var header = ui.Label('Sentinel-2 Image Visualization App', {fontSize: '30px', fontWeight: 'bold', color: '7393B3'});
var subheader = ui.Label('Visual selection tool for Sentinel-2 images', {fontSize: '20px', fontWeight: 'bold'});

// App summary
var text = ui.Label(
  'This application allows you to visualize images from the Sentinel-2 SR Harmonized collection. First draw your study area, set the dates of interest, adjust the cloud filter, and then select images one by one. You can mark images as cloudy or clear, and generate lists of IDs for subsequent filtering.', 
  {fontSize: '15px'}
);

// Create main panel
var mainPanel = ui.Panel({
  widgets: [header, subheader, text],
  style: {width: '500px', position: 'top-left'}
});

// Create separator
var intro = ui.Panel([
  ui.Label({
    value: '____________________________________________',
    style: {fontWeight: 'bold', color: '7393B3'},
  }),
]);

// Add panels to main panel
mainPanel.add(intro);
mainPanel.add(drawingPanel);
mainPanel.add(datePanel1);
mainPanel.add(datePanel2);
mainPanel.add(cloudPanel);

// Initialize empty collection
IC = ee.ImageCollection([]);

// Create image selector
var selectImage = ui.Select({
  items: [],
  placeholder: 'First draw your study area'
});

// Function to update map when user selects an image
selectImage.onChange(function(selectedImageIndex) {
  if (!selectedImageIndex || !geometry) return;
  
  var selectedImage = IC.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
  
  // RGB visualization for Sentinel-2 (bands B4, B3, B2 = Red, Green, Blue)
  var selectedImageVis = {
    bands: ['B4', 'B3', 'B2'],
    min: 0.0,
    max: 0.3
  };
  
  Map.layers().reset();
  Map.addLayer(selectedImage, selectedImageVis, 'Selected Sentinel-2 Image');
  if (pixels2) {
    Map.addLayer(pixels2, {palette: ['red']}, "Study Area");
  }
  
  // Show image information
  var cloudCoverage = selectedImage.get('CLOUDY_PIXEL_PERCENTAGE');
  var date = selectedImage.get('system:time_start');
  var imageDate = ee.Date(date).format('yyyy-MM-dd');
  
  print('Selected image:', selectedImageIndex);
  print('Date:', imageDate.getInfo());
  print('Cloud coverage (%):', cloudCoverage.getInfo());
});

// Create lists for images with and without clouds
var cloudyImagesList = [];
var clearImagesList = [];

// Function to visualize selected image
var visualizeImage = function(selectedImageIndex) {
  if (!selectedImageIndex || !geometry) return;
  
  var selectedImage = IC.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
  
  var selectedImageVis = {
    bands: ['B4', 'B3', 'B2'], // RGB for Sentinel-2
    min: 0.0,
    max: 0.3
  };
  
  Map.layers().reset();
  Map.addLayer(selectedImage, selectedImageVis, 'Selected Sentinel-2 Image');
  if (pixels2) {
    Map.addLayer(pixels2, {palette: ['red']}, "Study Area");
  }
};

// Update selector with change handler
selectImage = ui.Select({
  items: [],
  placeholder: 'First draw your study area',
  onChange: function(selectedImageIndex) {
    visualizeImage(selectedImageIndex);
  }
});

// Add image selector to map
Map.add(selectImage);

// Create panel for cloudy images
var cloudyPanel = ui.Panel();
var cloudyLabel = ui.Label('Cloudy images: ');

// Function to update cloudy images list and display
var updateCloudyList = function() {
  var cloudyString = cloudyImagesList.join(', ');
  cloudyLabel.setValue('Cloudy images: ' + cloudyString);
  updateExportPanel();
};

// Function to save cloudy image ID
var saveCloudyImage = function() {
  var selectedImageIndex = selectImage.getValue();
  if (!selectedImageIndex) {
    print('Please select an image first');
    return;
  }
  var selectedImage = IC.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
  var imageId = selectedImage.get('system:index').getInfo();
  
  // Avoid duplicates
  if (cloudyImagesList.indexOf(imageId) === -1) {
    cloudyImagesList.push(imageId);
    updateCloudyList();
  }
};

// Create button for cloudy images
var cloudyButton = ui.Button('Mark as Cloudy', saveCloudyImage);

// Add label and button to panel
cloudyPanel.add(cloudyLabel);
cloudyPanel.add(cloudyButton);

// Add panel to main panel
mainPanel.add(cloudyPanel);

// Create panel for clear images
var clearPanel = ui.Panel();
var clearLabel = ui.Label('Clear images: ');

// Function to update clear images list and display
var updateClearList = function() {
  var clearString = clearImagesList.join(', ');
  clearLabel.setValue('Clear images: ' + clearString);
  updateExportPanel();
};

// Function to save clear image ID
var saveClearImage = function() {
  var selectedImageIndex = selectImage.getValue();
  if (!selectedImageIndex) {
    print('Please select an image first');
    return;
  }
  var selectedImage = IC.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
  var imageId = selectedImage.get('system:index').getInfo();
  
  // Avoid duplicates
  if (clearImagesList.indexOf(imageId) === -1) {
    clearImagesList.push(imageId);
    updateClearList();
  }
};

// Create button for clear images
var clearButton = ui.Button('Mark as Clear', saveClearImage);

// Add label and button to panel
clearPanel.add(clearLabel);
clearPanel.add(clearButton);

// Add panel to main panel
mainPanel.add(clearPanel);

// Panel to display exported lists
var exportPanel = ui.Panel({
  style: {border: '1px solid gray', padding: '10px', margin: '5px'}
});

var exportLabel = ui.Label('Image Lists:', {fontWeight: 'bold', fontSize: '16px'});
var cloudyExportLabel = ui.Label('CLOUDY images: None selected');
var clearExportLabel = ui.Label('CLEAR images: None selected');
var totalLabel = ui.Label('Total: 0 cloudy, 0 clear');

exportPanel.add(exportLabel);
exportPanel.add(cloudyExportLabel);
exportPanel.add(clearExportLabel);
exportPanel.add(totalLabel);

// Function to update export panel
var updateExportPanel = function() {
  var cloudyFormatted = cloudyImagesList.length > 0 ? 
    '[\"' + cloudyImagesList.join('\", \"') + '\"]' : 'None selected';
  var clearFormatted = clearImagesList.length > 0 ? 
    '[\"' + clearImagesList.join('\", \"') + '\"]' : 'None selected';
  
  cloudyExportLabel.setValue('CLOUDY images: ' + cloudyFormatted);
  clearExportLabel.setValue('CLEAR images: ' + clearFormatted);
  totalLabel.setValue('Total: ' + cloudyImagesList.length + ' cloudy, ' + clearImagesList.length + ' clear');
};

// Button to show formatted lists
var showListsButton = ui.Button({
  label: 'Show Formatted Lists',
  onClick: updateExportPanel
});

mainPanel.add(showListsButton);
mainPanel.add(exportPanel);

// Button to clear lists
var clearListsButton = ui.Button({
  label: 'Clear Lists',
  onClick: function() {
    cloudyImagesList = [];
    clearImagesList = [];
    updateCloudyList();
    updateClearList();
    updateExportPanel();
    print('Lists cleared');
  }
});

mainPanel.add(clearListsButton);

// Panel for different visualizations
var visPanel = ui.Panel([
  ui.Label('Visualization Options:', {fontWeight: 'bold'})
]);

var rgbButton = ui.Button({
  label: 'Natural RGB',
  onClick: function() {
    var selectedImageIndex = selectImage.getValue();
    if (!selectedImageIndex) {
      print('Please select an image first');
      return;
    }
    var selectedImage = IC.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
    var visParams = {
      bands: ['B4', 'B3', 'B2'],
      min: 0.0,
      max: 0.3
    };
    Map.layers().reset();
    Map.addLayer(selectedImage, visParams, 'Natural RGB');
    if (pixels2) {
      Map.addLayer(pixels2, {palette: ['red']}, "Study Area");
    }
  }
});

var nirButton = ui.Button({
  label: 'False Color (NIR)',
  onClick: function() {
    var selectedImageIndex = selectImage.getValue();
    if (!selectedImageIndex) {
      print('Please select an image first');
      return;
    }
    var selectedImage = IC.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
    var visParams = {
      bands: ['B8', 'B4', 'B3'], // NIR, Red, Green
      min: 0.0,
      max: 0.3
    };
    Map.layers().reset();
    Map.addLayer(selectedImage, visParams, 'False Color NIR');
    if (pixels2) {
      Map.addLayer(pixels2, {palette: ['red']}, "Study Area");
    }
  }
});

var swirButton = ui.Button({
  label: 'SWIR Composite',
  onClick: function() {
    var selectedImageIndex = selectImage.getValue();
    if (!selectedImageIndex) {
      print('Please select an image first');
      return;
    }
    var selectedImage = IC.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
    var visParams = {
      bands: ['B12', 'B8', 'B4'], // SWIR, NIR, Red
      min: 0.0,
      max: 0.3
    };
    Map.layers().reset();
    Map.addLayer(selectedImage, visParams, 'SWIR Composite');
    if (pixels2) {
      Map.addLayer(pixels2, {palette: ['red']}, "Study Area");
    }
  }
});

visPanel.add(rgbButton);
visPanel.add(nirButton);
visPanel.add(swirButton);
mainPanel.add(visPanel);

// Citation
var citation = ui.Label('Author: Carlos Javier Navarro 2025. Adapted for Sentinel-2', {fontSize: '14px', color: 'gray'});

// Create citation panel
var citationPanel = ui.Panel([citation]);

// Add citation panel to main panel
mainPanel.add(citationPanel);

// Add main panel to GUI root
ui.root.insert(0, mainPanel);

// Initial information
print('=== SENTINEL-2 IMAGE SELECTOR APP ===');
print('Collection: COPERNICUS/S2_SR_HARMONIZED');
print('Initial date range:', startDate, 'to', endDate);
print('Instructions:');
print('1. Draw your study area using the drawing tool');
print('2. Adjust dates and cloud filters if needed');
print('3. Select images from the dropdown list');
print('4. Mark images as cloudy or clear');
print('5. Use "Show Formatted Lists" to get the final arrays');

// Set initial map view
Map.setCenter(0, 0, 2);