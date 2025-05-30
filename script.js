// PWA Installation and Service Worker
let deferredPrompt;
let isAppInstalled = false;

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              showToast('New version available! Refresh to update.');
            }
          });
        });
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Handle PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt triggered');
  e.preventDefault();
  deferredPrompt = e;
  
  // Check if app is already installed
  if (!isAppInstalled) {
    showInstallPrompt();
  }
});

// Show install prompt
function showInstallPrompt() {
  const installPrompt = document.getElementById('installPrompt');
  const installBtn = document.getElementById('installBtn');
  const dismissBtn = document.getElementById('dismissBtn');
  
  if (installPrompt) {
    installPrompt.style.display = 'block';
    
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install prompt outcome:', outcome);
        
        if (outcome === 'accepted') {
          isAppInstalled = true;
          showToast('App installed successfully!');
        }
        
        deferredPrompt = null;
        installPrompt.style.display = 'none';
      }
    });
    
    dismissBtn.addEventListener('click', () => {
      installPrompt.style.display = 'none';
    });
  }
}

// Detect if app is running in standalone mode
window.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    isAppInstalled = true;
    console.log('App is running in standalone mode');
    
    // Hide install prompt if already installed
    const installPrompt = document.getElementById('installPrompt');
    if (installPrompt) {
      installPrompt.style.display = 'none';
    }
  }
});

// Handle app shortcuts (from manifest.json)
const urlParams = new URLSearchParams(window.location.search);
const action = urlParams.get('action');

if (action === 'import') {
  // Auto-trigger file import
  window.addEventListener('load', () => {
    document.getElementById('fileInput').click();
  });
} else if (action === 'report') {
  // Auto-show insights for report generation
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!insightsVisible) {
        toggleInsights();
      }
    }, 1000);
  });
}

// Custom Keypad Variables
let keypadVisible = false;
let activeInput = null;

// Original event listeners
document.getElementById('fileInput').addEventListener('change', handleFile, false);
document.getElementById('loadProgressInput').addEventListener('change', loadProgress, false);
document.getElementById('saveProgressButton').addEventListener('click', saveProgress);
document.getElementById('saveAsButton').addEventListener('click', saveAsProgress);
document.getElementById('exportButton').addEventListener('click', exportToExcel);
document.getElementById('insightsButton').addEventListener('click', toggleInsights);
document.getElementById('toggleIdsButton').addEventListener('click', toggleIds);
document.getElementById('toggleLengthsButton').addEventListener('click', toggleLengths);
document.getElementById('fitViewButton').addEventListener('click', fitView);
document.getElementById('downloadPDFBtn').addEventListener('click', downloadPDF);
document.getElementById('benchmarkButton').addEventListener('click', openBenchmarkDialog);
document.getElementById('themeButton').addEventListener('click', toggleThemeDropdown);

// New button event listeners
document.getElementById('increasePointSizeButton').addEventListener('click', increasePointSize);
document.getElementById('decreasePointSizeButton').addEventListener('click', decreasePointSize);
document.getElementById('labelUpButton').addEventListener('click', moveLabelUp);
document.getElementById('labelDownButton').addEventListener('click', moveLabelDown);
document.getElementById('labelLeftButton').addEventListener('click', moveLabelLeft);
document.getElementById('labelRightButton').addEventListener('click', moveLabelRight);

// Keypad event listeners
document.getElementById('keypadToggle').addEventListener('click', toggleKeypad);
document.getElementById('keypadClose').addEventListener('click', hideKeypad);
document.getElementById('keypadClear').addEventListener('click', clearActiveInput);
document.getElementById('keypadDone').addEventListener('click', hideKeypad);

// Keypad button event listeners
document.querySelectorAll('.keypad-btn').forEach(btn => {
    btn.addEventListener('click', handleKeypadInput);
});

// Benchmark dialog buttons
document.getElementById('applyBenchmarkButton').addEventListener('click', applyBenchmarks);
document.getElementById('cancelBenchmarkButton').addEventListener('click', closeBenchmarkDialog);
document.querySelector('.close').addEventListener('click', closeBenchmarkDialog);

// Add drag functionality to dialog
let dragDialog = document.getElementById('draggableDialog');
let dialogHeader = document.getElementById('dialogHeader');
setupDialogDrag(dragDialog, dialogHeader);

// Setup theme options
document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', function() {
        const theme = this.getAttribute('data-theme');
        changeTheme(theme);
        toggleThemeDropdown(); // Close dropdown after selection
    });
});

// Close theme dropdown when clicking outside of it
document.addEventListener('click', function(event) {
    const themeDropdown = document.getElementById('themeDropdown');
    const themeButton = document.getElementById('themeButton');
    
    if (themeDropdown.style.display === 'block' && 
        !themeDropdown.contains(event.target) && 
        event.target !== themeButton && 
        !themeButton.contains(event.target)) {
        themeDropdown.style.display = 'none';
    }
    
    // Close keypad when clicking outside
    const customKeypad = document.getElementById('customKeypad');
    const keypadToggle = document.getElementById('keypadToggle');
    
    if (keypadVisible && 
        !customKeypad.contains(event.target) && 
        !keypadToggle.contains(event.target) &&
        !event.target.classList.contains('keypad-input')) {
        // Don't close if clicking on an input that should use keypad
        if (!event.target.matches('.text-box input')) {
            hideKeypad();
        }
    }
});

const storedValues = {};
let burdenValue = 4.7; // Default burden value
let spacingValue = 5.2; // Default spacing value
let stemmingValue = 3.2; // Default stemming value
let burdenTolerance = 0.3; // Default burden tolerance
let spacingTolerance = 0.3; // Default spacing tolerance
let stemmingTolerance = 0.3; // Default stemming tolerance
let lengthTolerance = 0.5; // Default length tolerance
let lengthValue = null;
let insightsVisible = false;
let idsVisible = false;
let lengthsVisible = false;
let myChart = null; // Store chart instance globally
let chartData = null; // Store original chart data for reset
let jsonData = null; // Store the imported data
let importedFileName = "QAQC"; // Default name if no file is imported
let pointRadius = 7; // Default point size
let labelOffsetX = 0; // Horizontal offset for labels
let labelOffsetY = -20; // Vertical offset for labels (default: above the point)
let currentFileHandle = null; // Store the current file handle for save operations
let currentTheme = "default"; // Current theme

// NEW: Define theme colors for points
const themeColors = {
    default: {
        point: 'rgba(20, 30, 97, 0.95)',
        selected: 'rgba(0, 180, 180, 1.0)'
    },
    ocean: {
        point: 'rgba(15, 32, 39, 0.95)',
        selected: 'rgba(52, 152, 219, 1.0)'
    },
    sunset: {
        point: 'rgba(153, 51, 51, 0.95)',
        selected: 'rgba(255, 153, 102, 1.0)'
    },
    forest: {
        point: 'rgba(19, 78, 94, 0.95)',
        selected: 'rgba(113, 178, 128, 1.0)'
    },
    desert: {
        point: 'rgba(129, 97, 7, 0.95)',
        selected: 'rgba(244, 208, 63, 1.0)'
    },
    royal: {
        point: 'rgba(92, 37, 141, 0.95)',
        selected: 'rgba(155, 89, 182, 1.0)'
    },
    neon: {
        point: 'rgba(0, 0, 0, 0.95)',
        selected: 'rgba(0, 255, 255, 1.0)'
    },
    mint: {
        point: 'rgba(33, 147, 176, 0.95)',
        selected: 'rgba(109, 213, 237, 1.0)'
    },
    autumn: {
        point: 'rgba(142, 45, 226, 0.95)',
        selected: 'rgba(225, 168, 41, 1.0)'
    },
    night: {
        point: 'rgba(24, 24, 24, 0.95)',
        selected: 'rgba(66, 134, 244, 1.0)'
    }
};

// Custom Keypad Functions
function toggleKeypad() {
    if (keypadVisible) {
        hideKeypad();
    } else {
        showKeypad();
    }
}

function showKeypad() {
    const keypad = document.getElementById('customKeypad');
    const toggle = document.getElementById('keypadToggle');
    
    keypad.classList.add('show');
    toggle.classList.add('active');
    keypadVisible = true;
}

function hideKeypad() {
    const keypad = document.getElementById('customKeypad');
    const toggle = document.getElementById('keypadToggle');
    
    keypad.classList.remove('show');
    toggle.classList.remove('active');
    keypadVisible = false;
    
    // Clear active input styling
    if (activeInput) {
        activeInput.classList.remove('keypad-active');
        activeInput = null;
    }
}

