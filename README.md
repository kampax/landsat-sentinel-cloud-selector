# Satellite Cloud Selection Apps

Google Earth Engine applications for visual selection of cloud-free satellite images with interactive study area definition.

## 🛰️ Applications

### Landsat Cloud Selector
**File:** `Landsat_Cloud_Selector_EN.js`
- **Satellites:** Landsat 4, 5, 7, 8, and 9
- **Collections:** LANDSAT/LT04/C02/T1_L2, LANDSAT/LT05/C02/T1_L2, LANDSAT/LE07/C02/T1_L2, LANDSAT/LC08/C02/T1_L2, LANDSAT/LC09/C02/T1_L2
- **Date Range:** 1982-2025 (varies by satellite)
- **Study Area:** Interactive rectangle drawing tool

### Sentinel-2 Cloud Selector
**File:** `Sentinel2_Cloud_Selector_EN.js`
- **Collection:** COPERNICUS/S2_SR_HARMONIZED
- **Date Range:** 2015-06-23 to present
- **Study Area:** Interactive rectangle drawing tool
- **Cloud Filter:** Adjustable cloud coverage percentage

## 🚀 Features

### ✅ Universal Features
- **Interactive Study Area Definition** - Draw rectangles anywhere on Earth
- **Multi-satellite Support** - Choose between different satellite missions
- **Visual Cloud Assessment** - Manual inspection and classification
- **Real-time List Management** - Dynamic updates with duplicate prevention
- **Multiple Visualizations** - RGB, NIR, and SWIR composites
- **Formatted Output** - Ready-to-use arrays for GEE filtering
- **Date Range Filtering** - Customizable temporal windows

### 🎯 Landsat Specific
- **Multi-mission Support** - Landsat 4, 5, 7, 8, 9 in one app
- **Adaptive Bands** - Automatically adjusts for different sensor configurations
- **Historical Coverage** - Access to 40+ years of Earth observation
- **Thermal Data** - Includes thermal band processing

### 🌍 Sentinel-2 Specific
- **High Resolution** - 10-20m pixel size
- **Frequent Revisit** - 5-day temporal resolution
- **Cloud Metadata** - Built-in cloud percentage filtering
- **Harmonized Processing** - Consistent radiometry across time

## 📋 How to Use

### Step-by-Step Guide

1. **🗺️ Define Study Area**
   - Click "📍 Draw Study Area"
   - Draw a rectangle on the map
   - Red outline shows your area of interest

2. **🛰️ Select Satellite**
   - **Landsat:** Choose version (4, 5, 7, 8, or 9)
   - **Sentinel-2:** Pre-selected collection

3. **📅 Set Date Range**
   - Adjust start and end dates
   - Click "Update Dates" to apply filters

4. **🖼️ Browse Images**
   - Select images from dropdown menu
   - View on map with multiple visualization options

5. **☁️ Classify Images**
   - Click "Mark as Cloudy" for cloudy images
   - Click "Mark as Clear" for usable images

6. **📊 Export Results**
   - Click "Show Formatted Lists"
   - Copy arrays for use in other scripts

## 🎨 Visualization Options

### Landsat Visualizations
| Mode | Landsat 4/5/7 Bands | Landsat 8/9 Bands | Purpose |
|------|---------------------|-------------------|---------|
| **Natural RGB** | B3, B2, B1 | B4, B3, B2 | True color view |
| **False Color NIR** | B4, B3, B2 | B5, B4, B3 | Vegetation analysis |
| **SWIR Composite** | B7, B4, B3 | B7, B5, B4 | Cloud/moisture detection |

### Sentinel-2 Visualizations
| Mode | Bands | Purpose |
|------|-------|---------|
| **Natural RGB** | B4, B3, B2 | True color view |
| **False Color NIR** | B8, B4, B3 | Vegetation analysis |
| **SWIR Composite** | B12, B8, B4 | Cloud/moisture detection |

## 📊 Output Format

Both apps generate JavaScript arrays ready for Google Earth Engine:

```javascript
// Example output
var cloudyImages = [
  "LC08_123034_20200615",
  "LC08_123034_20200701",
  "LC08_123034_20200717"
];

var clearImages = [
  "LC08_123034_20200530",
  "LC08_123034_20200818",
  "LC08_123034_20200903"
];
```

### Integration Example
```javascript
// Use in your GEE scripts
var collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(geometry)
  .filterDate('2020-01-01', '2020-12-31')
  .filter(ee.Filter.inList('system:index', cloudyImages).not());
```

## 🔧 Technical Specifications

### Data Processing

#### Landsat Scale Factors
- **Optical Bands:** `DN × 0.0000275 - 0.2`
- **Thermal Bands:** `DN × 0.00341802 + 149.0`

#### Sentinel-2 Scale Factors
- **All Bands:** `DN × 0.0001` (converts 0-10000 to 0-1)

### Satellite Coverage Periods

| Satellite | Start Date | End Date | Notes |
|-----------|------------|----------|-------|
| **Landsat 4** | 1982-08-22 | 1993-06-24 | Historical data |
| **Landsat 5** | 1984-03-16 | 2012-05-05 | Longest mission |
| **Landsat 7** | 1999-04-15 | 2022-05-31 | SLC-off after 2003 |
| **Landsat 8** | 2013-03-18 | Present | Current operations |
| **Landsat 9** | 2021-10-31 | Present | Newest satellite |
| **Sentinel-2** | 2015-06-23 | Present | ESA mission |

## 🚀 Getting Started

### Prerequisites
- Google Earth Engine account ([sign up here](https://earthengine.google.com/))
- Modern web browser
- Basic familiarity with GEE Code Editor

### Quick Start
1. **Copy script content** from this repository
2. **Paste into GEE Code Editor**
3. **Click "Run"** to start the application
4. **Follow the on-screen instructions**

### Performance Tips
- **Smaller areas** = faster processing
- **Shorter time periods** = fewer images to review
- **Use cloud filters** (Sentinel-2) to reduce data volume
- **Export lists frequently** to avoid losing work


## 👤 Author

**Carlos Javier Navarro** (2025)  
*Remote Sensing & GIS Specialist*



## 🏷️ Tags

`google-earth-engine` `landsat` `sentinel-2` `cloud-detection` `remote-sensing` `satellite-imagery` `javascript` `earth-observation` `gis` `environmental-monitoring`


