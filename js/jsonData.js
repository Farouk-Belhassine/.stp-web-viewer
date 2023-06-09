async function fetchJsonData(url) {
    try {
        const response = await fetch(url);
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error('Error fetching JSON data:', error);
        return null;
    }
}
  
function jsonData() {
    const url = 'converted files/1551ABK.stp.txt'; // Replace with the actual path to your .txt file
    //const url = 'converted files/2023-04-17 - BERD - SWIVEL CRANE.stp.txt';
    //const url = 'converted files/cube.stp.txt';
  
    return fetchJsonData(url);
}  