function handleKeypadInput(event) {
    if (!activeInput) return;
    
    const value = event.target.getAttribute('data-value');
    const action = event.target.getAttribute('data-action');
    
    if (action === 'delete') {
        // Remove last character
        activeInput.value = activeInput.value.slice(0, -1);
    } else if (value) {
        // Add the clicked value
        activeInput.value += value;
    }
    
    // Trigger change event to update stored values
    const changeEvent = new Event('change', { bubbles: true });
    activeInput.dispatchEvent(changeEvent);
}

function clearActiveInput() {
    if (!activeInput) return;
    
    activeInput.value = '';
    // Trigger change event to update stored values
    const changeEvent = new Event('change', { bubbles: true });
    activeInput.dispatchEvent(changeEvent);
}

function setupInputKeypadIntegration(input) {
    // Prevent native keyboard
    input.setAttribute('readonly', true);
    input.setAttribute('inputmode', 'none');
    
    // Add click/focus event to show keypad
    input.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveInput(this);
        if (!keypadVisible) {
            showKeypad();
        }
    });
    
    input.addEventListener('focus', function(e) {
        e.preventDefault();
        setActiveInput(this);
        if (!keypadVisible) {
            showKeypad();
        }
    });
    
    // Prevent context menu on long press (mobile)
    input.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
}

function setActiveInput(input) {
    // Remove previous active styling
    if (activeInput) {
        activeInput.classList.remove('keypad-active');
    }
    
    // Set new active input
    activeInput = input;
    activeInput.classList.add('keypad-active');
}

// PWA-specific storage functions
function saveToIndexedDB(key, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BSGuideDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['data'], 'readwrite');
            const store = transaction.objectStore('data');
            
            store.put({ id: key, data: data });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        };
        
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('data')) {
                db.createObjectStore('data', { keyPath: 'id' });
            }
        };
    });
}

function loadFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BSGuideDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['data'], 'readonly');
            const store = transaction.objectStore('data');
            
            const getRequest = store.get(key);
            getRequest.onsuccess = () => {
                resolve(getRequest.result ? getRequest.result.data : null);
            };
            getRequest.onerror = () => reject(getRequest.error);
        };
    });
}

// Function to make the dialog draggable
function setupDialogDrag(dragElement, headerElement) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    headerElement.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Call a function whenever the cursor moves
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set the element's new position
        dragElement.style.top = (dragElement.offsetTop - pos2) + "px";
        dragElement.style.left = (dragElement.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Theme handling functions
function toggleThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    
    // Position the dropdown near the theme button
    const themeButton = document.getElementById('themeButton');
    const buttonRect = themeButton.getBoundingClientRect();
    
    // Set dropdown position - adjust as needed
    dropdown.style.top = (buttonRect.bottom + 5) + 'px';
    dropdown.style.left = buttonRect.left + 'px';
}

function changeTheme(theme) {
    // Remove any existing theme class
    document.body.classList.remove(
        'default-theme-active',
        'ocean-theme-active',
        'sunset-theme-active',
        'forest-theme-active',
        'desert-theme-active',
        'royal-theme-active',
        'neon-theme-active',
        'mint-theme-active',
        'autumn-theme-active',
        'night-theme-active'
    );
    
    // Add new theme class
    if (theme !== 'default') {
        document.body.classList.add(theme + '-theme-active');
    }
    
    // Store current theme
    currentTheme = theme;
    
    // Update chart colors
    updateChartColors();
    
    // Save theme preference using IndexedDB for PWA
    try {
        saveToIndexedDB('qaqcTheme', theme).catch(e => {
            console.log('Could not save theme preference to IndexedDB');
            // Fallback to localStorage if available
            try {
                localStorage.setItem('qaqcTheme', theme);
            } catch (e2) {
                console.log('Could not save theme preference to localStorage');
            }
        });
    } catch (e) {
        console.log('Could not save theme preference');
    }
}

function updateChartColors() {
    if (!myChart) return;
    
    // Get colors for the current theme
    const themeColor = themeColors[currentTheme] || themeColors.default;
    const pointColor = themeColor.point;
    const pointColorSelected = themeColor.selected;
    
    // Update the backgroundColor function for the dataset
    myChart.data.datasets.forEach(dataset => {
        dataset.backgroundColor = function(context) {
            const index = context.dataIndex;
            const id = context.chart.data.datasets[context.datasetIndex].data[index].id;
            
            // Find if this point has data
            let hasData = false;
            Object.values(storedValues[0] || {}).forEach(point => {
                if (point.id === id && (
                    point.burden !== undefined || 
                    point.spacing !== undefined || 
                    point.stemming !== undefined || 
                    point.length !== undefined
                )) {
                    hasData = true;
                }
            });
            
            // Return theme-appropriate color
            return hasData ? pointColorSelected : pointColor;
        };
    });
    
    // Update the chart to apply the new colors
    myChart.update();
}

// Load saved theme preference if available
async function loadSavedTheme() {
    try {
        // Try IndexedDB first
        const savedTheme = await loadFromIndexedDB('qaqcTheme');
        if (savedTheme) {
            changeTheme(savedTheme);
            return;
        }
        
        // Fallback to localStorage
        const localTheme = localStorage.getItem('qaqcTheme');
        if (localTheme) {
            changeTheme(localTheme);
        }
    } catch (e) {
        console.log('Could not load theme preference');
    }
}

// Call this on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSavedTheme();
});

// Benchmark Dialog Functions
function openBenchmarkDialog() {
    // Populate the dialog with current values
    document.getElementById('dialogBurdenInput').value = burdenValue;
    document.getElementById('dialogSpacingInput').value = spacingValue;
    document.getElementById('dialogStemmingInput').value = stemmingValue;
    document.getElementById('dialogBurdenToleranceInput').value = burdenTolerance;
    document.getElementById('dialogSpacingToleranceInput').value = spacingTolerance;
    document.getElementById('dialogStemmingToleranceInput').value = stemmingTolerance;
    document.getElementById('dialogLengthToleranceInput').value = lengthTolerance;
    
    // Reset dialog position
    const dialog = document.getElementById('draggableDialog');
    dialog.style.top = '';
    dialog.style.left = '';
    
    // Show the dialog
    document.getElementById('benchmarkDialog').style.display = 'block';
}

function closeBenchmarkDialog() {
    document.getElementById('benchmarkDialog').style.display = 'none';
}

function applyBenchmarks() {
    // Get values from dialog
    burdenValue = parseFloat(document.getElementById('dialogBurdenInput').value);
    spacingValue = parseFloat(document.getElementById('dialogSpacingInput').value);
    stemmingValue = parseFloat(document.getElementById('dialogStemmingInput').value);
    burdenTolerance = parseFloat(document.getElementById('dialogBurdenToleranceInput').value);
    spacingTolerance = parseFloat(document.getElementById('dialogSpacingToleranceInput').value);
    stemmingTolerance = parseFloat(document.getElementById('dialogStemmingToleranceInput').value);
    lengthTolerance = parseFloat(document.getElementById('dialogLengthToleranceInput').value);
    
    // Update insights if they're visible
    if (insightsVisible) {
        calculateInsights();
    }
    
    // Close the dialog
    closeBenchmarkDialog();
    
    // Show confirmation toast
    showToast("Benchmark settings updated successfully!");
}

