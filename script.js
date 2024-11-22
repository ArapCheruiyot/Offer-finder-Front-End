// Event listener for the Search button
document.getElementById('searchBtn').addEventListener('click', function () {
    const customerNumber = document.getElementById('customerNumber').value.trim();
    
    if (customerNumber === '') {
        alert('Please enter a customer number to search.');
        return;
    }

    // Backend URL where the Excel files are hosted
    const backendUrl = 'https://arapcheruiyot.github.io/Offer-Back-End-Uploading/';

    // Fetch data from the backend and search for the customer number
    fetchOffersFromBackend(customerNumber, backendUrl);
});

// Function to fetch and search offers
async function fetchOffersFromBackend(customerNumber, backendUrl) {
    try {
        // Fetch the HTML content of the backend page
        const response = await fetch(backendUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch data from the backend.');
        }

        // Read the HTML content to find Excel file links
        const htmlContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Find links to Excel files on the backend page
        const fileLinks = Array.from(doc.querySelectorAll('a'))
            .map(link => link.href)
            .filter(href => href.endsWith('.xlsx'));

        if (fileLinks.length === 0) {
            alert('No Excel files found on the backend.');
            return;
        }

        // Iterate over each Excel file to search for the customer number
        for (const fileUrl of fileLinks) {
            const excelResponse = await fetch(fileUrl);
            const excelBlob = await excelResponse.blob();

            // Parse the Excel file
            const fileData = await excelBlob.arrayBuffer();
            const workbook = XLSX.read(fileData, { type: 'array' });

            // Assume the data is in the first sheet
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            // Search the customer number in the sheet data
            const foundEntry = searchForCustomerNumber(customerNumber, sheetData);

            if (foundEntry) {
                displaySearchResults(foundEntry);
                return; // Stop searching if a match is found
            }
        }

        // If no match is found after searching all files
        displayNoResults();

    } catch (error) {
        console.error('Error:', error);
        alert('There was an error fetching the data. Please try again later.');
    }
}

// Function to search for the customer number in Excel data
function searchForCustomerNumber(customerNumber, sheetData) {
    // Assume customer numbers are in a column named 'Customer Number'
    return sheetData.find(entry => entry['Customer Number'] === customerNumber);
}

// Function to display search results
function displaySearchResults(data) {
    document.querySelector('.results-section').style.display = 'block';
    document.getElementById('resultMessage').textContent = '';

    // Populate the results table with the found data
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = `
        <tr>
            <td>${data['Customer Number']}</td>
            <td>${data['Offer Details']}</td>
            <td>${data['Date']}</td>
            <td>${data['Uploader']}</td>
        </tr>
    `;
}

// Function to display no results message
function displayNoResults() {
    document.querySelector('.results-section').style.display = 'block';
    document.getElementById('resultMessage').textContent = 'No offers found for the given customer number.';
    document.getElementById('resultsBody').innerHTML = '';
}
