// Landsat Cloud Selection App - English Version
// Author: Carlos Javier Navarro 2025

// Global variables for geometry and lists
var geometry;
var pixels;
var pixels2;
var EMD;

// Lists of images with clouds - can be filled manually as they are identified
var withCloudL4 = [];
var withCloudL5 = [];
var withCloudL7 = [];
var withCloudL8 = [];
var withCloudL9 = [];

// Function to apply scale factors
function applyScaleFactors(image, landsatVersion) {
  if (landsatVersion === 'Landsat 4' || landsatVersion === 'Landsat 5' || landsatVersion === 'Landsat 7') {
    var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
    var thermalBand = image.select('ST_B6').multiply(0.00341802).add(149.0);
  } else if (landsatVersion === 'Landsat 8' || landsatVersion === 'Landsat 9') {
    var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
    var thermalBand = image.select('ST_B10').multiply(0.00341802).add(149.0);
  }
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBand, null, true);
}

// Define Start and End Dates
var startDate = '2000-06-01';
var endDate = '2025-05-31';

// Function to load Landsat collections based on user selection
function loadLandsatCollection(landsatVersion) {
  if (!geometry) {
    print('Please draw a study area first');
    return ee.ImageCollection([]);
  }
  
  var collection;
  var cloudList = [];
  
  if (landsatVersion === 'Landsat 4') {
    collection = ee.ImageCollection('LANDSAT/LT04/C02/T1_L2')
                   .filterBounds(geometry)
                   .filter(ee.Filter.inList('system:index', withCloudL4).not())
                   .filterDate(startDate, endDate);
  } else if (landsatVersion === 'Landsat 5') {
    collection = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
                   .filterBounds(geometry)
                   .filter(ee.Filter.inList('system:index', withCloudL5).not())
                   .filterDate(startDate, endDate);
  } else if (landsatVersion === 'Landsat 7') {
    collection = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2')
                   .filterBounds(geometry)
                   .filter(ee.Filter.inList('system:index', withCloudL7).not())
                   .filter(ee.Filter.or(
                     ee.Filter.date('1999-10-01', '2003-06-01'),
                     ee.Filter.date('2010-06-01', '2013-06-30')
                   ));
  } else if (landsatVersion === 'Landsat 8') {
    collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
                   .filterBounds(geometry)
                   .filter(ee.Filter.inList('system:index', withCloudL8).not())
                   .filterDate(startDate, endDate);
  } else if (landsatVersion === 'Landsat 9') {
    collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
                   .filterBounds(geometry)
                   .filter(ee.Filter.inList('system:index', withCloudL9).not())
                   .filterDate(startDate, endDate);
  }
  
  return collection.map(function(image) {
    return applyScaleFactors(image, landsatVersion);
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
  
  // Reload collection with new geometry if Landsat version is selected
  var selectedVersion = landsatSelector.getValue();
  if (selectedVersion) {
    EMD = loadLandsatCollection(selectedVersion);
    
    // Update image selector
    if (EMD.size().getInfo() > 0) {
      var opciones = EMD.toList(EMD.size()).map(function(image) {
        return ee.Image(image).get('system:index');
      });
      selectImage.items().reset(opciones.getInfo());
      selectImage.setPlaceholder('Select an image');
    } else {
      selectImage.items().reset([]);
      selectImage.setPlaceholder('No images found for this area and period');
    }
  }
  
  Map.centerObject(geometry, 12);
}

// Function to update the date inputs based on the selected Landsat version
function updateDateInputs(selectedVersion) {
  var minDate, maxDate;
  if (selectedVersion === 'Landsat 4') {
    minDate = '1982-08-22';
    maxDate = '1993-06-24';
  } else if (selectedVersion === 'Landsat 5') {
    minDate = '1984-03-16';
    maxDate = '2012-05-05';
  } else if (selectedVersion === 'Landsat 7') {
    minDate = '1999-04-15';
    maxDate = '2022-05-31';
  } else if (selectedVersion === 'Landsat 8') {
    minDate = '2013-03-18';
    maxDate = '2025-05-31';
  } else if (selectedVersion === 'Landsat 9') {
    minDate = '2021-10-31';
    maxDate = '2025-08-31';
  }

  // Update the date inputs
  startDateInput.setValue(minDate);
  endDateInput.setValue(maxDate);

  // Update the global startDate and endDate variables
  startDate = minDate;
  endDate = maxDate;
}

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
  print('Study area defined. You can now select a Landsat version and images.');
});

drawingTools.onEdit(function(geometry) {
  updateGeometry(geometry);
});

