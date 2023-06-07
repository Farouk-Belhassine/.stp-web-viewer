async function LoadGeometry() {
    // init occt-import-js
    const occt = await occtimportjs();
  
    // download a step file
    let fileUrl = '.stp files/cube.stp';
    let response = await fetch(fileUrl);
    let buffer = await response.arrayBuffer();
  
    // read the imported step file
    let fileBuffer = new Uint8Array(buffer);
    let result = occt.ReadStepFile(fileBuffer, null);
  
    const jsonData = JSON.stringify(result);
  
    // Display the JSON data
    document.getElementById("json_data").innerHTML = jsonData;
  
    // Create a Blob object with the JSON data
    const blob = new Blob([jsonData], { type: 'text/plain' });
  
    // Create a temporary link element to download the file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileUrl+'.txt';
  
    // Programmatically trigger the download
    link.click();
  
    // Clean up the temporary link element
    URL.revokeObjectURL(link.href);
  }
  
  LoadGeometry();  