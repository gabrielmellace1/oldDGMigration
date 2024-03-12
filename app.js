const express = require('express');
const http = require('http-server');


 const app = express();
 app.use(express.json());
 app.use(express.static('public'));



const port = process.env.PORT || 3001;
 app.listen(port, () => console.log(`Server running on port ${port}`));