// Create a dropdown to select Landsat version
var landsatSelector = ui.Select({
  items: ['Landsat 4', 'Landsat 5', 'Landsat 7', 'Landsat 8', 'Landsat 9'],
  placeholder: 'Step 2: Select Landsat version',
  onChange: function(selectedVersion) {
    if (!geometry) {
      print('Please draw a study area first');
      landsatSelector.setValue(null);
      return;
    }
    
    // Update the date inputs
    updateDateInputs(selectedVersion);

    // Load the collection and update the image selector
    var collection = loadLandsatCollection(selectedVersion);
    var opciones = collection.toList(collection.size()).map(function(image) {
      return ee.Image(image).get('system:index');
    });
    selectImage.items().reset(opciones.getInfo());
    selectImage.setPlaceholder('Select an image');
    EMD = collection;
    
    print('Landsat', selectedVersion, 'collection loaded.');
    print('Images found:', collection.size().getInfo());
  }
});

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
  var selectedVersion = landsatSelector.getValue();
  if (!selectedVersion) {
    print('Please select a Landsat version first');
    return;
  }
  
  if (!geometry) {
    print('Please draw a study area first');
    return;
  }
  
  var minDate, maxDate;
  if (selectedVersion === 'Landsat 4') {
    minDate = '1982-08-22';
    maxDate = '1993-06-24';
  } else if (selectedVersion === 'Landsat 5') {
    minDate = '1984-03-16';
    maxDate = '2012-05-05';
  } else if (selectedVersion === 'Landsat 7') {
    minDate = '1999-04-15';
    maxDate = '2025-05-31';
  } else if (selectedVersion === 'Landsat 8') {
    minDate = '2013-03-18';
    maxDate = '2025-05-31';
  } else if (selectedVersion === 'Landsat 9') {
    minDate = '2021-10-31';
    maxDate = '2025-08-31'; 
  }

  if (startDate < minDate || endDate > maxDate) {
    print('Error: Selected date range is not valid for ' + selectedVersion + 
            '. Dates must be between ' + minDate + ' and ' + maxDate + '.');
    return;
  }

  var collection = loadLandsatCollection(selectedVersion);
  var opciones = collection.toList(collection.size()).map(function(image) {
    return ee.Image(image).get('system:index');
  });
  selectImage.items().reset(opciones.getInfo());
  selectImage.setPlaceholder('Select an image');
  EMD = collection;
  
  print('Images found for date range:', collection.size().getInfo());
};

// Create button to change dates
var changeDatesButton = ui.Button({
  label: 'Update Dates',
  onClick: filterImagesByDate
});

// Create panels for dates and buttons
var datePanel1 = ui.Panel([
  ui.Label('Start date:'),
  startDateInput
]);

var datePanel2 = ui.Panel([
  ui.Label('End date:'),
  endDateInput,
  changeDatesButton
]);

// App title
var header = ui.Label('Landsat Image Visualization App', {fontSize: '30px', fontWeight: 'bold', color: '7393B3'});
var subheader = ui.Label('Visual selection tool for Landsat images (L4, L5, L7, L8, L9)', {fontSize: '20px', fontWeight: 'bold'});

