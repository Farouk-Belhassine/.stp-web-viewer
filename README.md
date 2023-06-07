<h1>Basic .stp web viewer</h1>

<h2>Description</h2>
<p>This project allows you to visualize .stp (STEP) files in the browser using Three.js. It provides a simple web
  interface for loading and rendering 3D models from .stp files.</p>

<h2>Usage</h2>
<p>To use the project, follow these instructions:</p>
<ol>
  <li>Launch a local server to serve the project files. You can use Python's built-in HTTP server by running the
    following command in the project directory:
    <code>$ python3 -m http.server</code> (requires Python installation)
  </li>
  <li>Convert your desired .stp file to a .txt file using the provided <code>stpToJson.js</code> script. This script
    requires running in a server environment due to the dependency on the <code>occt-import.js</code> library and the
    associated WebAssembly file. Ensure that the server is running before executing the conversion script.</li>
  <li>Open a web browser and navigate to <code>http://localhost:8000</code> (or the appropriate server address) to
    access the project interface.</li>
</ol>

<h2>Author</h2>
<p>Farouk Belhassine</p>

<h2>Acknowledgments</h2>
<p> <a href="https://github.com/kovacsv/occt-import-js">occt-import.js</a> - The stp to json conversion library.</p>
<p> <a href="https://threejs.org/">three.js</a> - 3D library.</p>
<p>Special thanks to:</p>
<ul>
  <li><a href="https://github.com/kovacsv">Viktor Kovacs</a></li>
</ul>

<h2>Contributing</h2>
<p>Contributions are welcome! Fork the repository, create a new branch for your changes, and submit a pull request to
  contribute to the project.</p>

<h2>License</h2>
<p>This project is licensed under the MIT License. See the <code>LICENSE</code> file for more details.</p>