function handleFile(event) {
    const file = event.target.files[0];
    if (file) {
        // Show loading indicator
        showLoading(true);
        
        // Store the filename without extension
        importedFileName = file.name.replace(/\.[^/.]+$/, "");
        
        const reader = new FileReader();
        reader.onload = function (e) {
            let data;
            const fileExt = file.name.split('.').pop().toLowerCase();
            
            try {
                // Handle different file types
                if (fileExt === 'csv' || fileExt === 'txt') {
                    // For CSV/TXT files, use string content processing
                    const csvString = e.target.result;
                    // Parse CSV using XLSX utils
                    const workbook = XLSX.read(csvString, { type: 'string' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                } else {
                    // For Excel files (.xlsx, .xls), use binary processing
                    data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                }

                // Process plan lengths as well
                plotData(jsonData);
                
                // Clear any displayed IDs and lengths when loading new data
                clearBoreholeLabels();
                
                // Show confirmation toast
                showToast(`Imported file: ${file.name}`);
                
            } catch (error) {
                console.error('Error processing file:', error);
                showToast('Error processing file. Please check the file format.');
            } finally {
                // Hide loading indicator
                showLoading(false);
            }
        };
        
        reader.onerror = function() {
            showLoading(false);
            showToast('Error reading file. Please try again.');
        };
        
        // Use different reading method based on file type
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (fileExt === 'csv' || fileExt === 'txt') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }
}

// Show/hide loading indicator
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

function plotData(data) {
    const ids = [];
    const xValues = [];
    const yValues = [];
    const planLengths = [];

    for (let i = 1; i < data.length; i++) {
        ids.push(data[i][0]);
        xValues.push(data[i][1]);
        yValues.push(data[i][2]);
        planLengths.push(data[i][4] || null); // Assuming plan length is in column 5 (index 4)
    }

    // Store this data for reset purposes
    chartData = {
        ids: [...ids],
        xValues: [...xValues],
        yValues: [...yValues],
        planLengths: [...planLengths]
    };

    // Find data boundaries for proper scaling
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    
    // Add padding to the boundaries (5%)
    const xPadding = (maxX - minX) * 0.05;
    const yPadding = (maxY - minY) * 0.05;

    const ctx = document.getElementById('myChart').getContext('2d');
    
    // Get colors for the current theme
    const themeColor = themeColors[currentTheme] || themeColors.default;
    
    // Destroy the old chart if it exists
    if (myChart) {
        myChart.destroy();
    }
    
    myChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '', // Remove the "X vs Y" label
                data: xValues.map((x, index) => ({ x, y: yValues[index], id: ids[index] })),
                borderColor: 'transparent', // Remove white borders
                // Use function to apply theme-based colors
                backgroundColor: function(context) {
                    // Default placeholder - will be updated by updateChartColors()
                    return themeColor.point;
                },
                pointRadius: pointRadius, // Use the variable for point size
                pointBorderWidth: 0, // Remove the white borders around points
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide the legend completely
                },
                tooltip: {
                    callbacks: {
                        title: function (tooltipItems) {
                            return `ID: ${tooltipItems[0].raw.id}`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        onPan: updateLabelsOnZoom // Update labels when panning
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                        onZoom: updateLabelsOnZoom // Update labels when zooming
                    }
                }
            },
            onClick: function (evt, elements) {
                // Check if we clicked on a point
                if (elements && elements.length > 0) {
                    const datasetIndex = elements[0].datasetIndex;
                    const index = elements[0].index;
                    
                    // Calculate position for the text box
                    const canvasPosition = Chart.helpers.getRelativePosition(evt, myChart);
                    
                    // Show the text box at the calculated position
                    showTextBox(canvasPosition, datasetIndex, index);
                }
            },
            scales: {
                x: {
                    display: false,
                    min: minX - xPadding,
                    max: maxX + xPadding
                },
                y: {
                    display: false,
                    min: minY - yPadding,
                    max: maxY + yPadding
                }
            }
        }
    });

    // Save old stored values before updating
    const oldStoredValues = {...storedValues[0]};
    
    // Initialize new dataset in storedValues
    storedValues[0] = {};
    
    // Initialize each point with coordinates and plan length
    ids.forEach((id, index) => {
        storedValues[0][index] = { 
            id: id,
            planLength: planLengths[index],
            x: xValues[index],
            y: yValues[index]
        };
        
        // If we have saved data for this ID from previous loading, merge it
        const oldPointWithSameId = Object.values(oldStoredValues).find(point => point.id === id);
        if (oldPointWithSameId) {
            // Copy burden, spacing, stemming, and length if they exist
            if (oldPointWithSameId.burden !== undefined) 
                storedValues[0][index].burden = oldPointWithSameId.burden;
            if (oldPointWithSameId.spacing !== undefined) 
                storedValues[0][index].spacing = oldPointWithSameId.spacing;
            if (oldPointWithSameId.stemming !== undefined) 
                storedValues[0][index].stemming = oldPointWithSameId.stemming;
            if (oldPointWithSameId.length !== undefined) 
                storedValues[0][index].length = oldPointWithSameId.length;
        }
    });
    
    // Update colors for points with data
    updateChartColors();
    
    // Refresh labels if they're visible
    updateLabelsIfVisible();
}

// Function to update labels when zooming or panning
function updateLabelsOnZoom() {
    updateLabelsIfVisible();
}

// Function to update labels if they're visible
function updateLabelsIfVisible() {
    if (idsVisible) {
        displayBoreholeIds();
    }
    
    if (lengthsVisible) {
        displayBoreholeLengths();
    }
}

function showTextBox(position, datasetIndex, index) {
    // Remove any existing text box with the same ID first
    const existingTextBox = document.getElementById(`text-box-${index}`);
    if (existingTextBox) {
        existingTextBox.parentNode.removeChild(existingTextBox);
    }

    // Get the canvas and container for positioning
    const canvas = document.getElementById('myChart');
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate position in screen coordinates
    const screenX = position.x + canvasRect.left;
    const screenY = position.y + canvasRect.top;

    // Create the text box
    const textBox = document.createElement('div');
    textBox.className = 'text-box';
    textBox.id = `text-box-${index}`;
    textBox.style.left = `${screenX}px`;
    textBox.style.top = `${screenY - 100}px`; // Position above the point

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.className = 'close-button';
    closeButton.onclick = function () {
        document.querySelector('.container').removeChild(textBox);
    };

    // Get stored values or set defaults
    const burdenVal = storedValues[datasetIndex]?.[index]?.burden || '';
    const spacingVal = storedValues[datasetIndex]?.[index]?.spacing || '';
    const stemmingVal = storedValues[datasetIndex]?.[index]?.stemming || '';
    const lengthVal = storedValues[datasetIndex]?.[index]?.length || '';
    const planLengthVal = storedValues[datasetIndex]?.[index]?.planLength || '';

    // Create input fields with keypad integration
    textBox.innerHTML = `
        <input type="text" placeholder="Burden" value="${burdenVal}" onchange="updateStoredValue(${datasetIndex}, ${index}, 'burden', this.value)" /><br>
        <input type="text" placeholder="Spacing" value="${spacingVal}" onchange="updateStoredValue(${datasetIndex}, ${index}, 'spacing', this.value)" /><br>
        <input type="text" placeholder="Stemming" value="${stemmingVal}" onchange="updateStoredValue(${datasetIndex}, ${index}, 'stemming', this.value)" /><br>
        <input type="text" placeholder="Length" value="${lengthVal}" onchange="updateStoredValue(${datasetIndex}, ${index}, 'length', this.value)" /><br>
        <p style="margin: 5px 0; font-size: 12px;">Plan Length: ${planLengthVal}</p>
    `;

    // Add close button and append to container
    textBox.appendChild(closeButton);
    document.querySelector('.container').appendChild(textBox);
    
    // Setup keypad integration for all inputs in this text box
    textBox.querySelectorAll('input').forEach(input => {
        setupInputKeypadIntegration(input);
    });
}

function updateStoredValue(datasetIndex, index, field, value) {
    if (!storedValues[datasetIndex]) {
        storedValues[datasetIndex] = {};
    }
    if (!storedValues[datasetIndex][index]) {
        storedValues[datasetIndex][index] = { id: `ID-${index + 1}` };
    }
    storedValues[datasetIndex][index][field] = parseFloat(value);
    
    // Update the point color to match theme
    updateChartColors();
}

function toggleInsights() {
    const insightsButton = document.getElementById('insightsButton');
    const complianceContainer = document.getElementById('complianceContainer');
    
    // Toggle button active state (glow effect)
    insightsButton.classList.toggle('active');
    
    // Toggle visibility of insights
    insightsVisible = !insightsVisible;
    
    if (insightsVisible) {
        calculateInsights();
        complianceContainer.style.display = 'block';
    } else {
        complianceContainer.style.display = 'none';
    }
}

function toggleIds() {
    const toggleIdsButton = document.getElementById('toggleIdsButton');
    
    // Toggle button active state
    toggleIdsButton.classList.toggle('active');
    
    // Toggle visibility of IDs
    idsVisible = !idsVisible;
    
    if (idsVisible) {
        displayBoreholeIds();
    } else {
        // Only remove the IDs, not length labels
        removeBoreholeIds();
    }
}

function toggleLengths() {
    const toggleLengthsButton = document.getElementById('toggleLengthsButton');
    
    // Toggle button active state
    toggleLengthsButton.classList.toggle('active');
    
    // Toggle visibility of lengths
    lengthsVisible = !lengthsVisible;
    
    if (lengthsVisible) {
        displayBoreholeLengths();
    } else {
        // Only remove the lengths, not ID labels
        removeBoreholeLengths();
    }
}

