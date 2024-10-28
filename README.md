## Run



To run the project, you must run the following commands:

npm init -y

npm i webpack-cli -D

npm install firebase

Before building, add this under scripts for package.json:

"build": "webpack --mode=development"

When prompted to add to .gitignore press Yes

npm run build