// App summary
var text = ui.Label(
  'This application allows you to visualize images from Landsat collections 4, 5, 7, 8, and 9. First draw your study area, select the Landsat version, define the dates of interest, and then select images one by one. You can mark images as cloudy or clear, and generate lists of IDs for subsequent filtering.', 
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
mainPanel.add(landsatSelector);
mainPanel.add(datePanel1);
mainPanel.add(datePanel2);

// Initialize empty collection
EMD = ee.ImageCollection([]);

// Create image selector
var selectImage = ui.Select({
  items: [],
  placeholder: 'First draw your study area and select Landsat version'
});

// Function to update map when user selects an image
selectImage.onChange(function(selectedImageIndex) {
  if (!selectedImageIndex || !geometry) return;
  
  var selectedImage = EMD.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
  var selectedVersion = landsatSelector.getValue();
  var selectedImageVis;
  
  if (selectedVersion === 'Landsat 4' || selectedVersion === 'Landsat 5' || selectedVersion === 'Landsat 7') {
    selectedImageVis = {
      bands: ['SR_B3', 'SR_B2', 'SR_B1'],
      min: 0.0,
      max: 0.3
    };
  } else if (selectedVersion === 'Landsat 8' || selectedVersion === 'Landsat 9') {
    selectedImageVis = {
      bands: ['SR_B4', 'SR_B3', 'SR_B2'],
      min: 0.0,
      max: 0.3
    };
  }
  
  Map.layers().reset();
  Map.addLayer(selectedImage, selectedImageVis, 'Selected Landsat Image');
  if (pixels2) {
    Map.addLayer(pixels2, {palette: ['red']}, "Study Area");
  }
  
  // Show image information
  var date = selectedImage.get('system:time_start');
  var imageDate = ee.Date(date).format('yyyy-MM-dd');
  
  print('Selected image:', selectedImageIndex);
  print('Date:', imageDate.getInfo());
  print('Landsat version:', selectedVersion);
});

// Create lists for images with and without clouds
var cloudyImagesList = [];
var clearImagesList = [];

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

// Function to visualize selected image
var visualizeImage = function(selectedImageIndex) {
  if (!selectedImageIndex || !geometry) return;
  
  var selectedImage = EMD.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
  var selectedVersion = landsatSelector.getValue();
  var selectedImageVis;
  
  if (selectedVersion === 'Landsat 4' || selectedVersion === 'Landsat 5' || selectedVersion === 'Landsat 7') {
    selectedImageVis = {
      bands: ['SR_B3', 'SR_B2', 'SR_B1'],
      min: 0.0,
      max: 0.3
    };
  } else if (selectedVersion === 'Landsat 8' || selectedVersion === 'Landsat 9') {
    selectedImageVis = {
      bands: ['SR_B4', 'SR_B3', 'SR_B2'],
      min: 0.0,
      max: 0.3
    };
  }
  
  Map.layers().reset();
  Map.addLayer(selectedImage, selectedImageVis, 'Selected Landsat Image');
  if (pixels2) {
    Map.addLayer(pixels2, {palette: ['red']}, "Study Area");
  }
};

// Update selector with change handler
selectImage = ui.Select({
  items: [],
  placeholder: 'First draw your study area and select Landsat version',
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
  var selectedImage = EMD.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
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
  var selectedImage = EMD.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
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
    var selectedImage = EMD.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
    var selectedVersion = landsatSelector.getValue();
    var visParams;
    if (selectedVersion === 'Landsat 4' || selectedVersion === 'Landsat 5' || selectedVersion === 'Landsat 7') {
      visParams = {
        bands: ['SR_B3', 'SR_B2', 'SR_B1'],
        min: 0.0,
        max: 0.3
      };
    } else if (selectedVersion === 'Landsat 8' || selectedVersion === 'Landsat 9') {
      visParams = {
        bands: ['SR_B4', 'SR_B3', 'SR_B2'],
        min: 0.0,
        max: 0.3
      };
    }
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
    var selectedImage = EMD.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
    var selectedVersion = landsatSelector.getValue();
    var visParams;
    if (selectedVersion === 'Landsat 4' || selectedVersion === 'Landsat 5' || selectedVersion === 'Landsat 7') {
      visParams = {
        bands: ['SR_B4', 'SR_B3', 'SR_B2'], // NIR, Red, Green for L4/5/7
        min: 0.0,
        max: 0.3
      };
    } else if (selectedVersion === 'Landsat 8' || selectedVersion === 'Landsat 9') {
      visParams = {
        bands: ['SR_B5', 'SR_B4', 'SR_B3'], // NIR, Red, Green for L8/9
        min: 0.0,
        max: 0.3
      };
    }
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
    var selectedImage = EMD.filter(ee.Filter.eq('system:index', selectedImageIndex)).first();
    var selectedVersion = landsatSelector.getValue();
    var visParams;
    if (selectedVersion === 'Landsat 4' || selectedVersion === 'Landsat 5' || selectedVersion === 'Landsat 7') {
      visParams = {
        bands: ['SR_B7', 'SR_B4', 'SR_B3'], // SWIR, NIR, Red for L4/5/7
        min: 0.0,
        max: 0.3
      };
    } else if (selectedVersion === 'Landsat 8' || selectedVersion === 'Landsat 9') {
      visParams = {
        bands: ['SR_B7', 'SR_B5', 'SR_B4'], // SWIR, NIR, Red for L8/9
        min: 0.0,
        max: 0.3
      };
    }
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
var citation = ui.Label('Author: Carlos Javier Navarro 2025. Landsat Cloud Selector', {fontSize: '14px', color: 'gray'});

// Create citation panel
var citationPanel = ui.Panel([citation]);

// Add citation panel to main panel
mainPanel.add(citationPanel);

// Add main panel to GUI root
ui.root.insert(0, mainPanel);

// Initial information
print('=== LANDSAT IMAGE SELECTOR APP ===');
print('Collections: Landsat 4, 5, 7, 8, and 9');
print('Initial date range:', startDate, 'to', endDate);
print('Instructions:');
print('1. Draw your study area using the drawing tool');
print('2. Select a Landsat version (4, 5, 7, 8, or 9)');
print('3. Adjust dates if needed');
print('4. Select images from the dropdown list');
print('5. Mark images as cloudy or clear');
print('6. Use "Show Formatted Lists" to get the final arrays');

// Set initial map view
Map.setCenter(0, 0, 2);