function fitView() {
    if (myChart && chartData) {
        // Reset the chart's zoom to show all points
        myChart.resetZoom();
        
        // Update labels after resetting zoom
        updateLabelsIfVisible();
    }
}

function clearBoreholeLabels() {
    // Remove all borehole ID and length labels
    removeBoreholeIds();
    removeBoreholeLengths();
    
    // Reset button states
    document.getElementById('toggleIdsButton').classList.remove('active');
    document.getElementById('toggleLengthsButton').classList.remove('active');
    idsVisible = false;
    lengthsVisible = false;
}

function removeBoreholeIds() {
    const container = document.querySelector('.container');
    const idElements = container.querySelectorAll('.borehole-id');
    
    idElements.forEach(element => {
        container.removeChild(element);
    });
}

function removeBoreholeLengths() {
    const container = document.querySelector('.container');
    const lengthElements = container.querySelectorAll('.borehole-length');
    
    lengthElements.forEach(element => {
        container.removeChild(element);
    });
}

function displayBoreholeIds() {
    // Remove existing IDs first to avoid duplicates
    removeBoreholeIds();
    
    if (!myChart) return;
    
    const container = document.querySelector('.container');
    const chartArea = myChart.chartArea;
    const canvas = myChart.canvas;
    
    // Get the current chart scales to map data coordinates to pixel coordinates
    const xScale = myChart.scales.x;
    const yScale = myChart.scales.y;
    
    Object.values(storedValues[0] || {}).forEach(point => {
        if (!point.id) return;
        
        // Convert data coordinates to pixel coordinates
        const x = xScale.getPixelForValue(point.x);
        const y = yScale.getPixelForValue(point.y);
        
        // Create label if point is within visible area
        if (x >= chartArea.left && x <= chartArea.right && 
            y >= chartArea.top && y <= chartArea.bottom) {
            
            const label = document.createElement('div');
            label.className = 'borehole-id';
            label.textContent = point.id;
            label.style.left = `${x + labelOffsetX}px`; // Apply horizontal offset
            label.style.top = `${y + labelOffsetY}px`; // Apply vertical offset
            
            container.appendChild(label);
        }
    });
}

function displayBoreholeLengths() {
    // Remove existing length labels first to avoid duplicates
    removeBoreholeLengths();
    
    if (!myChart) return;
    
    const container = document.querySelector('.container');
    const chartArea = myChart.chartArea;
    
    // Get the current chart scales to map data coordinates to pixel coordinates
    const xScale = myChart.scales.x;
    const yScale = myChart.scales.y;
    
    Object.values(storedValues[0] || {}).forEach(point => {
        // Show either entered length or plan length, prioritizing entered length
        const lengthValue = point.length !== undefined ? point.length : point.planLength;
        if (lengthValue === undefined || lengthValue === null) return;
        
        // Convert data coordinates to pixel coordinates
        const x = xScale.getPixelForValue(point.x);
        const y = yScale.getPixelForValue(point.y);
        
        // Create label if point is within visible area
        if (x >= chartArea.left && x <= chartArea.right && 
            y >= chartArea.top && y <= chartArea.bottom) {
            
            const label = document.createElement('div');
            label.className = 'borehole-length';
            label.textContent = lengthValue.toFixed(1); // Format to 1 decimal place
            
            // Ensure it's directly below the ID by using exact same X position
            label.style.left = `${x + labelOffsetX}px`;
            
            // Position exactly 3px below the ID position (reduced from 5px)
            label.style.top = `${y + labelOffsetY + 3}px`;
            
            container.appendChild(label);
        }
    });
}

function formatComplianceValue(value) {
    // Format compliance values as red (<80%) or green (≥80%)
    const formattedValue = value.toFixed(1);
    if (value < 80) {
        return `<span class="red">${formattedValue}%</span>`;
    } else {
        return `<span class="green">${formattedValue}%</span>`;
    }
}

function calculateInsights() {
    // Use the values set via the benchmark dialog
    // burdenValue, spacingValue, stemmingValue are already set

    let totalBurden = 0, sumBurden = 0, goodBurden = 0, maxBurden = -Infinity, minBurden = Infinity, aboveBurden = 0, belowBurden = 0;
    let totalSpacing = 0, sumSpacing = 0, goodSpacing = 0, maxSpacing = -Infinity, minSpacing = Infinity, aboveSpacing = 0, belowSpacing = 0;
    let totalStemming = 0, sumStemming = 0, goodStemming = 0, maxStemming = -Infinity, minStemming = Infinity, aboveStemming = 0, belowStemming = 0;
    let totalLength = 0, sumLength = 0, goodLength = 0, maxLength = -Infinity, minLength = Infinity, aboveLength = 0, belowLength = 0;

    // Use the tolerance values from the benchmark dialog
    // burdenTolerance, spacingTolerance, stemmingTolerance, lengthTolerance are already set

    Object.values(storedValues).forEach(dataset => {
        Object.values(dataset).forEach(point => {
            if (point.burden !== undefined) {
                totalBurden++;
                sumBurden += point.burden;
                if (Math.abs(point.burden - burdenValue) <= burdenTolerance) goodBurden++;
                if (point.burden > maxBurden) maxBurden = point.burden;
                if (point.burden < minBurden) minBurden = point.burden;
                if (point.burden > burdenValue + burdenTolerance) aboveBurden++;
                if (point.burden < burdenValue - burdenTolerance) belowBurden++;
            }
            if (point.spacing !== undefined) {
                totalSpacing++;
                sumSpacing += point.spacing;
                if (Math.abs(point.spacing - spacingValue) <= spacingTolerance) goodSpacing++;
                if (point.spacing > maxSpacing) maxSpacing = point.spacing;
                if (point.spacing < minSpacing) minSpacing = point.spacing;
                if (point.spacing > spacingValue + spacingTolerance) aboveSpacing++;
                if (point.spacing < spacingValue - spacingTolerance) belowSpacing++;
            }
            if (point.stemming !== undefined) {
                totalStemming++;
                sumStemming += point.stemming;
                if (Math.abs(point.stemming - stemmingValue) <= stemmingTolerance) goodStemming++;
                if (point.stemming > maxStemming) maxStemming = point.stemming;
                if (point.stemming < minStemming) minStemming = point.stemming;
                if (point.stemming > stemmingValue + stemmingTolerance) aboveStemming++;
                if (point.stemming < stemmingValue - stemmingTolerance) belowStemming++;
            }
            if (point.length !== undefined && point.planLength !== undefined && !isNaN(point.planLength)) {
                totalLength++;
                sumLength += point.length;
                if (Math.abs(point.length - point.planLength) <= lengthTolerance) goodLength++;
                if (point.length > maxLength) maxLength = point.length;
                if (point.length < minLength) minLength = point.length;
                if (point.length > point.planLength + lengthTolerance) aboveLength++;
                if (point.length < point.planLength - lengthTolerance) belowLength++;
            }
        });
    });

    const burdenCompliance = totalBurden > 0 ? (goodBurden / totalBurden) * 100 : 0;
    const spacingCompliance = totalSpacing > 0 ? (goodSpacing / totalSpacing) * 100 : 0;
    const stemmingCompliance = totalStemming > 0 ? (goodStemming / totalStemming) * 100 : 0;
    const lengthCompliance = totalLength > 0 ? (goodLength / totalLength) * 100 : 0;

    const avgBurden = totalBurden > 0 ? (sumBurden / totalBurden) : 0;
    const avgSpacing = totalSpacing > 0 ? (sumSpacing / totalSpacing) : 0;
    const avgStemming = totalStemming > 0 ? (sumStemming / totalStemming) : 0;
    const avgLength = totalLength > 0 ? (sumLength / totalLength) : 0;

    const formatValue = (value) => {
        if (value === Infinity || value === -Infinity) return 'N/A';
        return value.toFixed(1);
    };

    const burdenInfo = `
<strong>BURDEN</strong><br>
Compliance: ${formatComplianceValue(burdenCompliance)}<br>
Measurements: ${totalBurden}<br>
Average: ${formatValue(avgBurden)}<br>
Max: ${formatValue(maxBurden)}<br>
Min: ${formatValue(minBurden)}<br>
Above ${ (burdenValue + burdenTolerance).toFixed(1) }: ${aboveBurden}<br>
Below ${ (burdenValue - burdenTolerance).toFixed(1) }: ${belowBurden}<br><br>
`;

    const spacingInfo = `
<strong>SPACING</strong><br>
Compliance: ${formatComplianceValue(spacingCompliance)}<br>
Measurements: ${totalSpacing}<br>
Average: ${formatValue(avgSpacing)}<br>
Max: ${formatValue(maxSpacing)}<br>
Min: ${formatValue(minSpacing)}<br>
Above ${ (spacingValue + spacingTolerance).toFixed(1) }: ${aboveSpacing}<br>
Below ${ (spacingValue - spacingTolerance).toFixed(1) }: ${belowSpacing}<br><br>
`;

    const stemmingInfo = `
<strong>STEMMING</strong><br>
Compliance: ${formatComplianceValue(stemmingCompliance)}<br>
Measurements: ${totalStemming}<br>
Average: ${formatValue(avgStemming)}<br>
Max: ${formatValue(maxStemming)}<br>
Min: ${formatValue(minStemming)}<br>
Above ${ (stemmingValue + stemmingTolerance).toFixed(1) }: ${aboveStemming}<br>
Below ${ (stemmingValue - stemmingTolerance).toFixed(1) }: ${belowStemming}<br><br>
`;

    const lengthInfo = `
<strong>LENGTH</strong><br>
Compliance: ${formatComplianceValue(lengthCompliance)}<br>
Measurements: ${totalLength}<br>
Average: ${formatValue(avgLength)}<br>
Max: ${formatValue(maxLength)}<br>
Min: ${formatValue(minLength)}<br>
Overdrill: ${aboveLength}<br>
Underdrill: ${belowLength}<br>
`;

    const fullInsights = burdenInfo + spacingInfo + stemmingInfo + lengthInfo;

    document.getElementById('burdenCompliance').innerHTML = fullInsights;
    document.getElementById('spacingCompliance').innerHTML = '';
}

