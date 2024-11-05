# Set Up
If this is your first time cloing into the reposistory, you must run the follwoing commands 


``` bash
npm init -y
npm i webpack-cli -D
npm install firebase
```

Before building, add the follwoing under the scripts for package.json:
"build": "webpack --mode=development"

When prompted to add to .gitignore press "Yes"
Lastly run the following to see application running


``` bash
npm run build
```