function exportToExcel() {
    const worksheetData = [['ID', 'Burden', 'Spacing', 'Stemming', 'Length', 'Plan Length']];
    let hasData = false;

    Object.values(storedValues).forEach(dataset => {
        Object.values(dataset).forEach(point => {
            // Only include points that have at least one value entered (burden, spacing, stemming, or length)
            if (point.burden !== undefined || point.spacing !== undefined || 
                point.stemming !== undefined || point.length !== undefined) {
                
                worksheetData.push([
                    point.id || '',
                    point.burden !== undefined ? point.burden : '',
                    point.spacing !== undefined ? point.spacing : '',
                    point.stemming !== undefined ? point.stemming : '',
                    point.length !== undefined ? point.length : '',
                    point.planLength || ''
                ]);
                hasData = true;
            }
        });
    });

    if (!hasData) {
        alert('No drill hole data to export. Please enter data for at least one drill hole.');
        return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    XLSX.writeFile(workbook, 'QAQC-BSSL-Values.xlsx');
}

// Helper function to update all text box values
function updateAllTextBoxValues() {
    const textBoxes = document.querySelectorAll('.text-box');
    textBoxes.forEach(textBox => {
        const inputs = textBox.querySelectorAll('input');
        const textBoxId = textBox.id;
        if (textBoxId && textBoxId.startsWith('text-box-')) {
            const index = parseInt(textBoxId.replace('text-box-', ''));
            
            // Save each input value
            inputs.forEach(input => {
                if (input.placeholder && input.value) {
                    const field = input.placeholder.toLowerCase();
                    if (['burden', 'spacing', 'stemming', 'length'].includes(field)) {
                        updateStoredValue(0, index, field, input.value);
                    }
                }
            });
        }
    });
}

// Helper function to create the progress data object 
function createProgressDataObject() {
    return {
        storedValues: storedValues,
        burdenValue: burdenValue,
        spacingValue: spacingValue,
        stemmingValue: stemmingValue,
        burdenTolerance: burdenTolerance,
        spacingTolerance: spacingTolerance,
        stemmingTolerance: stemmingTolerance,
        lengthTolerance: lengthTolerance,
        jsonData: jsonData,
        importedFileName: importedFileName,
        // Save UI state
        insightsVisible: insightsVisible,
        idsVisible: idsVisible,
        lengthsVisible: lengthsVisible,
        chartData: chartData,
        // Save compliance data if available
        complianceData: document.getElementById('burdenCompliance').innerHTML || '',
        // Save settings
        pointRadius: pointRadius,
        labelOffsetX: labelOffsetX,
        labelOffsetY: labelOffsetY,
        // Save theme
        theme: currentTheme
    };
}

// Helper function for downloading when File System Access API is unavailable
function downloadFallback(blob, filename) {
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;
    
    // Append to body, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Modified saveProgress function to save to the current file if possible
async function saveProgress() {
    // Check if there's actually data to save
    if (Object.keys(storedValues).length === 0 && !jsonData) {
        showToast("No data to save. Please import data or add values first.");
        return;
    }
    
    // Get all current input values from text boxes that might be open
    updateAllTextBoxValues();
    
    // Create the progress data object
    const progressData = createProgressDataObject();
    
    // Convert to JSON
    const jsonString = JSON.stringify(progressData);
    
    // Create a Blob with the data
    const blob = new Blob([jsonString], {type: 'application/json'});
    
    try {
        // If we have a file handle already, try to save to it
        if (currentFileHandle) {
            try {
                const writable = await currentFileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                
                showToast("File updated successfully!");
                return;
            } catch (err) {
                console.error("Error saving to existing file:", err);
                // If there's an error, fall back to saveAsProgress
                currentFileHandle = null;
            }
        }
        
        // If we don't have a handle or there was an error, use saveAsProgress
        await saveAsProgress();
        
    } catch (err) {
        console.error("Error in save operation:", err);
        showToast("Error saving file. Please try again.");
    }
}

// New saveAsProgress function that always prompts for a location
async function saveAsProgress() {
    // Check if there's actually data to save
    if (Object.keys(storedValues).length === 0 && !jsonData) {
        showToast("No data to save. Please import data or add values first.");
        return;
    }
    
    // Get all current input values from text boxes that might be open
    updateAllTextBoxValues();
    
    // Create the progress data object 
    const progressData = createProgressDataObject();
    
    // Convert to JSON
    const jsonString = JSON.stringify(progressData);
    
    // Create a Blob with the data
    const blob = new Blob([jsonString], {type: 'application/json'});
    
    try {
        // Try to use the File System Access API if supported
        if ('showSaveFilePicker' in window) {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: `${importedFileName || 'QAQC'}.rah`,
                types: [{
                    description: 'QAQC Progress File',
                    accept: {'application/json': ['.rah']}
                }]
            });
            
            // Store the file handle for future save operations
            currentFileHandle = fileHandle;
            
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            
            showToast("Progress saved successfully!");
        } else {
            // Fallback to traditional download
            downloadFallback(blob, `${importedFileName || 'QAQC'}.rah`);
            showToast("Progress saved to Downloads folder. Some browsers don't support choosing a save location.");
        }
    } catch (err) {
        console.error("Error saving file:", err);
        // Fallback to traditional download if the File System Access API fails
        downloadFallback(blob, `${importedFileName || 'QAQC'}.rah`);
        showToast("Progress saved to Downloads folder.");
    }
}

// Updated loadProgress function to potentially capture the file handle
async function loadProgress(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show loading indicator
    showLoading(true);
    
    try {
        // If the file was opened using the File System Access API, store the handle
        if ('getAsFileSystemHandle' in DataTransferItem.prototype) {
            const item = event.dataTransfer?.items[0];
            if (item) {
                const handle = await item.getAsFileSystemHandle();
                if (handle.kind === 'file') {
                    currentFileHandle = handle;
                }
            }
        }
    } catch (err) {
        console.log("Could not get file handle:", err);
        // This is ok, we just won't have a handle for direct saves
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Parse the JSON data
            const progressData = JSON.parse(e.target.result);
            
            // Clear existing textboxes first
            clearAllTextBoxes();
            
            // Restore app state
            Object.assign(storedValues, progressData.storedValues);
            
            // Restore benchmark values
            burdenValue = progressData.burdenValue || 4.7;
            spacingValue = progressData.spacingValue || 5.2;
            stemmingValue = progressData.stemmingValue || 3.2;
            
            // Restore tolerance values if available
            if (progressData.burdenTolerance !== undefined) burdenTolerance = progressData.burdenTolerance;
            if (progressData.spacingTolerance !== undefined) spacingTolerance = progressData.spacingTolerance;
            if (progressData.stemmingTolerance !== undefined) stemmingTolerance = progressData.stemmingTolerance;
            if (progressData.lengthTolerance !== undefined) lengthTolerance = progressData.lengthTolerance;
            
            // Restore imported file name
            importedFileName = progressData.importedFileName || 'QAQC';
            
            // Restore jsonData if available
            jsonData = progressData.jsonData;
            
            // Restore chartData if available
            if (progressData.chartData) {
                chartData = progressData.chartData;
            }
            
            // Restore settings if available
            if (progressData.pointRadius !== undefined) {
                pointRadius = progressData.pointRadius;
            }
            
            if (progressData.labelOffsetX !== undefined) {
                labelOffsetX = progressData.labelOffsetX;
            }
            
            if (progressData.labelOffsetY !== undefined) {
                labelOffsetY = progressData.labelOffsetY;
            }
            
            // Restore theme if available
            if (progressData.theme) {
                changeTheme(progressData.theme);
            }
            
            // Plot data if available
            if (jsonData) {
                plotData(jsonData);
                // Update point size after plotting
                updatePointSize();
            }
            
            // Update point colors
            updateChartColors();
            
            // Restore UI state - Insights
            if (progressData.insightsVisible) {
                insightsVisible = true;
                document.getElementById('insightsButton').classList.add('active');
                
                // If we have saved compliance data, restore it directly
                if (progressData.complianceData) {
                    document.getElementById('burdenCompliance').innerHTML = progressData.complianceData;
                    document.getElementById('complianceContainer').style.display = 'block';
                } else {
                    // Otherwise recalculate
                    calculateInsights();
                    document.getElementById('complianceContainer').style.display = 'block';
                }
            }
            
            // Restore UI state - IDs
            if (progressData.idsVisible) {
                idsVisible = true;
                document.getElementById('toggleIdsButton').classList.add('active');
                displayBoreholeIds();
            }
            
            // Restore UI state - Lengths
            if (progressData.lengthsVisible) {
                lengthsVisible = true;
                document.getElementById('toggleLengthsButton').classList.add('active');
                displayBoreholeLengths();
            }
            
            showToast("Progress loaded successfully!");
        } catch (error) {
            console.error("Error loading progress file:", error);
            showToast("Error loading progress file. The file may be corrupted.");
        } finally {
            showLoading(false);
        }
    };
    
    reader.onerror = function() {
        showLoading(false);
        showToast("Error reading progress file. Please try again.");
    };
    
    reader.readAsText(file);
}

// Function to display saved input boxes for points with data
function displaySavedInputBoxes() {
    if (!myChart) return;
    
    // Wait a short moment for the chart to be fully rendered
    setTimeout(() => {
        // For each dataset in the chart
        myChart.data.datasets.forEach((dataset, datasetIndex) => {
            // For each point in the dataset
            dataset.data.forEach((chartPoint, index) => {
                // Check if we have stored data for this point
                const storedPoint = storedValues[datasetIndex]?.[index];
                
                // Check if the point has any inputted data (burden, spacing, stemming, or length)
                if (storedPoint && (
                    storedPoint.burden !== undefined || 
                    storedPoint.spacing !== undefined || 
                    storedPoint.stemming !== undefined || 
                    storedPoint.length !== undefined
                )) {
                    // Get pixel position for this point
                    const xScale = myChart.scales.x;
                    const yScale = myChart.scales.y;
                    
                    const x = xScale.getPixelForValue(chartPoint.x);
                    const y = yScale.getPixelForValue(chartPoint.y);
                    
                    // Create a position object
                    const position = { x, y };
                    
                    // Show the text box with the stored values
                    showTextBox(position, datasetIndex, index);
                }
            });
        });
    }, 300); // Short delay to ensure chart is fully rendered
}

// Function to clear all open text boxes
function clearAllTextBoxes() {
    const textBoxes = document.querySelectorAll('.text-box');
    textBoxes.forEach(textBox => {
        if (textBox.parentNode) {
            textBox.parentNode.removeChild(textBox);
        }
    });
}

// Add footer with page number and date
function addFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Get page dimensions
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // Set font for footer
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        
        // Add page number on left bottom
        doc.text(String(i), 15, pageHeight - 10);
        
        // Add current date on right bottom in DD-MM-YYYY format
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateString = `${day}-${month}-${year}`;
        
        doc.text(dateString, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }
}

// Function to draw a simplified donut chart with percentage-based fill
function drawDonutChart(doc, x, y, radius, percentage, title) {
    // Center point
    const centerX = x;
    const centerY = y;
    
    // Colors based on percentage
    const fillColor = percentage >= 80 ? [0, 128, 0] : [255, 0, 0]; // Green if ≥80%, Red if <80%
    
    // Draw outer circle (gray background)
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(200, 200, 200);
    doc.circle(centerX, centerY, radius, 'F');
    
    // For percentage fill, we'll use a single sector instead of multiple triangles
    if (percentage > 0) {
        // Calculate the angle for the percentage
        const fullCircle = 2 * Math.PI;
        const arcAngle = (percentage / 100) * fullCircle;
        
        // Start at top (-90 degrees) and go clockwise
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + arcAngle;
        
        // Draw a sector using a clipping region and filled rectangle
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        
        // We need to use a special approach to avoid visible lines
        // Draw a complete donut segment as a single shape
        if (percentage >= 100) {
            // For 100%, just fill the entire outer circle
            doc.circle(centerX, centerY, radius, 'F');
        } else {
            // For partial fill, use the arc/sector approach
            // This creates a sector with no visible internal lines
            doc.saveGraphicsState();
            
            // Create a path for the sector
            doc.moveTo(centerX, centerY);
            doc.lineTo(centerX, centerY - radius); // Start at top
            
            // Draw the arc
            const arcSegments = 36;
            const angleStep = arcAngle / arcSegments;
            for (let i = 1; i <= arcSegments; i++) {
                const angle = startAngle + (i * angleStep);
                // Stop if we've exceeded the percentage
                if (angle > endAngle) break;
                
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                doc.lineTo(x, y);
            }
            
            // Close back to center
            doc.lineTo(centerX, centerY);
            
            // Fill the path
            doc.fill();
            doc.restoreGraphicsState();
        }
    }
    
    // Draw inner circle (white center)
    doc.setFillColor(255, 255, 255);
    doc.circle(centerX, centerY, radius * 0.6, 'F');
    
    // Add percentage text in center
    const percentText = `${percentage.toFixed(1)}%`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.text(percentText, centerX, centerY + 4, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0);
}

// Function to draw bar chart in PDF
function drawBarChart(doc, x, y, width, height, data, labels, tolerance, title) {
    // Define chart area
    const chartX = x;
    const chartY = y;
    const chartWidth = width;
    const chartHeight = height;
    
    // Draw chart border
    doc.setDrawColor(0);
    doc.rect(chartX, chartY, chartWidth, chartHeight);
    
    // Draw title
    doc.setFontSize(12); // Match font size with text sections
    doc.setFont('helvetica', 'bold');
    doc.text(title, chartX + chartWidth / 2, chartY - 2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    // Find max value for scaling
    const maxValue = Math.max(tolerance * 1.5, ...data.map(val => Math.abs(val)));
    
    // Draw horizontal center line (zero line)
    const zeroY = chartY + chartHeight / 2;
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(chartX, zeroY, chartX + chartWidth, zeroY);
    
    // Draw tolerance lines
    doc.setDrawColor(255, 0, 0); // Red for tolerance lines
    doc.setLineWidth(0.3);
    
    // Positive tolerance line
    const posToleranceY = zeroY - (tolerance / maxValue) * (chartHeight / 2);
    doc.line(chartX, posToleranceY, chartX + chartWidth, posToleranceY);
    
    // Negative tolerance line
    const negToleranceY = zeroY + (tolerance / maxValue) * (chartHeight / 2);
    doc.line(chartX, negToleranceY, chartX + chartWidth, negToleranceY);
    
    // Reset drawing color
    doc.setDrawColor(0);
    
    // Calculate bar width
    const maxBars = 20; // Maximum number of bars to show
    const numBars = Math.min(data.length, maxBars);
    const barWidth = chartWidth / (numBars * 1.5); // Account for spacing
    
    // Draw bars
    for (let i = 0; i < numBars; i++) {
        const barX = chartX + (i * chartWidth / numBars) + (chartWidth / numBars - barWidth) / 2;
        const value = data[i];
        
        // Determine bar height and position
        let barHeight, barY;
        if (value >= 0) {
            barHeight = (value / maxValue) * (chartHeight / 2);
            barY = zeroY - barHeight;
        } else {
            barHeight = (Math.abs(value) / maxValue) * (chartHeight / 2);
            barY = zeroY;
        }
        
        // Set bar color based on whether it's within tolerance
        if (Math.abs(value) <= tolerance) {
            doc.setFillColor(0, 128, 0); // Green for within tolerance
        } else {
            doc.setFillColor(255, 0, 0); // Red for outside tolerance
        }
        
        // Draw the bar
        doc.rect(barX, barY, barWidth, barHeight, 'F');
        
        // Add value label
        doc.setFontSize(8);
        doc.setTextColor(0);
        doc.text(value.toFixed(1), barX + barWidth/2, value >= 0 ? barY - 1 : barY + barHeight + 3, { align: 'center' });
    }
    
    // Add tolerance annotation
    doc.setFontSize(9);
    doc.text(`+${tolerance.toFixed(1)}`, chartX + chartWidth + 2, posToleranceY);
    doc.text(`-${tolerance.toFixed(1)}`, chartX + chartWidth + 2, negToleranceY);
    
    // Reset text color
    doc.setTextColor(0);
}

// Improved addRawDataTable function to ensure it works properly
function addRawDataTable(doc, data, startX, startY) {
    // Don't start a new page, continue on current page
    // Add table title with some spacing from the previous section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Raw Data Table", 105, startY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    // Simple table settings
    const rowHeight = 10;
    const colWidth = 30;
    const tableX = 15;
    const tableY = startY + 10;
    
    // Define column headers
    const headers = ['ID', 'Burden', 'Spacing', 'Stemming', 'Length', 'Plan Length'];
    
    // Set black headers with white text
    doc.setDrawColor(0); // Black lines
    doc.setFillColor(0); // Black background
    doc.rect(tableX, tableY, colWidth * headers.length, rowHeight, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text for headers
    headers.forEach((header, i) => {
        doc.text(header, tableX + (i * colWidth) + (colWidth / 2), tableY + (rowHeight / 2) + 3, { align: 'center' });
        
        // Draw vertical lines between columns (black)
        if (i > 0) {
            doc.setDrawColor(0); // Black lines
            doc.line(tableX + (i * colWidth), tableY, tableX + (i * colWidth), tableY + rowHeight);
        }
    });
    
    // Reset text color for data rows
    doc.setTextColor(0);
    
    // Draw horizontal line after headers (black)
    doc.setDrawColor(0); // Black lines
    doc.line(tableX, tableY + rowHeight, tableX + (colWidth * headers.length), tableY + rowHeight);
    
    // Draw vertical borders (black)
    doc.line(tableX, tableY, tableX, tableY + rowHeight);
    doc.line(tableX + (colWidth * headers.length), tableY, tableX + (colWidth * headers.length), tableY + rowHeight);
    
    // Draw top border (black)
    doc.line(tableX, tableY, tableX + (colWidth * headers.length), tableY);
    
    // Calculate the max rows that can fit on the remaining page space
    const pageHeight = doc.internal.pageSize.height;
    const remainingSpace = pageHeight - tableY - 20; // 20mm margin at bottom
    const maxRowsPerPage = Math.floor(remainingSpace / rowHeight);
    
    // Limit rows to fit on current page
    const maxRows = Math.min(maxRowsPerPage, data.length);
    
    // Draw data rows
    doc.setFont('helvetica', 'normal');
    
    for (let i = 0; i < maxRows; i++) {
        const rowY = tableY + rowHeight + (i * rowHeight);
        
        // Draw row bottom border (black)
        doc.setDrawColor(0); // Black lines
        doc.line(tableX, rowY + rowHeight, tableX + (colWidth * headers.length), rowY + rowHeight);
        
        // Draw row left border (black)
        doc.line(tableX, rowY, tableX, rowY + rowHeight);
        
        // Draw row right border (black)
        doc.line(tableX + (colWidth * headers.length), rowY, tableX + (colWidth * headers.length), rowY + rowHeight);
        
        // Format and add cell data
        const formatValue = (val) => {
            if (val === undefined || val === null || val === '') return '-';
            return typeof val === 'number' ? val.toFixed(1) : val.toString();
        };
        
        // ID - removed character limit to show full ID
        doc.text(formatValue(data[i].id), tableX + (colWidth / 2), rowY + (rowHeight / 2) + 3, { align: 'center' });
        doc.line(tableX + colWidth, rowY, tableX + colWidth, rowY + rowHeight);
        
        // Burden
        doc.text(formatValue(data[i].burden), tableX + colWidth + (colWidth / 2), rowY + (rowHeight / 2) + 3, { align: 'center' });
        doc.line(tableX + (colWidth * 2), rowY, tableX + (colWidth * 2), rowY + rowHeight);
        
        // Spacing
        doc.text(formatValue(data[i].spacing), tableX + (colWidth * 2) + (colWidth / 2), rowY + (rowHeight / 2) + 3, { align: 'center' });
        doc.line(tableX + (colWidth * 3), rowY, tableX + (colWidth * 3), rowY + rowHeight);
        
        // Stemming
        doc.text(formatValue(data[i].stemming), tableX + (colWidth * 3) + (colWidth / 2), rowY + (rowHeight / 2) + 3, { align: 'center' });
        doc.line(tableX + (colWidth * 4), rowY, tableX + (colWidth * 4), rowY + rowHeight);
        
        // Length
        doc.text(formatValue(data[i].length), tableX + (colWidth * 4) + (colWidth / 2), rowY + (rowHeight / 2) + 3, { align: 'center' });
        doc.line(tableX + (colWidth * 5), rowY, tableX + (colWidth * 5), rowY + rowHeight);
        
        // Plan Length
        doc.text(formatValue(data[i].planLength), tableX + (colWidth * 5) + (colWidth / 2), rowY + (rowHeight / 2) + 3, { align: 'center' });
    }
    
    // Add note if there are more rows
    if (data.length > maxRows) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`* Showing ${maxRows} of ${data.length} rows`, tableX, tableY + rowHeight * (maxRows + 1) + 5);
    }
}

// Function to calculate metrics for a given parameter
function calculateMetrics(paramName, targetValue, tolerance) {
    let total = 0, good = 0, sum = 0, max = -Infinity, min = Infinity;
    let above = 0, below = 0;
    
    Object.values(storedValues).forEach(dataset => {
        Object.values(dataset).forEach(point => {
            if (point[paramName] !== undefined) {
                total++;
                sum += point[paramName];
                if (Math.abs(point[paramName] - targetValue) <= tolerance) good++;
                if (point[paramName] > max) max = point[paramName];
                if (point[paramName] < min) min = point[paramName];
                if (point[paramName] > targetValue + tolerance) above++;
                if (point[paramName] < targetValue - tolerance) below++;
            }
        });
    });
    
    return {
        total: total,
        good: good,
        sum: sum,
        avg: total > 0 ? sum / total : 0,
        max: max,
        min: min,
        above: above,
        below: below,
        compliance: total > 0 ? (good / total) * 100 : 0
    };
}

// Helper function to calculate metrics for length (which uses plan length)
function calculateMetricsForLength() {
    let total = 0, good = 0, sum = 0, max = -Infinity, min = Infinity;
    let above = 0, below = 0;
    
    Object.values(storedValues).forEach(dataset => {
        Object.values(dataset).forEach(point => {
            if (point.length !== undefined && point.planLength !== undefined && !isNaN(point.planLength)) {
                total++;
                sum += point.length;
                if (Math.abs(point.length - point.planLength) <= lengthTolerance) good++;
                if (point.length > max) max = point.length;
                if (point.length < min) min = point.length;
                if (point.length > point.planLength + lengthTolerance) above++;
                if (point.length < point.planLength - lengthTolerance) below++;
            }
        });
    });
    
    return {
        total: total,
        good: good,
        sum: sum,
        avg: total > 0 ? sum / total : 0,
        max: max,
        min: min,
        above: above,
        below: below,
        compliance: total > 0 ? (good / total) * 100 : 0
    };
}

// Functions for point size control
function increasePointSize() {
    if (pointRadius < 20) {
        pointRadius += 1;
        updatePointSize();
    }
}

function decreasePointSize() {
    if (pointRadius > 3) {
        pointRadius -= 1;
        updatePointSize();
    }
}

function updatePointSize() {
    if (myChart) {
        myChart.data.datasets.forEach(dataset => {
            dataset.pointRadius = pointRadius;
        });
        myChart.update();
    }
}

// Functions for label position control
function moveLabelUp() {
    labelOffsetY -= 5;
    updateLabelPositions();
}

function moveLabelDown() {
    labelOffsetY += 5;
    updateLabelPositions();
}

function moveLabelLeft() {
    labelOffsetX -= 5;
    updateLabelPositions();
}

function moveLabelRight() {
    labelOffsetX += 5;
    updateLabelPositions();
}

function updateLabelPositions() {
    // If labels are visible, refresh them with the new position
    updateLabelsIfVisible();
}

// Function to show toast notification
function showToast(message) {
    // Check if there's an existing toast
    let toast = document.querySelector('.toast-message');
    
    // If not, create one
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-message';
        document.body.appendChild(toast);
    }
    
    // Set message and show
    toast.textContent = message;
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Updated downloadPDFBtn event listener
function downloadPDF() {
    try {
        const { jsPDF } = window.jspdf;
        
        // Create PDF with portrait orientation for better layout
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Check if we have insights to display
        const insightsElement = document.getElementById("insightsContent");
        if (!insightsElement || insightsElement.innerText.trim() === "") {
            alert("Please generate insights first by clicking the lightbulb icon.");
            return;
        }

        // Set font size and initial positions
        doc.setFontSize(12);
        let startX = 15; // Increase left margin a bit
        let startY = 30; // Starting position after title
        const textWidth = 85; // Width allocated for text
        const chartWidth = 85; // Width allocated for charts
        const chartHeight = 50; // Height for each chart
        const sectionGap = 15; // Gap between sections
        
        // Customize title based on imported filename
        const reportTitle = `${importedFileName} Analysis Report`;
        
        // Add title at the top of the document
        doc.setFontSize(18); // Slightly larger title
        doc.setFont('helvetica', 'bold');
        doc.text(reportTitle, 105, 15, { align: 'center' });
        doc.setFontSize(12);
    
        // Get values for plotting
        // burdenValue, spacingValue, stemmingValue are already set as global variables
        // Use the tolerance values defined in the settings dialog
        // burdenTolerance, spacingTolerance, stemmingTolerance, lengthTolerance are already set

        // Collect data for plotting
        const plotData = {
            burden: [],
            spacing: [],
            stemming: [],
            length: []
        };

        // Collect IDs for labels
        const plotLabels = {
            burden: [],
            spacing: [],
            stemming: [],
            length: []
        };

        // Iterate through stored values to gather plot data
        Object.values(storedValues).forEach(dataset => {
            Object.values(dataset).forEach(point => {
                if (point.burden !== undefined) {
                    plotData.burden.push(point.burden - burdenValue);
                    plotLabels.burden.push(point.id || '');
                }
                if (point.spacing !== undefined) {
                    plotData.spacing.push(point.spacing - spacingValue);
                    plotLabels.spacing.push(point.id || '');
                }
                if (point.stemming !== undefined) {
                    plotData.stemming.push(point.stemming - stemmingValue);
                    plotLabels.stemming.push(point.id || '');
                }
                if (point.length !== undefined && point.planLength !== undefined && !isNaN(point.planLength)) {
                    plotData.length.push(point.length - point.planLength);
                    plotLabels.length.push(point.id || '');
                }
            });
        });

        // Function to add a metric section
        function addMetricSection(title, data, labels, targetValue, tolerance, metricData) {
            try {
                // Add section title
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(title, startX, startY);
                doc.setFont('helvetica', 'normal');
                
                const textStartY = startY + 7;
                
                // Add metric text information
                doc.setFontSize(12); // Ensure consistent font size for all text
                const complianceText = `Compliance: ${metricData.compliance.toFixed(1)}%`;
                doc.text(complianceText, startX, textStartY);
                doc.text(`Measurements: ${metricData.total}`, startX, textStartY + 7);
                doc.text(`Average: ${metricData.avg.toFixed(1)}`, startX, textStartY + 14);
                doc.text(`Max: ${metricData.max !== -Infinity ? metricData.max.toFixed(1) : 'N/A'}`, startX, textStartY + 21);
                doc.text(`Min: ${metricData.min !== Infinity ? metricData.min.toFixed(1) : 'N/A'}`, startX, textStartY + 28);
                
                // Add specific text based on the metric type
                if (title === "LENGTH") {
                    doc.text(`Overdrill: ${metricData.above}`, startX, textStartY + 35);
                    doc.text(`Underdrill: ${metricData.below}`, startX, textStartY + 42);
                } else {
                    doc.text(`Above ${(targetValue + tolerance).toFixed(1)}: ${metricData.above}`, startX, textStartY + 35);
                    doc.text(`Below ${(targetValue - tolerance).toFixed(1)}: ${metricData.below}`, startX, textStartY + 42);
                }

                // Create deviation chart - align top with compliance text
                if (data.length > 0) {
                    // Calculate position for the bar chart
                    const barChartX = startX + textWidth + 25; // Add space for donut chart
                    
                    drawBarChart(
                        doc, 
                        barChartX, 
                        textStartY - 7, // Align with compliance text 
                        chartWidth - 25, // Make slightly narrower to accommodate donut
                        chartHeight, 
                        data, 
                        labels,
                        tolerance,
                        `${title} Deviation`
                    );
                    
                    // Draw donut chart between text and bar chart
                    drawDonutChart(
                        doc,
                        startX + textWidth - 10, // Position between text and bar chart
                        textStartY + 18, // Center vertically
                        22, // Donut size
                        metricData.compliance, // Percentage for donut
                        title // For the chart label
                    );
                }
                
                // Add section separator - bold line
                startY += 65; // Move down after the section
                doc.setLineWidth(0.8); // Make line bolder
                doc.line(startX, startY - 10, startX + textWidth + chartWidth, startY - 10);
                startY += sectionGap; // Add gap after separator
            } catch (error) {
                console.error("Error in addMetricSection:", error);
            }
        }

        // Calculate and add Burden section
        let burdenMetrics = calculateMetrics('burden', burdenValue, burdenTolerance);
        addMetricSection("BURDEN", plotData.burden, plotLabels.burden, burdenValue, burdenTolerance, burdenMetrics);

        // Calculate and add Spacing section
        let spacingMetrics = calculateMetrics('spacing', spacingValue, spacingTolerance);
        addMetricSection("SPACING", plotData.spacing, plotLabels.spacing, spacingValue, spacingTolerance, spacingMetrics);

        // Add new page if needed
        if (startY > 230) {
            doc.addPage();
            startY = 30;
        }

        // Calculate and add Stemming section
        let stemmingMetrics = calculateMetrics('stemming', stemmingValue, stemmingTolerance);
        addMetricSection("STEMMING", plotData.stemming, plotLabels.stemming, stemmingValue, stemmingTolerance, stemmingMetrics);

        // Add new page if needed
        if (startY > 230) {
            doc.addPage();
            startY = 30;
        }

        // Calculate and add Length section
        let lengthMetrics = calculateMetricsForLength();
        addMetricSection("LENGTH", plotData.length, plotLabels.length, 0, lengthTolerance, lengthMetrics);
        
        // Add some space before the table
        startY += 10;
        
        // Prepare data for raw data table
        const tableData = [];
        Object.values(storedValues).forEach(dataset => {
            Object.values(dataset).forEach(point => {
                // Only include points that have at least one value entered
                if (point.burden !== undefined || point.spacing !== undefined || 
                    point.stemming !== undefined || point.length !== undefined) {
                    tableData.push({
                        id: point.id || '',
                        burden: point.burden,
                        spacing: point.spacing,
                        stemming: point.stemming,
                        length: point.length,
                        planLength: point.planLength
                    });
                }
            });
        });
        
        // Add raw data table if we have data
        if (tableData.length > 0) {
            // If there's not enough space on current page for title + at least a few rows, go to next page
            const remainingSpace = doc.internal.pageSize.height - startY - 30; // 30mm for title + some rows
            if (remainingSpace < 50) { // not enough space for title + a few rows
                doc.addPage();
                startY = 30;
            }
            addRawDataTable(doc, tableData, startX, startY);
        }

        // Save PDF with footer
        addFooter(doc);
        
        // Use the custom filename for the PDF export
        doc.save(`${reportTitle}.pdf`);
        
    } catch (error) {
        console.error("PDF generation error:", error);
        alert("There was an error generating the PDF. Please check the console for details.");
    }
}
